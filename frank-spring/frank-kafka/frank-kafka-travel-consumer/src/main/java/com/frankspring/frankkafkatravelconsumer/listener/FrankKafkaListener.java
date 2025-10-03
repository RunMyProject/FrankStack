/**
 * FrankKafkaListener.java
 * -----------------------
 * Kafka listener component for FrankStack Travel Kafka Consumer
 * 
 * NOTES:
 * - Listens to travel booking events from Kafka topics
 * - Handles incoming messages for travel-related business logic
 * - Can be extended to trigger further saga steps or REST calls
 * - Implements a simple "slow processing" delay for demonstration
 *
 * Author: Edoardo Sabatini
 * Date: 03 October 2025
 */
package com.frankspring.frankkafkatravelconsumer.listener;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import com.frankspring.frankkafkatravelconsumer.service.KafkaProducerService;
import java.util.Map;

@Component
public class FrankKafkaListener {

    @Autowired
    KafkaProducerService kafkaProducerService;

    @KafkaListener(topics = "frank-kafka-travel", groupId = "frank-kafka-group")
    void listener(String data) {
        // 📥 Received message from Kafka
        System.out.println("📥 Received from Kafka: " + data);
        
        String correlationId = data;

        // 🛠️ Begin "heavy work" processing: DB calls, external APIs, etc.
        try {
            System.out.println("🛠️ Starting processing correlationId: " + correlationId);

            // ⏱️ Slowdown simulation: 7 seconds to mimic long processing
            Thread.sleep(7000);

            System.out.println("🛠️ Finished processing correlationId: " + correlationId);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            System.err.println("⚠️ Processing interrupted for correlationId: " + correlationId);
        }

        // 📝 Mock result generation
        String result = "processed: " + correlationId;

        // 🔄 Send confirmation back to Kafka reply topic
        Map<String, String> confirmation = Map.of(
            "correlationId", correlationId,
            "status", "CONFIRMED",
            "result", result
        );

        // 📨 Produce message to Kafka
        kafkaProducerService.sendMessage(correlationId);

        // ✅ Mark completion
        System.out.println("✔️ Finished processing correlationId: " + correlationId);
    }
}
