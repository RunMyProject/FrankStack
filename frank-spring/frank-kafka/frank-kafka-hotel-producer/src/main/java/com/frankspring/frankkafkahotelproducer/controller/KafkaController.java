package com.frankspring.frankkafkahotelproducer.controller;

/**
 * KafkaController.java
 * -----------------------
 * Spring Boot REST Controller for Hotel Kafka Producer in FrankStack Travel AI
 * 
 * NOTES:
 * - Handles sending hotel booking events (availability, reservations) to Kafka topics
 * - Entry point for hotel producer microservice
 * - Uses KafkaTemplate to produce messages
 *
 * -----------------------
 * REST Controller for FrankStack Travel Producer Kafka Application.
 * 
 * RESPONSIBILITIES:
 * - Exposes POST endpoint to send BookingMessage JSON to Kafka topic
 * - Updates saga status to PRODUCER_IN_PROGRESS before sending
 * - Uses KafkaTemplate to send messages
 *
 * Author: Edoardo Sabatini
 * Date: 07 October 2025
 */

import com.frankspring.frankkafkahotelproducer.models.BookingMessage;
import com.frankspring.frankkafkahotelproducer.models.SagaStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.kafka.core.KafkaTemplate;
import lombok.RequiredArgsConstructor;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequiredArgsConstructor
@RequestMapping("/kafka")
public class KafkaController {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * POST endpoint to send BookingMessage to Kafka topic
     * @param bookingMessage BookingMessage object received from orchestrator
     * @return confirmation string
     */
    @PostMapping("/sendhotel")
    public String send(@RequestBody BookingMessage bookingMessage) {
        // Update saga status to indicate producer is processing
        bookingMessage.setStatus(SagaStatus.PRODUCER_IN_PROGRESS);

        try {
            // Serialize BookingMessage to JSON
            String json = objectMapper.writeValueAsString(bookingMessage);
            System.out.println("📦 [PRODUCER] Sending BookingMessage, sagaCorrelationId = " 
                               + bookingMessage.getSagaCorrelationId());

            // Send to Kafka topic
            kafkaTemplate.send("frank-kafka-hotel", json);

            return "✅ BookingMessage sent to Kafka successfully";

        } catch (Exception e) {
            System.err.println("❌ [PRODUCER] Error sending BookingMessage: " + e.getMessage());
            return "❌ Error: " + e.getMessage();
        }
    }

    /**
     * POST endpoint to send BookingMessage to Kafka topic
     * @param bookingMessage BookingMessage object received from orchestrator
     * @return confirmation string
     */
    @PostMapping("/bookhotel")
    public String bookHotel(@RequestBody BookingMessage bookingMessage) {
        // Update saga status to indicate producer is processing
        bookingMessage.setStatus(SagaStatus.PRODUCER_IN_PROGRESS);

        try {
            // Serialize BookingMessage to JSON
            String json = objectMapper.writeValueAsString(bookingMessage);
            System.out.println("📦 [PRODUCER] Sending BookingMessage, sagaCorrelationId = " 
                               + bookingMessage.getSagaCorrelationId());

            // Send to Kafka topic
            kafkaTemplate.send("frank-kafka-book-hotel", json);

            return "✅ BookingMessage sent to Kafka successfully";

        } catch (Exception e) {
            System.err.println("❌ [PRODUCER] Error sending BookingMessage: " + e.getMessage());
            return "❌ Error: " + e.getMessage();
        }
    }
}
