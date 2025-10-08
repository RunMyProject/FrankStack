package com.frankspring.frankkafkatravelconsumer.models.results;

/**
 * TrainRecord.java
 * -----------------------
 * Immutable data record representing a train transport.
 * 
 * RESPONSIBILITIES:
 * - Acts as a read-only data carrier object (DCO) for transport information.
 * - Designed to be immutable: once created, its values cannot be changed.
 * - Holds train travel information that can later be persisted or retrieved from a database.
 * - Conceptually similar to a DAO, but focused purely on data transport, not business logic.
 *
 * CHANGELOG:
 * - 08 October 2025: Renamed field "operator" to "companyName" for consistency
 *   with other transport records (flight, bus, car, space).
 * - Added a French train to demonstrate Paris destination.
 *
 * Author: Edoardo Sabatini
 * Date: 08 October 2025
 */

import java.util.List;
import java.util.Arrays;

public record TrainRecord(
        String id,
        String type,
        String companyName,
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
                ),
                new TrainRecord(
                        "train-paris",
                        "train",
                        "SNCF",
                        "TGV9012",
                        "08:00",
                        "12:00",
                        "4h 0m",
                        120,
                        0,
                        Arrays.asList("WiFi", "First Class seat", "Meal service")
                )
        );
    }
}
