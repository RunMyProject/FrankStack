package com.frankspring.frankorchestrator.controller;

/**
 * OrchestratorSSEController.java
 * -----------------------
 * Saga Pattern SSE Orchestrator with Hazelcast Storage
 * 
 * TWO-STEP APPROACH:
 * 1. POST /frankorchestrator → Creates saga, stores in Hazelcast, returns sagaCorrelationId
 * 2. GET /frankorchestrator/{sagaCorrelationId}/stream → Executes saga with SSE updates
 * 
 * FEATURES:
 * - Stateless orchestration with Hazelcast distributed storage
 * - Real-time SSE streaming for saga execution
 * - Clean separation: storage vs execution
 * - REST call to external Kafka producer (port configured in AppPropertiesComponent)
 * - Kafka response handling via FrankKafkaListener
 * 
 * Author: Edoardo Sabatini
 * Date: 17 October 2025
 */

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;

import com.frankspring.frankorchestrator.component.AppPropertiesComponent;
import com.frankspring.frankorchestrator.models.*;
import com.frankspring.frankorchestrator.service.SagaStorageService;
import com.frankspring.frankorchestrator.service.SseEmitterManagerService;

@RestController
@RequestMapping("/frankorchestrator")
public class OrchestratorSSEController {

    @Autowired
    private AppPropertiesComponent appPropertiesComponent;

    @Autowired
    private SagaStorageService sagaStorage;

    @Autowired
    private SseEmitterManagerService sseEmitterManager;

    @Autowired
    private RestTemplate restTemplate;

