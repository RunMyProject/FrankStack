package com.frankspring.frankkafkatravelconsumer.models.results;

/**
 * TrainRecord.java
 * -----------------------
 * Immutable data record representing a train transport.
 * 
 * RESPONSIBILITIES:
 * - Acts as a read-only data carrier object (DCO) for transport information.
 * - Designed to be immutable: once created, its values cannot be changed.
 * - Holds flight information that can later be persisted or retrieved from a database.
 * - Conceptually similar to a DAO, but focused purely on data transport, not business logic.
 * 
 * Author: Edoardo Sabatini
 * Date: 05 October 2025
 */

import java.util.List;
import java.util.Arrays;

public record TrainRecord(
        String id,
        String type,
        String operator,
        String trainNumber,
        String departureTime,
        String arrivalTime,
        String duration,
        double price,
        int stops,
        List<String> benefits
) {
    public static List<TrainRecord> generateMockTrains() {
        return Arrays.asList(
                new TrainRecord(
                        "train-standard",
                        "train",
                        "Trenitalia",
                        "R1234",
                        "09:00",
                        "12:30",
                        "3h 30m",
                        45,
                        0,
                        Arrays.asList("WiFi", "Reserved seat")
                ),
                new TrainRecord(
                        "train-fast",
                        "train",
                        "Italo",
                        "I5678",
                        "14:00",
                        "16:00",
                        "2h 0m",
                        65,
                        0,
                        Arrays.asList("WiFi", "Snack service", "Extra legroom")
                )
        );
    }
}
