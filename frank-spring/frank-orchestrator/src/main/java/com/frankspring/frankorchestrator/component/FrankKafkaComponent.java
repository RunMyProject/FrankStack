package com.frankspring.frankorchestrator.component;

/**
 * FrankKafkaComponent.java
 * -----------------------
 * Kafka listener component for FrankStack Travel Kafka Saga Orchestrator.
 *
 * Author: Edoardo Sabatini
 * Date: 21 October 2025
 */

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.Map;

import com.frankspring.frankorchestrator.models.BookingMessage;
import com.frankspring.frankorchestrator.models.BookingResponse;
import com.frankspring.frankorchestrator.models.SagaStatus;
import com.frankspring.frankorchestrator.service.SagaStorageService;
import com.frankspring.frankorchestrator.service.SseEmitterManagerService;

import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class FrankKafkaComponent {

    @Autowired
    private SagaStorageService sagaStorage;

    @Autowired
    private SseEmitterManagerService sseEmitterManager;

    // Use Spring-injected ObjectMapper (configured in JacksonConfig with JavaTimeModule)
    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AppPropertiesComponent appPropertiesComponent;

    @Autowired
    private RestTemplate restTemplate;

    /**
     * 🎧 Kafka Listener
     * - Listens to responses on "frank-kafka-response-travel" topic
     * - Parses the full JSON message into BookingResponse
     * - Updates saga status in Hazelcast storage
     * - Emits SSE updates to frontend
     */
    @KafkaListener(topics = "frank-kafka-response-travel", groupId = "frank-kafka-group")
    public void listener(String jsonMessage) {
        System.out.println("📨 [KAFKA-LISTENER] Received JSON from Kafka: " + jsonMessage);

        try {
            // Deserialize JSON string to BookingResponse using injected mapper
            BookingResponse bookingResponse = objectMapper.readValue(jsonMessage, BookingResponse.class);
            String sagaCorrelationId = bookingResponse.getSagaCorrelationId();

            System.out.println("🔑 [KAFKA-LISTENER] Correlation ID: " + sagaCorrelationId);

            // Update status to CONFIRMED in saga storage
            BookingMessage bookingMessage = sagaStorage.getSaga(sagaCorrelationId);
            bookingMessage.setStatus(SagaStatus.CONFIRMED);
            sagaStorage.updateSaga(bookingMessage);

            // Emit SSE event to frontend (bookingResponse contains Java time types handled by mapper)
            sseEmitterManager.emit(sagaCorrelationId, Map.of(
                "message", "Consumer processing completed",
                "status", SagaStatus.CONFIRMED.name(),
                "sagaCorrelationId", sagaCorrelationId,
                "bookingMessage", bookingResponse,
                "timestamp", Instant.now().toString()
            ));

            System.out.println("✅ [KAFKA-LISTENER] Saga sent travel confirmed for: " + sagaCorrelationId);

        } catch (Exception e) {
            System.err.println("💥 [KAFKA-LISTENER] Error processing Kafka message: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * 🎧 Kafka Listener
     * - Listens to responses on "frank-kafka-response-book-travel" topic
     * - Parses the full JSON message into BookingMessage
     * - Updates saga status in Hazelcast storage
     * - Emits SSE updates to frontend
     *
     * NOTE: this flow emits transport confirmation but does NOT close the SSE stream,
     * since the saga may continue with further steps (hotel, payment, notifications, ...).
     */
    @KafkaListener(topics = "frank-kafka-response-book-travel", groupId = "frank-kafka-group")
    public void listenerBookTravel(String jsonMessage) {
        System.out.println("📨 [KAFKA-LISTENER listenerBookTravel] Received JSON from Kafka: " + jsonMessage);

        try {
            // Deserialize JSON string to BookingMessage using injected mapper
            BookingMessage bookingMessage = objectMapper.readValue(jsonMessage, BookingMessage.class);
            bookingMessage.setStatus(SagaStatus.TRANSPORT_CONFIRMED);

            String sagaCorrelationId = bookingMessage.getSagaCorrelationId();

            System.out.println("🔑 [KAFKA-LISTENER] Correlation ID: " + sagaCorrelationId);

            // Persist updated saga state
            sagaStorage.updateSaga(bookingMessage);

            // Emit SSE event to frontend, including the BookingMessage (with BookingEntry containing Instant)
            sseEmitterManager.emit(sagaCorrelationId, Map.of(
                "message", "Consumer transport confirmed (pre-booking, not paid)",
                "status", SagaStatus.TRANSPORT_CONFIRMED.name(),
                "sagaCorrelationId", sagaCorrelationId,
                "bookingMessage", bookingMessage,
                "timestamp", Instant.now().toString()
            ));

            // IMPORTANT: do NOT close the SSE stream here.
            // The orchestrator / frontend contract expects the stream to remain open for subsequent steps.

            System.out.println("✅ [KAFKA-LISTENER] Saga sent transport confirmed for: " + sagaCorrelationId);

            // 1️⃣ Send to Hotel producer
            String hotelServiceUrl = appPropertiesComponent.getKafkaHotelProducerUrl() + "/sendhotel";

            restTemplate.postForObject(hotelServiceUrl, bookingMessage, String.class);
            System.out.println("🚀 [listenerBookTravel] BookingMessage sent to Hotel producer: " + hotelServiceUrl);

            // 2️⃣ Notify SSE client
            sseEmitterManager.emit(sagaCorrelationId, Map.of(
                    "message", "Saga processing continued with hotel search started.",
                    "status", "processing",
                    "sagaCorrelationId", sagaCorrelationId,
                    "timestamp", Instant.now().toString()
            ));

        } catch (Exception e) {
            System.err.println("💥 [KAFKA-LISTENER] Error processing Kafka message: " + e.getMessage());
            e.printStackTrace();
        }
    }

}
