package com.frankspring.frankkafkahotelconsumer.listener;

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
 * RESPONSIBILITIES:
 * - Listens to booking events from Kafka topics.
 * - Immediately sets saga status to CONSUMER_IN_PROGRESS.
 * - Deserializes incoming JSON into BookingMessage.
 * - Performs internal backend logic (mock data generation) for hotel search.
 * - Uses BookingUtils to create a HotelBookingEntry for booking requests.
 * - Sends confirmation messages back via KafkaProducerService.
 * - Logs key steps and errors to console.
 * - Simulates processing delays with Thread.sleep().
 * - BookingEntry is stored in SagaContext for state tracking.
 *     
 * Author: Edoardo Sabatini
 * Date: 08 October 2025
 */

import com.frankspring.frankkafkahotelconsumer.models.*;
import com.frankspring.frankkafkahotelconsumer.models.results.*;
import com.frankspring.frankkafkahotelconsumer.service.KafkaProducerService;
import com.frankspring.frankkafkahotelconsumer.utils.BookingUtils;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Optional;

@Component
public class FrankKafkaListener {

    @Autowired
    private KafkaProducerService kafkaProducerService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Main listener for hotel search messages.
     * Simulates backend by generating mock hotel results.
     *
     * @param data JSON message from Kafka topic "frank-kafka-hotel"
     */
    @KafkaListener(topics = "frank-kafka-hotel", groupId = "frank-kafka-group")
    void listener(String data) {
        System.out.println("📥 [CONSUMER] Received raw message from Kafka:");
        System.out.println(data);

        try {
            BookingMessage bookingMessage = objectMapper.readValue(data, BookingMessage.class);

            HotelBookingResponse hotelBookingResponse = HotelBookingResponse.builder()
                    .sagaCorrelationId(bookingMessage.getSagaCorrelationId())
                    .status(SagaStatus.CONSUMER_IN_PROGRESS)
                    .build();

            System.out.println("🧩 [CONSUMER] Status set to CONSUMER_IN_PROGRESS:");
            System.out.println(hotelBookingResponse);

            performDirtyWork(hotelBookingResponse, bookingMessage);

            Thread.sleep(2500); // simulate processing delay

            System.out.println("✅ [CONSUMER] Finished processing HotelBookingResponse for sagaCorrelationId: "
                    + hotelBookingResponse.getSagaCorrelationId());

            kafkaProducerService.sendMessage(hotelBookingResponse);

        } catch (Exception e) {
            System.err.println("💥 [CONSUMER] Error processing HotelBookingResponse: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Simulates backend "dirty work" by populating mock hotel results
     * according to the FillForm.
     *
     * @param hotelBookingResponse Response object to populate
     * @param bookingMessage       Original booking message from Kafka
     */
    private void performDirtyWork(HotelBookingResponse hotelBookingResponse, BookingMessage bookingMessage) {
        
        String userLang = "English"; // TO DO

        BookingContext context = bookingMessage.getBookingContext();
        if (context == null || context.getFillForm() == null) {
            System.out.println("⚠️ [DIRTY WORK] Missing booking context or form.");
            return;
        }

        FillForm form = context.getFillForm();
        HotelResults hotelResults = new HotelResults();
        hotelResults.setHotels(ResultsContext.getHotels(form, userLang));

        hotelBookingResponse.setHotelResults(hotelResults);

        System.out.println("🏨 [DIRTY WORK] Generated mock hotels for " + form.getTripDestination() +
                " with " + form.getStarsOfHotel() + " stars requirement.");
    }

    /**
     * Listener for actual hotel booking requests.
     * Uses BookingUtils.findByHotelId to generate a HotelBookingEntry.
     *
     * @param data JSON message from Kafka topic "frank-kafka-book-hotel"
     */
    @KafkaListener(topics = "frank-kafka-book-hotel", groupId = "frank-kafka-group")
    void bookListener(String data) {

        String userLang = "English"; // TO DO

        System.out.println("📥 [CONSUMER] Received raw message from Kafka:");
        System.out.println(data);

        try {
            BookingMessage bookingMessage = objectMapper.readValue(data, BookingMessage.class);
            bookingMessage.setStatus(SagaStatus.CONSUMER_IN_PROGRESS);

            FillForm form = bookingMessage.getBookingContext().getFillForm();
            String hotelId = bookingMessage.getSagaContext().getSelectedHotelId();

            // Use BookingUtils.findByHotelId
            Optional<HotelBookingEntry> bookedHotelEntry = BookingUtils.findByHotelId(hotelId, form, userLang);

            if (bookedHotelEntry.isPresent()) {
                HotelBookingEntry entry = bookedHotelEntry.get();
                bookingMessage.getSagaContext().setHotelBookingEntry(entry);

                System.out.println("✅ [CONSUMER] Hotel booking completed for sagaCorrelationId: "
                        + bookingMessage.getSagaCorrelationId());
                System.out.println("🧳 [DETAILS] " + entry.getTripDeparture() + " → " + entry.getTripDestination() +
                        " | People: " + entry.getPeople() +
                        " | Departure: " + entry.getDateTimeRoundTripDeparture() +
                        " | Return: " + entry.getDateTimeRoundTripReturn());
            } else {
                System.out.println("⚠️ [CONSUMER] Hotel booking not found for hotelId: " + hotelId);
            }

            Thread.sleep(2500); // simulate processing delay

            kafkaProducerService.sendMessage(bookingMessage);

        } catch (Exception e) {
            System.err.println("💥 [CONSUMER] Error processing BookingMessage: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
