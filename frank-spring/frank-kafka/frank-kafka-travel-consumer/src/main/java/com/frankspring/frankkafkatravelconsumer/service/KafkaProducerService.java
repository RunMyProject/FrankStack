/**
 * KafkaProducerService.java
 * -----------------------
 * Kafka Producer Service for FrankStack Travel Kafka Response to Saga Orchestrator
 * 
 * NOTES:
 * - Sends messages to Kafka response topic after processing travel booking events
 * - Can be extended to trigger further saga steps or REST calls
 * - Currently sends a simple payload with correlationId
 *
 * Author: Edoardo Sabatini
 * Date: 03 October 2025
 */

package com.frankspring.frankkafkatravelconsumer.service;

import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class KafkaProducerService {

    private final KafkaTemplate<String, String> kafkaTemplate;

    /**
     * 🔄 Sends a message to Kafka response topic
     * @param correlationId Unique ID to correlate request and response
     */
    public void sendMessage(String correlationId) {
        // 📝 Construct message payload
        Map<String, String> message = Map.of(
            "correlationId", correlationId,
            "payload", "payload"
        );

        // 📤 Send message to Kafka topic "frank-kafka-response-travel"
        kafkaTemplate.send("frank-kafka-response-travel", correlationId);

        // ✅ Log for debug
        System.out.println("✔️ Kafka message sent for correlationId: " + correlationId);
    }
}
