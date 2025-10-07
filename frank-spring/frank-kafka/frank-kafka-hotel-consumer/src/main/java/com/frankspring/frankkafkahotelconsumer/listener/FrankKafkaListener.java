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
 * -----------------------
 * Kafka listener component for FrankStack Travel Kafka Consumer.
 *
 * RESPONSIBILITIES:
 * - Listens to travel booking events from Kafka topics.
 * - Immediately sets saga status to CONSUMER_IN_PROGRESS.
 * - Deserializes incoming JSON string into BookingResponse or BookingMessage.
 * - Performs the internal "dirty work" (mock backend logic) for travel search.
 * - Uses BookingUtils to create a BookingEntry for booking requests.
 * - Sends confirmation message back via KafkaProducerService.
 * - Logs key steps and errors to the console.
 * - Simulates processing delays with Thread.sleep().
 * - BookingEntry is now stored in SagaContext for state tracking.
 *     
 * Author: Edoardo Sabatini
 * Date: 07 October 2025
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
     * Simulates backend by generating mock results based on travelMode.
     *
     * @param data JSON message received from Kafka topic "frank-kafka-hotel"
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

            System.out.println("🧩 [CONSUMER] HotelBookingResponse status set to CONSUMER_IN_PROGRESS:");
            System.out.println(hotelBookingResponse);

            performDirtyWork(hotelBookingResponse, bookingMessage);

            Thread.sleep(2500); // simulate processing delay

            System.out.println("✅ [CONSUMER] Finished processing HotelBookingResponse for sagaCorrelationId: "
                    + hotelBookingResponse.getSagaCorrelationId());

            // Send response back to Kafka
            kafkaProducerService.sendMessage(hotelBookingResponse);

        } catch (Exception e) {
            System.err.println("💥 [CONSUMER] Error processing HotelBookingResponse: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Simulates backend "dirty work" by populating the Results object
     * with mock data according to the requested travelMode.
     *
     * @param hotelBookingResponse The response object to populate
     * @param bookingMessage  The original booking message from Kafka
     */
    private void performDirtyWork(HotelBookingResponse hotelBookingResponse, BookingMessage bookingMessage) {
        BookingContext context = bookingMessage.getBookingContext();
        if (context == null || context.getFillForm() == null) {
            System.out.println("⚠️ [DIRTY WORK] Missing booking context or form.");
            return;
        }

        FillForm form = context.getFillForm();
        HotelResults hotelResults = new HotelResults();

        // Generate hotels based on form
        hotelResults.setHotels(ResultsContext.getHotels(form));

        hotelBookingResponse.setHotelResults(hotelResults);

        System.out.println("🏨 [DIRTY WORK] Generated mock hotels for " + form.getTripDestination() +
                " with " + form.getStarsOfHotel() + " stars requirement.");
    }

    /**
     * Listener for actual booking requests.
     * Uses BookingUtils to generate a BookingEntry with calculated price and people count.
     *
     * @param data JSON message received from Kafka topic "frank-kafka-book-travel"
     */
    @KafkaListener(topics = "frank-kafka-book-hotel", groupId = "frank-kafka-group")
    void bookListener(String data) {
        System.out.println("📥 [CONSUMER] Received raw message from Kafka:");
        System.out.println(data);

        try {
            BookingMessage bookingMessage = objectMapper.readValue(data, BookingMessage.class);
            bookingMessage.setStatus(SagaStatus.CONSUMER_IN_PROGRESS);

            FillForm form = bookingMessage.getBookingContext().getFillForm();
            String travelMode = form.getTravelMode();
            String travelID = bookingMessage.getSagaContext().getSelectedTravelId();

            // Use the enriched version of BookingUtils
            Optional<HotelBookingEntry> bookedHotelEntry = BookingUtils.findByTravelId(travelMode, travelID, form);

            if (bookedHotelEntry.isPresent()) {
                HotelBookingEntry entry = bookedHotelEntry.get();
                bookingMessage.getSagaContext().setBookedTravelId(entry.getId());
                bookingMessage.getSagaContext().setHotelBookingEntry(entry);

                System.out.println("✅ [CONSUMER] Booking completed for sagaCorrelationId: "
                        + bookingMessage.getSagaCorrelationId());
                System.out.println("🧳 [DETAILS] " + entry.getTripDeparture() + " → " + entry.getTripDestination() +
                        " | People: " + entry.getPeople() +
                        " | Departure: " + entry.getDateTimeRoundTripDeparture() +
                        " | Return: " + entry.getDateTimeRoundTripReturn());
            } else {
                System.out.println("⚠️ [CONSUMER] Booking not found for travelId: " + travelID);
            }

            Thread.sleep(2500); // simulate processing delay

            kafkaProducerService.sendMessage(bookingMessage);

        } catch (Exception e) {
            System.err.println("💥 [CONSUMER] Error processing BookingMessage: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