    /**
     * Creates a new saga by extracting User and FillForm from the POST JSON,
     * stores the BookingContext in Hazelcast, and returns BookingMessage with sagaCorrelationId.
     */
    @PostMapping
    public ResponseEntity<Map<String, String>> createSaga(@RequestBody Map<String, Object> requestBody) {
        System.out.println("🚀 [POST] Creating new saga...");
        System.out.println("📦 [POST] Received booking context: " + requestBody);

        try {
            // Extract user object
            Map<String, Object> userMap = (Map<String, Object>) requestBody.get("user");
            User user = User.builder()
                    .username((String) userMap.get("username"))
                    .userId((String) userMap.get("userId"))
                    .build();

            // Extract fillForm object
            Map<String, Object> fillFormMap = (Map<String, Object>) requestBody.get("fillForm");
            FillForm fillForm = FillForm.builder()
                    .tripDeparture((String) fillFormMap.get("tripDeparture"))
                    .tripDestination((String) fillFormMap.get("tripDestination"))
                    .dateTimeRoundTripDeparture((String) fillFormMap.get("dateTimeRoundTripDeparture"))
                    .dateTimeRoundTripReturn((String) fillFormMap.get("dateTimeRoundTripReturn"))
                    .people((Integer) fillFormMap.getOrDefault("people", 0))
                    .durationOfStayInDays((Integer) fillFormMap.getOrDefault("durationOfStayInDays", 0))
                    .travelMode((String) fillFormMap.getOrDefault("travelMode", ""))
                    .budget(fillFormMap.get("budget") != null ? ((Number) fillFormMap.get("budget")).doubleValue() : 0.0)
                    .starsOfHotel((Integer) fillFormMap.getOrDefault("starsOfHotel", 0))
                    .luggages((Integer) fillFormMap.getOrDefault("luggages", 0))
                    .build();

            // Wrap into BookingContext
            BookingContext bookingContext = BookingContext.builder()
                    .user(user)
                    .fillForm(fillForm)
                    .build();

            // Create saga in storage
            BookingMessage bookingMessage = sagaStorage.createSaga(bookingContext);
            String sagaCorrelationId = bookingMessage.getSagaCorrelationId();

            System.out.println("✅ [POST] Saga created with sagaCorrelationId: " + sagaCorrelationId);

            return ResponseEntity.ok(Map.of(
                    "sagaCorrelationId", sagaCorrelationId,
                    "message", "Saga created successfully",
                    "streamUrl", "/frankorchestrator/" + sagaCorrelationId + "/stream"
            ));

        } catch (Exception e) {
            System.err.println("💥 [POST] Error processing booking context: " + e.getMessage());
            return ResponseEntity.status(400).body(Map.of(
                    "message", "Error creating saga",
                    "status", "error",
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Streams the saga execution via SSE.
     */
    @GetMapping(value = "/{sagaCorrelationId}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamSagaExecution(@PathVariable String sagaCorrelationId) {
        System.out.println("🌊 [SSE] Stream requested for sagaCorrelationId: " + sagaCorrelationId);

        SseEmitter emitter = new SseEmitter(60_000L);
        sseEmitterManager.addEmitter(sagaCorrelationId, emitter);

        emitter.onCompletion(() -> sseEmitterManager.removeEmitter(sagaCorrelationId));
        emitter.onTimeout(() -> {
            emitter.complete();
            sseEmitterManager.removeEmitter(sagaCorrelationId);
        });
        emitter.onError((e) -> sseEmitterManager.removeEmitter(sagaCorrelationId));

        try {
            BookingMessage bookingMessage = sagaStorage.getSaga(sagaCorrelationId);
            if (bookingMessage == null) {
                System.err.println("❌ [SSE] Saga not found: " + sagaCorrelationId);
                emitter.send(SseEmitter.event()
                        .data(Map.of("message", "Saga not found", "status", "error", "sagaCorrelationId", sagaCorrelationId))
                        .build());
                emitter.complete();
                return emitter;
            }

            bookingMessage.setStatus(SagaStatus.SAGA_IN_PROGRESS);
            sagaStorage.updateSaga(bookingMessage);

            String externalServiceUrl = "http://localhost:" 
                                        + appPropertiesComponent.getKafkaProducerPort() 
                                        + "/kafka/send";

            restTemplate.postForObject(externalServiceUrl, bookingMessage, String.class);
            System.out.println("✅ [ORCHESTRATOR] BookingMessage sent to producer successfully");

            emitter.send(SseEmitter.event()
                    .data(Map.of(
                            "message", "Saga processing started",
                            "status", "processing",
                            "sagaCorrelationId", sagaCorrelationId,
                            "timestamp", Instant.now().toString()
                    ))
                    .build());

        } catch (Exception e) {
            System.err.println("💥 [ORCHESTRATOR] Error sending BookingMessage: " + e.getMessage());
            try {
                emitter.send(SseEmitter.event()
                        .data(Map.of("message", "Error calling producer", "status", "error", "error", e.getMessage()))
                        .build());
                emitter.completeWithError(e);
            } catch (IOException ioException) {
                emitter.completeWithError(ioException);
            }
        }

        return emitter;
    }

    /**
     * sendBookTravel
     * -----------------------
     * Continues saga after user selects transport option.
     */
    @PostMapping("/sendbooktravel")
    public ResponseEntity<Map<String, Object>> sendBookTravel(@RequestBody Map<String, Object> requestBody) {

        System.out.println("➡️ [sendbooktravel] Request received");
        System.out.println("📦 [sendbooktravel] Body: " + requestBody);

        try {
            // 1️⃣ Extract sagaCorrelationId and selectedTravelId
            String sagaCorrelationId = (String) requestBody.get("sagaCorrelationId");
            String selectedTravelId = (String) requestBody.get("selectedTravelId");

            // 2️⃣ Retrieve saga
            BookingMessage bookingMessage = sagaStorage.getSaga(sagaCorrelationId);
            if (bookingMessage == null) {
                System.err.println("❌ [sendbooktravel] Saga not found: " + sagaCorrelationId);
                return ResponseEntity.status(404).body(Map.of(
                        "status", "error",
                        "message", "Saga not found",
                        "sagaCorrelationId", sagaCorrelationId
                ));
            }

            // 3️⃣ Extract booking context and travel mode
            BookingContext bookingContext = bookingMessage.getBookingContext();
            String travelMode = bookingContext.getFillForm().getTravelMode();

            // 4️⃣ Update saga context
            SagaContext sagaContext = SagaContext.builder()
                    .selectedTravelId(selectedTravelId)
                    .build();

            bookingMessage.setSagaContext(sagaContext);
            bookingMessage.setStatus(SagaStatus.TRANSPORT_CONFIRMED);
            sagaStorage.updateSaga(bookingMessage);

            System.out.println("✅ [sendbooktravel] Saga updated: " + sagaCorrelationId);
            System.out.println("✈️ [sendbooktravel] Transport mode: " + travelMode + " | Selected ID: " + selectedTravelId);

            // 5️⃣ Send to Kafka for hotel search
            String externalServiceUrl = "http://localhost:" 
                                        + appPropertiesComponent.getKafkaProducerPort() 
                                        + "/kafka/booktravel";

            restTemplate.postForObject(externalServiceUrl, bookingMessage, String.class);
            System.out.println("🚀 [sendbooktravel] BookingMessage sent to Kafka (hotel search)");

            // 6️⃣ Notify SSE client
            sseEmitterManager.emit(sagaCorrelationId, Map.of(
                    "message", "Transport confirmed. Hotel search started.",
                    "status", "processing",
                    "sagaCorrelationId", sagaCorrelationId,
                    "timestamp", Instant.now().toString()
            ));

            // 7️⃣ Return OK response
            return ResponseEntity.ok(Map.of(
                    "status", "ok",
                    "message", "Saga processing continued with hotel search started.",
                    "nextStep", "WAITING_FOR_HOTEL_SEARCH",
                    "sagaCorrelationId", sagaCorrelationId
            ));

        } catch (Exception e) {
            System.err.println("💥 [sendbooktravel] Error continuing saga: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                    "status", "error",
                    "message", "Internal server error",
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * sendBookHotel
     * -----------------------
     * Continues the Saga after the user selects a hotel option.
     * 
     * Flow:
     * 1️⃣ Extracts sagaCorrelationId and selectedHotelId from request.
     * 2️⃣ Retrieves existing saga from Hazelcast storage.
     * 3️⃣ Updates saga context with selected hotel and sets status to HOTEL_CONFIRMED.
     * 4️⃣ Sends updated BookingMessage to Kafka Hotel Producer.
     * 5️⃣ Notifies SSE client (hotel confirmed, payment step starting soon).
     * 6️⃣ Sends fictitious call to payment producer to simulate next saga step.
     * 7️⃣ Notifies SSE client for payment step.
     * 8️⃣ Adds extra logging for clarity.
     * 9️⃣ Returns OK response with next saga step indication.
     */
    @PostMapping("/sendbookhotel")
    public ResponseEntity<Map<String, Object>> sendBookHotel(@RequestBody Map<String, Object> requestBody) {

        System.out.println("➡️ [sendbookhotel] Request received");
        System.out.println("📦 [sendbookhotel] Body: " + requestBody);

        try {
            // 1️⃣ Extract sagaCorrelationId and selectedHotelId
            String sagaCorrelationId = (String) requestBody.get("sagaCorrelationId");
            String selectedHotelId = (String) requestBody.get("selectedHotelId");

            // 2️⃣ Retrieve saga
            BookingMessage bookingMessage = sagaStorage.getSaga(sagaCorrelationId);
            if (bookingMessage == null) {
                System.err.println("❌ [sendbookhotel] Saga not found: " + sagaCorrelationId);
                return ResponseEntity.status(404).body(Map.of(
                        "status", "error",
                        "message", "Saga not found",
                        "sagaCorrelationId", sagaCorrelationId
                ));
            }

            // 3️⃣ Update saga context with hotel selection
            SagaContext sagaContext = bookingMessage.getSagaContext();
            sagaContext.setSelectedHotelId(selectedHotelId);
            bookingMessage.setSagaContext(sagaContext);
            bookingMessage.setStatus(SagaStatus.HOTEL_CONFIRMED);
            sagaStorage.updateSaga(bookingMessage);

            System.out.println("✅ [sendbookhotel] Saga updated: " + sagaCorrelationId);
            System.out.println("🏨 [sendbookhotel] Selected Hotel ID: " + selectedHotelId);

            // 4️⃣ Send to Kafka for hotel confirmation
            String hotelServiceUrl = "http://localhost:" 
                                    + appPropertiesComponent.getKafkaProducerPort() 
                                    + "/kafka/bookhotel";
            restTemplate.postForObject(hotelServiceUrl, bookingMessage, String.class);
            System.out.println("🚀 [sendbookhotel] BookingMessage sent to Hotel producer: " + hotelServiceUrl);

            // 6️⃣ Notify SSE client
            sseEmitterManager.emit(sagaCorrelationId, Map.of(
                    "message", "Hotel confirmed.",
                    "status", "processing",
                    "sagaCorrelationId", sagaCorrelationId,
                    "timestamp", Instant.now().toString()
            ));

            // 7️⃣ Return OK response
            return ResponseEntity.ok(Map.of(
                    "status", "ok",
                    "message", "Saga processing continued with hotel confirmed and payment step (fictitious).",
                    "nextStep", "WAITING_FOR_PAYMENT",
                    "sagaCorrelationId", sagaCorrelationId
            ));

        } catch (Exception e) {
            System.err.println("💥 [sendbookhotel] Error continuing saga: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                    "status", "error",
                    "message", "Internal server error",
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * sendPaymentCard
     * -----------------------
     * Temporary endpoint for testing PaymentCardMessage POST requests.
     * 
     * Functionality:
     * 1️⃣ Logs the incoming payment JSON to console for inspection.
     * 2️⃣ Constructs a payload to simulate sending the payment to the AWS Lambda bridge.
     * 3️⃣ Performs an internal POST call to the AWS Lambda bridge endpoint (localhost:18081).
     * 4️⃣ Handles and logs any exceptions during the internal call.
     * 5️⃣ Returns an immediate OK response to the frontend with the received JSON.
     *
     * Note:
     * - This endpoint is primarily for local testing and integration of payment flow.
     */
    @PostMapping("/paymentsprocess")
    public ResponseEntity<Map<String, Object>> sendPaymentCard(@RequestBody Map<String, Object> paymentJson) {

        // 📤 Log the received payment JSON to console
        System.out.println("📤 [POST] Payment Details received:");
        paymentJson.forEach((key, value) -> System.out.println(key + ": " + value));

        // 🌐 Call the internal AWS Lambda bridge
        String awsServiceUrl = "http://localhost:18081/cardpayment/send";
        Map<String, Object> awsPayload = null;
        
        try {

                // 🔧 Build the payload for the AWS Lambda bridge (port 18081)
                Map<String, Object> context = Map.of(
                    "travelId", paymentJson.getOrDefault("travelId", "UNKNOWN"),
                    "hotelId", paymentJson.getOrDefault("hotelId", "NONE"),
                    "total", paymentJson.getOrDefault("amount", 0.0)
                );
                
                awsPayload = Map.of(
                     "sagaCorrelationId", paymentJson.getOrDefault("sagaCorrelationId", "NO_SAGA_ID"),
                     "myStripeToken", paymentJson.getOrDefault("myStripeToken", "unknown_token"),
                     "status", "CREATED",
                     "context", context
                );

                String sagaCorrelationId = (String) awsPayload.get("sagaCorrelationId");

                // 1️⃣ Notify SSE client
                sseEmitterManager.emit(sagaCorrelationId, Map.of(
                        "message", "Payment process started",
                        "status", "processing",
                        "sagaCorrelationId", sagaCorrelationId,
                        "timestamp", Instant.now().toString()
                ));

                String response = restTemplate.postForObject(awsServiceUrl, awsPayload, String.class);

                // ✅ Log the response from AWS bridge
                System.out.println("✅ [PAYMENT-BRIDGE] Response from AWS Lambda bridge: " + response);

                // 2️⃣ Notify SSE client
                sseEmitterManager.emit(sagaCorrelationId, Map.of(
                        "message", "AWS Lambda bridge Payment process invoked: " + response,
                        "status", "processing",
                        "sagaCorrelationId", sagaCorrelationId,
                        "timestamp", Instant.now().toString()
                ));

        } catch (Exception e) {
            // 💥 Log any error during the internal call
            System.err.println("💥 --------------------------------------------------------------------");
            System.err.println("💥 [PAYMENT-BRIDGE] Error calling AWS Lambda bridge:");
            System.err.println("💥 [PAYMENT-BRIDGE] URL:" + awsServiceUrl);
            System.err.println("💥 [PAYMENT-BRIDGE] awsPayload:" + awsPayload);
            if(e!=null) {
                e.printStackTrace();
                System.err.println("💥 [PAYMENT-BRIDGE] Error calling AWS Lambda bridge: " + e.getMessage());
                System.err.println("💥 --------------------------------------------------------------------");
            } else {
                    System.err.println("💥 --------------------------------------------------------------------");
                    System.err.println("💥 [PAYMENT-BRIDGE] This Error is null AFTER calling AWS Lambda bridge!");
                    System.err.println("💥 --------------------------------------------------------------------");
            }
        }

        // 🔄 Return OK to frontend immediately, while internal process is triggered
        return ResponseEntity.ok(Map.of(
            "status", "ok",
            "message", "Payment JSON received, logged, and internally sent to AWS bridge!",
            "receivedData", paymentJson
        ));
    }

}
