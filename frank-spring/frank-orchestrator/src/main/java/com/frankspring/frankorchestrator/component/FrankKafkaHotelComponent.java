package com.frankspring.frankorchestrator.component;

/**
 * FrankKafkaComponent.java
 * -----------------------
 * Kafka listener component for FrankStack Travel Kafka Saga Orchestrator.
 *
 * CHANGES:
 * - 07 October 2025: Use injected ObjectMapper (configured with JavaTimeModule)
 *   to avoid Instant serialization errors.
 * - 07 October 2025: Do NOT close SSE stream on transport confirmation — keep
 *   emitting because saga may continue with further steps.
 *
 * Author: Edoardo Sabatini
 * Date: 08 October 2025
 */

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.Map;

import com.frankspring.frankorchestrator.models.BookingMessage;
import com.frankspring.frankorchestrator.models.HotelBookingResponse;
import com.frankspring.frankorchestrator.models.SagaStatus;
import com.frankspring.frankorchestrator.service.SagaStorageService;
import com.frankspring.frankorchestrator.service.SseEmitterManagerService;

import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class FrankKafkaHotelComponent {

    @Autowired
    private SagaStorageService sagaStorage;

    @Autowired
    private SseEmitterManagerService sseEmitterManager;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AppPropertiesComponent appPropertiesComponent;

    @Autowired
    private RestTemplate restTemplate;

    /**
     * 🎧 Kafka Listener
     * - Listens to responses on "frank-kafka-response-hotel" topic
     * - Parses the JSON message into BookingResponse
     * - Updates saga status in Hazelcast storage
     * - Emits SSE updates to frontend
     */
    @KafkaListener(topics = "frank-kafka-response-hotel", groupId = "frank-kafka-group")
    public void listenerHotel(String jsonMessage) {
        System.out.println("📨 [KAFKA-HOTEL-LISTENER] Received JSON from Kafka: " + jsonMessage);

        try {
            HotelBookingResponse hotelBookingResponse = objectMapper.readValue(jsonMessage, HotelBookingResponse.class);
            String sagaCorrelationId = hotelBookingResponse.getSagaCorrelationId();

            System.out.println("🔑 [KAFKA-HOTEL-LISTENER] Correlation ID: " + sagaCorrelationId);

            // Update saga status to HOTEL_CONFIRMED
            BookingMessage bookingMessage = sagaStorage.getSaga(sagaCorrelationId);
            bookingMessage.setStatus(SagaStatus.HOTEL_CONFIRMED);
            sagaStorage.updateSaga(bookingMessage);

            // Emit SSE update
            sseEmitterManager.emit(sagaCorrelationId, Map.of(
                    "message", "Hotel consumer processing completed",
                    "status", SagaStatus.HOTEL_CONFIRMED.name(),
                    "sagaCorrelationId", sagaCorrelationId,
                    "bookingMessage", hotelBookingResponse,
                    "timestamp", Instant.now().toString()
            ));

            System.out.println("✅ [KAFKA-HOTEL-LISTENER] Saga sent hotel confirmed for: " + sagaCorrelationId);

        } catch (Exception e) {
            System.err.println("💥 [KAFKA-HOTEL-LISTENER] Error processing Kafka message: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * 🎧 Kafka Listener
     * - Listens to responses on "frank-kafka-response-book-hotel" topic
     * - Parses JSON into BookingMessage
     * - Updates saga status and emits SSE updates
     *
     * NOTE: does NOT close SSE stream; saga may continue with payment/notifications.
     */
    @KafkaListener(topics = "frank-kafka-response-book-hotel", groupId = "frank-kafka-group")
    public void listenerBookHotel(String jsonMessage) {
        
        System.out.println("📨 [KAFKA-HOTEL-LISTENER listenerBookHotel] Received JSON from Kafka: " + jsonMessage);

        try {
            BookingMessage bookingMessage = objectMapper.readValue(jsonMessage, BookingMessage.class);
            bookingMessage.setStatus(SagaStatus.HOTEL_BOOKING_CONFIRMED);

            String sagaCorrelationId = bookingMessage.getSagaCorrelationId();

            System.out.println("🔑 [KAFKA-HOTEL-LISTENER] Correlation ID: " + sagaCorrelationId);

            sagaStorage.updateSaga(bookingMessage);

            sseEmitterManager.emit(sagaCorrelationId, Map.of(
                    "message", "Consumer hotel booking confirmed (pre-payment, not finalized)",
                    "status", SagaStatus.HOTEL_BOOKING_CONFIRMED.name(),
                    "sagaCorrelationId", sagaCorrelationId,
                    "bookingMessage", bookingMessage,
                    "timestamp", Instant.now().toString()
            ));

            System.out.println("✅ [KAFKA-HOTEL-LISTENER] Saga sent hotel booking confirmed for: " + sagaCorrelationId);

            /* 
            // 1️⃣ Call the payment step
            String paymentServiceUrl = "http://localhost:" 
                                    + appPropertiesComponent.getKafkaProducerPort() 
                                    + "/kafka/payment";

            restTemplate.postForObject(paymentServiceUrl, bookingMessage, String.class);
            System.out.println("🚀 [listenerBookHotel] Sent to payment producer: " + paymentServiceUrl);

            // 2️⃣ Notify SSE client for payment step
            sseEmitterManager.emit(sagaCorrelationId, Map.of(
                    "message", "Saga processing continued with payment step.",
                    "status", "processing",
                    "sagaCorrelationId", sagaCorrelationId,
                    "timestamp", Instant.now().toString()
            ));
             */
            
        } catch (Exception e) {
            System.err.println("💥 [KAFKA-HOTEL-LISTENER] Error processing Kafka message: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
