/**
 * KafkaProducerService.java
 * -------------------------
 * Kafka Producer Service for FrankStack Travel Kafka Response to Saga Orchestrator
 * 
 * PURPOSE:
 * - Sends the updated BookingMessage back to the Saga Orchestrator via Kafka
 * - Updates saga status to CONFIRMED before publishing
 * - Keeps message structure consistent with the original BookingMessage JSON
 *
 * Author: Edoardo Sabatini
 * Date: 05 October 2025
 */

package com.frankspring.frankkafkatravelconsumer.service;

import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.frankspring.frankkafkatravelconsumer.models.BookingMessage;

@Service
@RequiredArgsConstructor
public class KafkaProducerService {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 🔄 Sends the updated BookingMessage back to the response topic.
     * @param bookingMessage the processed booking message
     */
    public void sendMessage(BookingMessage bookingMessage) {
        try {
            // 🧾 Serialize the entire object to JSON
            String jsonMessage = objectMapper.writeValueAsString(bookingMessage);

            // 📤 Send to Kafka topic
            kafkaTemplate.send("frank-kafka-response-travel", jsonMessage);

            System.out.println("✔️ [PRODUCER] Kafka BookingMessage sent:");
            System.out.println(jsonMessage);

        } catch (Exception e) {
            System.err.println("💥 [PRODUCER] Error sending Kafka BookingMessage: " + e.getMessage());
        }
    }
}
