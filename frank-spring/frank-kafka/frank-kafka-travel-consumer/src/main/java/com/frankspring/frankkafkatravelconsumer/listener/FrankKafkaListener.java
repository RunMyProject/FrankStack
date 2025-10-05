package com.frankspring.frankkafkatravelconsumer.listener;

/**
 * FrankKafkaListener.java
 * -----------------------
 * Kafka listener component for FrankStack Travel Kafka Consumer.
 * 
 * RESPONSIBILITIES:
 * - Listens to travel booking events from Kafka topics.
 * - Immediately sets saga status to CONSUMER_IN_PROGRESS.
 * - Deserializes incoming JSON string into BookingMessage.
 * - Sends confirmation message back via KafkaProducerService.
 *
 * Author: Edoardo Sabatini
 * Date: 05 October 2025
 */

import com.frankspring.frankkafkatravelconsumer.models.BookingMessage;
import com.frankspring.frankkafkatravelconsumer.models.SagaStatus;
import com.frankspring.frankkafkatravelconsumer.service.KafkaProducerService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;

@Component
public class FrankKafkaListener {

    @Autowired
    private KafkaProducerService kafkaProducerService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Kafka listener for "frank-kafka-travel" topic.
     * @param data Raw JSON message from Kafka
     */
    @KafkaListener(topics = "frank-kafka-travel", groupId = "frank-kafka-group")
    void listener(String data) {
        System.out.println("📥 [CONSUMER] Received raw message from Kafka:");
        System.out.println(data);

        try {
            // Deserialize JSON to BookingMessage
            BookingMessage bookingMessage = objectMapper.readValue(data, BookingMessage.class);

            // Immediately set status to CONSUMER_IN_PROGRESS
            bookingMessage.setStatus(SagaStatus.CONSUMER_IN_PROGRESS);

            System.out.println("🧩 [CONSUMER] BookingMessage status set to CONSUMER_IN_PROGRESS:");
            System.out.println(bookingMessage);

            // Simulated processing delay (replace with real processing logic)
            Thread.sleep(5000);

            System.out.println("✅ [CONSUMER] Finished processing BookingMessage for sagaCorrelationId: "
                    + bookingMessage.getSagaCorrelationId());

            // Send confirmation back via KafkaProducerService
            kafkaProducerService.sendMessage(bookingMessage);

        } catch (Exception e) {
            System.err.println("💥 [CONSUMER] Error processing BookingMessage: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
