package com.frankspring.frankkafkatravelconsumer.service;

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

import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.frankspring.frankkafkatravelconsumer.models.BookingResponse;
import com.frankspring.frankkafkatravelconsumer.models.SagaStatus;

@Service
@RequiredArgsConstructor
public class KafkaProducerService {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 🔄 Sends the updated BookingResponse back to the response topic.
     * @param bookingResponse the processed booking response
     */
    public void sendMessage(BookingResponse bookingResponse) {
        try {
            // 🧾 Serialize the entire object to JSON
            String jsonMessage = objectMapper.writeValueAsString(bookingResponse);

            // 📤 Send to Kafka topic
            kafkaTemplate.send("frank-kafka-response-travel", jsonMessage);

            System.out.println("✔️ [PRODUCER] Kafka BookingResponse sent:");
            System.out.println(jsonMessage);

        } catch (Exception e) {
            System.err.println("💥 [PRODUCER] Error sending Kafka BookingResponse: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
