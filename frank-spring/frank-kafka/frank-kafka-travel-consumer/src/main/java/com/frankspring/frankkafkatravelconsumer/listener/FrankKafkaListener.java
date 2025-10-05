package com.frankspring.frankkafkatravelconsumer.listener;

/**
 * FrankKafkaListener.java
 * -----------------------
 * Kafka listener component for FrankStack Travel Kafka Consumer.
 *
 * RESPONSIBILITIES:
 * - Listens to travel booking events from Kafka topics.
 * - Immediately sets saga status to CONSUMER_IN_PROGRESS.
 * - Deserializes incoming JSON string into BookingResponse.
 * - Performs the internal “dirty work” (mock backend logic).
 * - Sends confirmation message back via KafkaProducerService.
 *
 * Author: Edoardo Sabatini
 * Date: 05 October 2025
 */

import com.frankspring.frankkafkatravelconsumer.models.*;
import com.frankspring.frankkafkatravelconsumer.models.results.*;
import com.frankspring.frankkafkatravelconsumer.service.KafkaProducerService;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class FrankKafkaListener {

    @Autowired
    private KafkaProducerService kafkaProducerService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @KafkaListener(topics = "frank-kafka-travel", groupId = "frank-kafka-group")
    void listener(String data) {
        System.out.println("📥 [CONSUMER] Received raw message from Kafka:");
        System.out.println(data);

        try {
            // Deserialize JSON to BookingMessage
            BookingMessage bookingMessage = objectMapper.readValue(data, BookingMessage.class);

            // Build initial BookingResponse with CONSUMER_IN_PROGRESS status
            BookingResponse bookingResponse = BookingResponse.builder()
                    .sagaCorrelationId(bookingMessage.getSagaCorrelationId())
                    .status(SagaStatus.CONSUMER_IN_PROGRESS)
                    .build();

            System.out.println("🧩 [CONSUMER] BookingResponse status set to CONSUMER_IN_PROGRESS:");
            System.out.println(bookingResponse);

            // Execute backend mock logic
            performDirtyWork(bookingResponse, bookingMessage);

            // Simulated delay
            Thread.sleep(2500);

            System.out.println("✅ [CONSUMER] Finished processing BookingResponse for sagaCorrelationId: "
                    + bookingResponse.getSagaCorrelationId());

            // Send confirmation back via KafkaProducerService
            kafkaProducerService.sendMessage(bookingResponse);

        } catch (Exception e) {
            System.err.println("💥 [CONSUMER] Error processing BookingResponse: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void performDirtyWork(BookingResponse bookingResponse, BookingMessage bookingMessage) {
        BookingContext context = bookingMessage.getBookingContext();
        if (context == null || context.getFillForm() == null) {
            System.out.println("⚠️ [DIRTY WORK] Missing booking context or form.");
            return;
        }

        FillForm form = context.getFillForm();
        String travelMode = form.getTravelMode(); // Key field to determine transport type

        System.out.println("🛠️ [DIRTY WORK] Detected travel mode: " + travelMode);

        Results results = new Results();

        switch (travelMode) {
            case "plane", "flight", "airplane" -> {
                List<FlightRecord> flights = ResultsContext.getFlights()
                        .stream()
                        .filter(f -> f.type().equalsIgnoreCase("plane"))
                        .toList();

                System.out.println("✈️ [DIRTY WORK] Generated mock flight records:");
                flights.forEach(System.out::println);

                results.setFlights(flights);
            }

            case "train" -> {
                List<TrainRecord> trains = ResultsContext.getTrains()
                        .stream()
                        .filter(t -> t.type().equalsIgnoreCase("train"))
                        .toList();

                System.out.println("🚆 [DIRTY WORK] Generated mock train records:");
                trains.forEach(System.out::println);

                results.setTrains(trains);
            }

            case "bus" -> {
                List<BusRecord> buses = ResultsContext.getBuses()
                        .stream()
                        .filter(b -> b.type().equalsIgnoreCase("bus"))
                        .toList();

                System.out.println("🚌 [DIRTY WORK] Generated mock bus records:");
                buses.forEach(System.out::println);

                results.setBuses(buses);
            }

            case "car" -> {
                List<CarRecord> cars = ResultsContext.getCars()
                        .stream()
                        .filter(c -> c.type().equalsIgnoreCase("car"))
                        .toList();

                System.out.println("🚗 [DIRTY WORK] Generated mock car records:");
                cars.forEach(System.out::println);

                results.setCars(cars);
            }

            case "space", "spaceship", "rocket" -> {
                List<SpaceRecord> spaces = ResultsContext.getSpaces()
                        .stream()
                        .filter(s -> s.type().equalsIgnoreCase("space"))
                        .toList();

                System.out.println("🚀 [DIRTY WORK] Generated mock space shuttle records:");
                spaces.forEach(System.out::println);

                results.setSpaces(spaces);
            }

            default -> System.out.println("❓ [DIRTY WORK] Unknown or unsupported travel mode: " + travelMode);
        }

        bookingResponse.setResults(results);
    }
}
