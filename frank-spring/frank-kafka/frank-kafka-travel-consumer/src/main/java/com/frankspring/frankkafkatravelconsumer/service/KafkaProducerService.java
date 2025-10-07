package com.frankspring.frankkafkatravelconsumer.service;

import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.frankspring.frankkafkatravelconsumer.models.*;

/**
 * KafkaProducerService.java
 * -------------------------
 * Kafka Producer Service for FrankStack Travel Kafka Response to Saga Orchestrator
 *
 * - Uses injected ObjectMapper (configured with JavaTimeModule) to serialize date/time properly.
 *
 * Author: Edoardo Sabatini
 * Date: 07 October 2025
 */
@Service
@RequiredArgsConstructor
public class KafkaProducerService {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper; // injected configured mapper

    /**
     * Sends the updated BookingResponse back to the response topic.
     * @param bookingResponse the processed booking response
     */
    public void sendMessage(BookingResponse bookingResponse) {
        try {
            String jsonMessage = objectMapper.writeValueAsString(bookingResponse);
            kafkaTemplate.send("frank-kafka-response-travel", jsonMessage);
            System.out.println("✔️ [PRODUCER] Kafka BookingResponse sent:");
            System.out.println(jsonMessage);
        } catch (Exception e) {
            System.err.println("💥 [PRODUCER] Error sending Kafka BookingResponse: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Sends the updated BookingMessage back to the response topic.
     * @param bookingMessage the processed booking message
     */
    public void sendMessage(BookingMessage bookingMessage) {
        try {
            String jsonMessage = objectMapper.writeValueAsString(bookingMessage);
            kafkaTemplate.send("frank-kafka-response-book-travel", jsonMessage);
            System.out.println("✔️ [PRODUCER] Kafka BookingMessage sent:");
            System.out.println(jsonMessage);
        } catch (Exception e) {
            System.err.println("💥 [PRODUCER] Error sending Kafka BookingMessage: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
