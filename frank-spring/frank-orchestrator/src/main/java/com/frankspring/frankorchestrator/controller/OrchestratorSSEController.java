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
 * Date: 08 October 2025
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

            // 7️⃣ Send to Hotel producer
            String hotelServiceUrl = "http://localhost:" 
                                    + appPropertiesComponent.getKafkaProducerPort() 
                                    + "/kafka/sendhotel";

            restTemplate.postForObject(hotelServiceUrl, bookingMessage, String.class);
            System.out.println("🚀 [sendbooktravel] BookingMessage sent to Hotel producer: " + hotelServiceUrl);

            // 8️⃣ Notify SSE client
            sseEmitterManager.emit(sagaCorrelationId, Map.of(
                    "message", "Saga processing continued with hotel search started.",
                    "status", "processing",
                    "sagaCorrelationId", sagaCorrelationId,
                    "timestamp", Instant.now().toString()
            ));

            // 9️⃣ Return OK response
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

            // 5️⃣ Notify SSE client
            sseEmitterManager.emit(sagaCorrelationId, Map.of(
                    "message", "Hotel confirmed. Payment step will start soon.",
                    "status", "processing",
                    "sagaCorrelationId", sagaCorrelationId,
                    "timestamp", Instant.now().toString()
            ));

            // 6️⃣ Fictitious call to start payment step
            String paymentServiceUrl = "http://localhost:" 
                                    + appPropertiesComponent.getKafkaProducerPort() 
                                    + "/kafka/startpayment";
            restTemplate.postForObject(paymentServiceUrl, bookingMessage, String.class);
            System.out.println("🚀 [sendbookhotel] Fictitious call sent to payment producer: " + paymentServiceUrl);

            // 7️⃣ Notify SSE client for payment step
            sseEmitterManager.emit(sagaCorrelationId, Map.of(
                    "message", "Saga processing continued with payment step (fictitious).",
                    "status", "processing",
                    "sagaCorrelationId", sagaCorrelationId,
                    "timestamp", Instant.now().toString()
            ));

            // 8️⃣ Extra logging
            System.out.println("📌 [sendbookhotel] Saga ongoing: hotel confirmed, payment step started (fictitious)");

            // 9️⃣ Return OK response
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

}
