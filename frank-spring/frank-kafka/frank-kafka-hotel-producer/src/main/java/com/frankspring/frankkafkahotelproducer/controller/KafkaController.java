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
 * Author: Edoardo Sabatini
 * Date: 02 October 2025
 */
package com.frankspring.frankkafkahotelproducer.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.kafka.core.KafkaTemplate;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class KafkaController {
    
    private final KafkaTemplate<String, String> kafkaTemplate;

    @GetMapping("/send")
    public String send(@RequestParam String msg) {
        kafkaTemplate.send("frank-kafka-hotel", msg);
        return "Sent: " + msg;
    }
}
