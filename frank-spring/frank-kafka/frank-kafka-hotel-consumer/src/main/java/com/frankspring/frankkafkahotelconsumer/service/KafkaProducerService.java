package com.frankspring.frankkafkahotelconsumer.service;

import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.frankspring.frankkafkahotelconsumer.models.*;

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
     * @param hotelBookingResponse the processed hotel booking response
     */
    public void sendMessage(HotelBookingResponse hotelBookingResponse) {
        try {
            String jsonMessage = objectMapper.writeValueAsString(hotelBookingResponse);
            kafkaTemplate.send("frank-kafka-response-hotel", jsonMessage);
            System.out.println("✔️ [PRODUCER] Kafka HotelBookingResponse sent:");
            System.out.println(jsonMessage);
        } catch (Exception e) {
            System.err.println("💥 [PRODUCER] Error sending Kafka HotelBookingResponse: " + e.getMessage());
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
            kafkaTemplate.send("frank-kafka-response-book-hotel", jsonMessage);
            System.out.println("✔️ [PRODUCER] Kafka BookingMessage sent:");
            System.out.println(jsonMessage);
        } catch (Exception e) {
            System.err.println("💥 [PRODUCER] Error sending Kafka BookingMessage: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
