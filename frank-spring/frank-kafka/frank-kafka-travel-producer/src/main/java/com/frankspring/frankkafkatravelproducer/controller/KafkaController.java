/**
 * KafkaController.java
 * -----------------------
 * REST Controller for FrankStack Travel Producer Kafka Application
 * 
 * Responsibilities:
 * - Exposes REST endpoint to send messages to Kafka topic
 * - Acts as the entry point for producing travel booking events
 * - Uses KafkaTemplate to send messages
 *
 * Author: Edoardo Sabatini
 * Date: 02 October 2025
 */
package com.frankspring.frankkafkatravelproducer.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.kafka.core.KafkaTemplate;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class KafkaController {
    
    private final KafkaTemplate<String, String> kafkaTemplate;

    @GetMapping("/send")
    public String send(@RequestParam String msg) {
        kafkaTemplate.send("frank-kafka-travel", msg);
        return "Sent: " + msg;
    }
}
