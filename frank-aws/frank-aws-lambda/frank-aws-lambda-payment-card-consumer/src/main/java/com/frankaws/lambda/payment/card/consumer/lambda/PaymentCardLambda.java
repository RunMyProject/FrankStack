package com.frankaws.lambda.payment.card.consumer.lambda;

/**
 * PaymentCardLambda.java
 * ----------------------------------------
 * AWS Lambda for CardPayment consumer that processes SNS messages.
 *
 * This handler implements a key SAGA step: it processes the message, transitions
 * the status, and performs a critical HTTP callback (POST with JSON body) to the
 * Orchestrator, enforcing strong success/failure controls based on the HTTP response code.
 *
 * *************************************************************************
 * *** ARCHITECTURAL NOTE: LAMBDA VS SPRING BOOT (12-Factor Best Practice) ***
 * *************************************************************************
 * - 1. CONFLICT: AWS Lambda only calls the 'handleRequest' method (the Handler).
 * It DOES NOT execute the 'main' method or start the Spring IoC Container.
 *
 * - 2. RESULT: Dependency Injection (@Autowired) fails because the Spring Context
 * is never initialized, causing a NullPointerException for injected fields.
 *
 * - 3. SOLUTION (12-Factor App): Configuration must be retrieved from the runtime
 * environment via System.getenv("VARIABLE_NAME"), not through Spring's
 * configuration mechanism. This ensures configuration is externalized and
 * speeds up the Cold Start time.
 *
 * *************************************************************************
 * *** LOGGING NOTE: PHYSIOLOGICAL AWS LATENCY 🐌 ***
 * *************************************************************************
 * * After a successful Lambda invocation, especially following a Log Group
 * deletion, there is a physiological delay (🐌) on the AWS side (or
 * LocalStack) before the logs are flushed and fully readable. This requires
 * an extra wait time (e.g., 10 seconds) in the test script (borg-log-test.sh)
 * before querying the logs via 'aws logs filter-log-events'.
 *
 * *************************************************************************
 *
 * Author: Edoardo Sabatini
 * Date: 28 October 2025
 */

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.SNSEvent;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.frankaws.lambda.payment.card.consumer.models.PaymentCardMessage;
import com.frankaws.lambda.payment.card.consumer.models.PaymentSagaStatus;

import com.fasterxml.jackson.databind.JsonNode;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URI;

// The method returns Void. Failure is signaled by throwing a RuntimeException, 
// which triggers the AWS retry/DLQ mechanism for asynchronous invocation (SNS).
public class PaymentCardLambda implements RequestHandler<SNSEvent, Void> {

    // 12-Factor App: Configuration read from environment variable.
    private static final String ORCHESTRATOR_WEBHOOK_URL = System.getenv("ORCHESTRATOR_WEBHOOK_URL");

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public Void handleRequest(SNSEvent event, Context context) {

        String url = ORCHESTRATOR_WEBHOOK_URL;
        System.out.println("🌐 Callback URL: " + url);
        context.getLogger().log("🌐 Callback URL: " + url);

        context.getLogger().log("=== PaymentCardLambda Consumer Invoked ===");
        
        for (SNSEvent.SNSRecord record : event.getRecords()) {
            String jsonMessage = record.getSNS().getMessage();
            context.getLogger().log("Received JSON: " + jsonMessage);

            String invoiceUrl = null;
            String logMessage = null;

            try {
                // Read the JSON into a JsonNode first
                JsonNode jsonNode = (JsonNode)objectMapper.readTree(jsonMessage);
                PaymentCardMessage messageObject = objectMapper.treeToValue(jsonNode, PaymentCardMessage.class);

                // Se lo status è PENDING, convertilo a CREATED
                if (messageObject.getStatus() == null) {
                    String statusStr = jsonNode.get("status").asText();
                    if ("PENDING".equals(statusStr)) {
                        messageObject.setStatus(PaymentSagaStatus.CREATED);
                    }
                }
                
                // Generate invoice and get public URL
                System.out.println("🔄 Creating S3 invoice generator...");
                PaymentCardS3Invoice invoiceGenerator = new PaymentCardS3Invoice();
                System.out.println("🚀 Generating S3 invoice...");
                invoiceUrl = invoiceGenerator.generate(jsonMessage);
                
                if (invoiceUrl != null) {
                    System.out.println("✅ S3 Invoice URL: " + invoiceUrl);
                    context.getLogger().log("📄 Invoice URL: " + invoiceUrl);
                    logMessage += " | Invoice URL: " + invoiceUrl;
                    messageObject.setInvoiceUrl(invoiceUrl);
                } else {
                    System.out.println("❌ S3 Invoice generation returned null");
                    logMessage += " | Invoice URL: null";
                }

                // 1. SAGA State Transition: PROCESSING (Pre-call state)
                messageObject.setStatus(PaymentSagaStatus.PROCESSING);
                
                logMessage = String.format(
                        "Callback address: %s | Processing SAGA ID: %s | Status: %s | Total amount: %s  | Invoice URL: %s",
                        url,
                        messageObject.getSagaCorrelationId(),
                        messageObject.getStatus(),
                        messageObject.getContext() != null ? messageObject.getContext().getTotal() : "N/A"
                        , invoiceUrl
                );

                System.out.println("☕ " + logMessage);
                context.getLogger().log("☕ CUSTOM PRINT: " + logMessage);

                // 2. Execute the callback and get control result
                // The message object is passed so the callback can send its current state.
                boolean callbackSuccessful = performCallbackAndCheck(context, messageObject); 
                
                // 3. SAGA State Transition & Control Logic
                if (callbackSuccessful) {
                    messageObject.setStatus(PaymentSagaStatus.SUCCESS);
                    context.getLogger().log("✅ SAGA STATUS: SUCCESS. Message processed and callback executed.");
                    // Success: return Void naturally
                } else {
                    messageObject.setStatus(PaymentSagaStatus.FAILED);
                    context.getLogger().log("❌ SAGA STATUS: FAILED. Callback was unsuccessful.");
                    // Failure: Throw exception to signal AWS runtime to retry/DLQ
                    throw new RuntimeException("Callback failed: Cannot confirm step completion.");
                }

            } catch (Exception e) {
                System.err.println("💥 S3 Invoice failed with exception: " + e.getMessage());
                e.printStackTrace();
                context.getLogger().log("⚠️ S3 Invoice generation failed: " + e.getMessage());
                logMessage += " | Invoice URL: null";

                context.getLogger().log("❌ Critical Error processing message: " + e.getMessage());
                e.printStackTrace(System.err);
                // Re-throw exception to signal definite failure to AWS runtime
                throw new RuntimeException("PaymentCardLambda failed execution.", e);
            }
        }
        
        return null; 
    }

