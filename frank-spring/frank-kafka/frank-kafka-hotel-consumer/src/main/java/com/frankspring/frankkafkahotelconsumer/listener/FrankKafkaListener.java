/**
 * FrankKafkaListener.java
 * -----------------------
 * Kafka listener for Hotel microservice in FrankStack Travel AI
 * 
 * NOTES:
 * - Listens to hotel-related Kafka topics
 * - Handles incoming messages for business logic (availability, reservations, updates)
 * - Spring Component managed by Spring Boot
 *
 * Author: Edoardo Sabatini
 * Date: 02 October 2025
 */
package com.frankspring.frankkafkahotelconsumer.listener;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class FrankKafkaListener {
  @KafkaListener(topics = "frank-kafka-hotel", groupId = "frank-kafka-group")
  void listener(String data) {
    // System.out.println("Received from Kafka: " + data);
  }
}
