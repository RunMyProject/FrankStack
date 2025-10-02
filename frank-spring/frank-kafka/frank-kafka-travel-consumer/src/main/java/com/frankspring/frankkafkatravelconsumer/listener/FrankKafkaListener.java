/**
 * FrankKafkaListener.java
 * -----------------------
 * Kafka listener component for FrankStack Travel Kafka Consumer
 * 
 * NOTES:
 * - Listens to travel booking events from Kafka topics
 * - Handles incoming messages for travel-related business logic
 * - Can be extended to trigger further saga steps or REST calls
 *
 * Author: Edoardo Sabatini
 * Date: 02 October 2025
 */
package com.frankspring.frankkafkatravelconsumer.listener;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class FrankKafkaListener {
    @KafkaListener(topics = "frank-kafka-travel", groupId = "frank-kafka-group")
    void listener(String data) {
        // System.out.println("Received from Kafka: " + data);
    }
}