    /**
     * Executes the simulated delay, prepares the JSON payload, and performs the real HTTP call (Control).
     * * NOTE ON HTTP CLIENT CHOICE:
     * We **do not use Spring Boot's RestTemplate or WebClient** because the overhead 
     * of starting the full Spring context would cause unacceptable **cold start latency** * in the AWS Lambda environment. 
     * HttpURLConnection is the fastest, lightest Java native solution. 
     *
     * @param context AWS Lambda Context
     * @param messagePayload The PaymentCardMessage object to be sent as the body (JSON).
     * @return true if the callback succeeded (HTTP 2xx), false otherwise.
     */
    private boolean performCallbackAndCheck(Context context, PaymentCardMessage messagePayload) {
        final int SIMULATED_DELAY_MS = 2500;
        final String orchestratorCallbackUrl = ORCHESTRATOR_WEBHOOK_URL;
        
        try {
            //
            // Prepare the JSON payload to be sent (Serialization of the current message state)
            //
            String jsonInputString = objectMapper.writeValueAsString(messagePayload);
            
            context.getLogger().log("🐌 Initiating callback to orchestrator...");
            System.out.println("🌐 Callback URL: " + orchestratorCallbackUrl);
            System.out.println("➡️ Payload Size: " + jsonInputString.length() + " bytes");
            
            // --- EXPLICITLY SHOWING THE INPUT STRING USED FOR THE BODY ---
            System.out.println("🐌 INPUT_JSON_BODY = " + jsonInputString.substring(0, Math.min(jsonInputString.length(), 40)) + "...");
            // -------------------------------------------------------------
            
            // 1. Simulate external API call latency.
            System.out.println("🐌 Calling Orchestrator... (Simulated " + SIMULATED_DELAY_MS + "ms delay)");
            Thread.sleep(SIMULATED_DELAY_MS);
            
            // 2. Perform the actual HTTP call (Control)
            System.out.println("🔥 Executing real HTTP POST to: " + orchestratorCallbackUrl);
            
            // Using URI.toURL() to avoid deprecation warning on URL constructor
            URI uri = new URI(orchestratorCallbackUrl);
            URL url = uri.toURL();
            
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST"); 
            conn.setConnectTimeout(3000); // 3s connection timeout
            conn.setReadTimeout(3000);    // 3s read timeout
            
            // --- CRITICAL CONFIGURATION FOR POST BODY ---
            conn.setRequestProperty("Content-Type", "application/json; utf-8");
            conn.setRequestProperty("Accept", "application/json");
            conn.setDoOutput(true); // Must be true to open the OutputStream for writing
            
            // This is the step where the jsonInputString is written to the connection's output stream,
            // effectively setting the request body.
            try(OutputStream os = conn.getOutputStream()) {
                byte[] input = jsonInputString.getBytes("utf-8");
                os.write(input, 0, input.length);
            }
            // --- END CRITICAL CONFIGURATION ---

            // The request is implicitly executed here when fetching the response code
            int responseCode = conn.getResponseCode();
            conn.disconnect();
            
            // 3. Log completion
            System.out.println("🌐 Callback completed to: " + orchestratorCallbackUrl);
            context.getLogger().log("🌐 Callback completed to: " + orchestratorCallbackUrl);

            // 4. Control Check: Only HTTP 2xx is considered a successful step completion
            if (responseCode >= 200 && responseCode < 300) {
                 context.getLogger().log("✅ Callback successful. Response Code: " + responseCode);
                 return true; // SUCCESS
            } else {
                 context.getLogger().log("⚠️ Callback failed (External Service). Response Code: " + responseCode);
                 return false; // FAILURE (Non-2xx HTTP code)
            }            

        } catch (java.net.ConnectException e) {
            // EXPECTED failure since the orchestrator service is currently mocked/offline.
            context.getLogger().log("❌ Connection refused (EXPECTED Error): Orchestrator is offline. Message: " + e.getMessage());
            System.out.println("❌ Callback failed: Connection refused. (Expected)");
            return false;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            context.getLogger().log("⚠️ Callback interrupted: " + e.getMessage());
            return false;
        } catch (Exception e) {
            context.getLogger().log("❌ Error during real callback: " + e.getClass().getName() + " - " + e.getMessage());
            return false;
        }
    }
}
