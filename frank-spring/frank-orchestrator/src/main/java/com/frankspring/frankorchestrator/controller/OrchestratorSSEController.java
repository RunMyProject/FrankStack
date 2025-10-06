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
 * Date: 05 October 2025
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
import com.frankspring.frankorchestrator.models.BookingMessage;
import com.frankspring.frankorchestrator.models.BookingContext;
import com.frankspring.frankorchestrator.models.User;
import com.frankspring.frankorchestrator.models.FillForm;
import com.frankspring.frankorchestrator.service.SagaStorageService;
import com.frankspring.frankorchestrator.service.SseEmitterManagerService;
import com.frankspring.frankorchestrator.models.SagaContext;
import com.frankspring.frankorchestrator.models.SagaStatus;

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
            // Extract "user" object from JSON
            Map<String, Object> userMap = (Map<String, Object>) requestBody.get("user");
            User user = User.builder()
                    .username((String) userMap.get("username"))
                    .userId((String) userMap.get("userId"))
                    .build();

            // Extract "fillForm" object from JSON using builder
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

            // Wrap into BookingContext using Lombok builder
            BookingContext bookingContext = BookingContext.builder()
                    .user(user)
                    .fillForm(fillForm)
                    .build();

            // Create saga in storage → returns BookingMessage with sagaCorrelationId
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
     * Retrieves the BookingMessage from storage and sends it to Kafka producer.
     */
    @GetMapping(value = "/{sagaCorrelationId}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamSagaExecution(@PathVariable String sagaCorrelationId) {
        System.out.println("🌊 [SSE] Stream requested for sagaCorrelationId: " + sagaCorrelationId);

        SseEmitter emitter = new SseEmitter(60_000L);
        sseEmitterManager.addEmitter(sagaCorrelationId, emitter);

        // Lifecycle management
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

            System.out.println("📋 [SSE] Retrieved BookingMessage: " + bookingMessage);

            bookingMessage.setStatus(SagaStatus.SAGA_IN_PROGRESS);
            sagaStorage.updateSaga(bookingMessage);

            // Send to Kafka producer through API Gateway
            // -------------------------------------------
            // Uses AppPropertiesComponent to retrieve the configured Kafka Producer port.
            // The endpoint now matches the API Gateway route (/kafka/send).
            // BookingMessage is sent as JSON, and errors are handled via SSE.
            String externalServiceUrl = "http://localhost:" 
                                        + appPropertiesComponent.getKafkaProducerPort() 
                                        + "/kafka/send";

            restTemplate.postForObject(externalServiceUrl, bookingMessage, String.class);
            System.out.println("✅ [ORCHESTRATOR] BookingMessage sent to producer successfully");

            // Notify SSE client
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
     * Continues an existing saga after the user selects a transport option.
     * 
     * Called by the frontend:
     * POST /frankorchestrator/sendbooktravel
     * Body: { "sagaCorrelationId": "...", "selectedTravelId": "..." }
     * 
     * RESPONSIBILITIES:
     * - Validate saga exists in Hazelcast
     * - Update BookingContext with user selection
     * - Re-emit BookingMessage to Kafka for hotel search
     * - Notify via SSE (if open)
     *
     * Author: Edoardo Sabatini
     * Date: 06 October 2025
     */
    @PostMapping("/sendbooktravel")
    public ResponseEntity<Map<String, Object>> sendBookTravel(
            @RequestBody Map<String, Object> requestBody) {

        System.out.println("➡️ [sendbooktravel] Request received");
        System.out.println("📦 [sendbooktravel] Body: " + requestBody);

        try {
            // 1️⃣ Extract sagaCorrelationId and selectedTravelId from body
            String sagaCorrelationId = (String) requestBody.get("sagaCorrelationId");
            String selectedTravelId = (String) requestBody.get("selectedTravelId");

            // 2️⃣ Retrieve saga from Hazelcast
            BookingMessage bookingMessage = sagaStorage.getSaga(sagaCorrelationId);
            if (bookingMessage == null) {
                System.err.println("❌ [sendbooktravel] Saga not found: " + sagaCorrelationId);
                return ResponseEntity.status(404).body(Map.of(
                        "status", "error",
                        "message", "Saga not found",
                        "sagaCorrelationId", sagaCorrelationId
                ));
            }

            // 3️⃣ Extract booking context and mode
            BookingContext bookingContext = bookingMessage.getBookingContext();
            String travelMode = bookingContext.getFillForm().getTravelMode();

            // 4️⃣ Update saga context with selected transport
            SagaContext sagaContext = SagaContext.builder()
                    .selectedTravelId(selectedTravelId)
                    .build();

            bookingMessage.setSagaContext(sagaContext);
            bookingMessage.setStatus(SagaStatus.TRANSPORT_CONFIRMED);
            sagaStorage.updateSaga(bookingMessage);

            System.out.println("✅ [sendbooktravel] Saga updated in Hazelcast: " + sagaCorrelationId);
            System.out.println("✈️ [sendbooktravel] Transport mode: " + travelMode + " | Selected ID: " + selectedTravelId);

            // 5️⃣ Send updated booking message to Kafka for hotel search
            String externalServiceUrl = "http://localhost:" 
                                        + appPropertiesComponent.getKafkaProducerPort() 
                                        + "/kafka/booktravel";

            restTemplate.postForObject(externalServiceUrl, bookingMessage, String.class);
            System.out.println("🚀 [sendbooktravel] BookingMessage re-emitted to Kafka (Hotel search step)");

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
                    "message", "Saga continued successfully",
                    "nextStep", "HOTEL_SEARCH",
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

}
