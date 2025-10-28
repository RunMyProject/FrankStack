package com.frankspring.frankkafkatravelconsumer.listener;

/**
 * FrankKafkaListener.java
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
 * Date: 28 October 2025
 */

import com.frankspring.frankkafkatravelconsumer.models.*;
import com.frankspring.frankkafkatravelconsumer.models.results.*;
import com.frankspring.frankkafkatravelconsumer.service.KafkaProducerService;
import com.frankspring.frankkafkatravelconsumer.utils.BookingUtils;

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
     * Main listener for travel search messages.
     * Simulates backend by generating mock results based on travelMode.
     *
     * @param data JSON message received from Kafka topic "frank-kafka-travel"
     */
    @KafkaListener(topics = "frank-kafka-travel", groupId = "frank-kafka-group")
    void listener(String data) {
        System.out.println("📥 [CONSUMER] Received raw message from Kafka:");
        System.out.println(data);

        try {
            BookingMessage bookingMessage = objectMapper.readValue(data, BookingMessage.class);

            BookingResponse bookingResponse = BookingResponse.builder()
                    .sagaCorrelationId(bookingMessage.getSagaCorrelationId())
                    .status(SagaStatus.CONSUMER_IN_PROGRESS)
                    .build();

            System.out.println("🧩 [CONSUMER] BookingResponse status set to CONSUMER_IN_PROGRESS:");
            System.out.println(bookingResponse);

            performDirtyWork(bookingResponse, bookingMessage);

            Thread.sleep(2500); // simulate processing delay

            System.out.println("✅ [CONSUMER] Finished processing BookingResponse for sagaCorrelationId: "
                    + bookingResponse.getSagaCorrelationId());

            // Send response back to Kafka
            kafkaProducerService.sendMessage(bookingResponse);

        } catch (Exception e) {
            System.err.println("💥 [CONSUMER] Error processing BookingResponse: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Simulates backend "dirty work" by populating the Results object
     * with mock data according to the requested travelMode.
     *
     * @param bookingResponse The response object to populate
     * @param bookingMessage  The original booking message from Kafka
     */
    private void performDirtyWork(BookingResponse bookingResponse, BookingMessage bookingMessage) throws Exception {
        BookingContext context = bookingMessage.getBookingContext();
        if (context == null || context.getFillForm() == null) {
            System.out.println("⚠️ [DIRTY WORK] Missing booking context or form.");
            return;
        }

        FillForm form = context.getFillForm();
        String travelMode = form.getTravelMode().toLowerCase();

        System.out.println("🛠️ [DIRTY WORK] Detected travel mode: " + travelMode);

        Results results = new Results();

        switch (travelMode) {
            case "plane", "flight", "airplane" -> results.setFlights(ResultsContext.getFlights());
            case "train" -> results.setTrains(ResultsContext.getTrains());
            case "bus" -> results.setBuses(ResultsContext.getBuses());
            case "car" -> results.setCars(ResultsContext.getCars());
            case "space", "spaceship", "rocket" -> results.setSpaces(ResultsContext.getSpaces());
            default -> {
                System.out.println("❓ [DIRTY WORK] Unknown travel mode: " + travelMode);
                throw new Exception("Unknown travel mode: " + travelMode);
            }
        }

        bookingResponse.setResults(results);
    }

    /**
     * Listener for actual booking requests.
     * Uses BookingUtils to generate a BookingEntry with calculated price and people count.
     *
     * @param data JSON message received from Kafka topic "frank-kafka-book-travel"
     */
    @KafkaListener(topics = "frank-kafka-book-travel", groupId = "frank-kafka-group")
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
            Optional<BookingEntry> bookedEntry = BookingUtils.findByTravelId(travelMode, travelID, form);

            if (bookedEntry.isPresent()) {
                BookingEntry entry = bookedEntry.get();
                bookingMessage.getSagaContext().setBookedTravelId(entry.getId());
                bookingMessage.getSagaContext().setBookingEntry(entry);

                System.out.println("✅ [CONSUMER] Booking completed for sagaCorrelationId: "
                        + bookingMessage.getSagaCorrelationId());
                System.out.println("🧳 [DETAILS] " + entry.getTripDeparture() + " → " + entry.getTripDestination() +
                        " | People: " + entry.getPeople() +
                        " | Luggages: " + entry.getLuggages() +
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
