package com.frankaws.service.payment.card.service;

// ================================================================
// LambdaInvokerService.java
// ------------------------------------------------
// Service class responsible for invoking the PaymentCard Lambda
//
// PURPOSE:
// • Serializes PaymentCardMessage objects and sends them to AWS Lambda
//   running on LocalStack for testing local producer/consumer flows.
// • Provides a reactive Mono<String> response for non-blocking API integration
// • Encapsulates all AWS SDK v2 Lambda logic in a single service
//
// TECH NOTES:
// • Uses AWS SDK v2 with LambdaClient configured for LocalStack endpoint
// • Reactive Mono from Reactor is used to wrap blocking invocation call
// • Any Lambda errors are mapped to RuntimeException for upstream handling
// • ObjectMapper handles JSON serialization of the payment message
//
// USAGE:
// • Injected in CardPaymentProducerController to handle '/cardpayment/send'
// • Returns a string with success message and Lambda payload ID
//
// Author: Edoardo Sabatini
// Date: 23 October 2025
// ================================================================

import com.frankaws.service.payment.card.component.AppPropertiesComponent;
import com.frankaws.service.payment.card.models.PaymentCardMessage;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.lambda.LambdaClient;
import software.amazon.awssdk.services.lambda.model.InvokeRequest;
import software.amazon.awssdk.services.lambda.model.InvokeResponse;

import java.net.URI;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class LambdaInvokerService {

    private final AppPropertiesComponent appPropertiesComponent;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private LambdaClient lambdaClient;

    public LambdaInvokerService(AppPropertiesComponent appPropertiesComponent) {
        this.appPropertiesComponent = appPropertiesComponent;

        System.out.println("🌐 Lambda Properties:");
        System.out.println("   LocalStack Region: " + appPropertiesComponent.getAwsRegion());
        System.out.println("   LocalStack Endpoint: " + appPropertiesComponent.getLocalstackEndpoint());
        System.out.println("   Lambda Name: " + appPropertiesComponent.getLambdaName());

        // Initialize Lambda client pointing to LocalStack
        lambdaClient = LambdaClient.builder()
                .endpointOverride(URI.create(appPropertiesComponent.getLocalstackEndpoint()))
                .region(Region.of(appPropertiesComponent.getAwsRegion()))
                .build();
    }

    /**
     * Serialize the payment message and invoke the PaymentCard Lambda on LocalStack.
     * @param message The payment payload received from the controller
     * @return Mono<String> containing the Lambda invocation result
     */
    public Mono<String> invokePaymentCardLambda(PaymentCardMessage message) {

        // === 1. Log correlation info ===
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        System.out.println("🪪 [" + timestamp + "] Correlation ID: " + message.getSagaCorrelationId());

        return Mono.fromCallable(() -> {

            // === 2. Serialize Java object into JSON bytes ===
            SdkBytes payload = SdkBytes.fromUtf8String(objectMapper.writeValueAsString(message));

            // === 3. Build the Lambda invocation request ===
            InvokeRequest request = InvokeRequest.builder()
                    .functionName(appPropertiesComponent.getLambdaName())
                    .payload(payload)
                    .build();

            // === 4. Execute synchronous call to Lambda (on LocalStack) ===
            InvokeResponse response = lambdaClient.invoke(request);

            // === 5. Decode payload returned by Lambda ===
            String result = response.payload().asUtf8String();

            if (response.functionError() != null) {
                throw new RuntimeException("Lambda Error: " + result);
            }

            // === 6. Return success message ===
            return "Lambda Invoked Successfully: " + result;

        }).onErrorMap(e -> new RuntimeException("Error during Lambda invocation", e));
    }
}
