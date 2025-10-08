package com.frankspring.frankkafkatravelconsumer.models.results;

/**
 * CarRecord.java
 * -----------------------
 * Immutable data record representing car rental options.
 *
 * RESPONSIBILITIES:
 * - Acts as a read-only data carrier object (DCO) for transport information.
 * - Designed to be immutable: once created, its values cannot be changed.
 * - Holds car rental information that can later be persisted or retrieved from a database.
 * - Conceptually similar to a DAO, but focused purely on data transport, not business logic.
 *
 * CHANGELOG:
 * - 08 October 2025: Renamed field "company" to "companyName" for naming consistency
 *   across all transport record types (flight, train, bus, space).
 *
 * Author: Edoardo Sabatini
 * Date: 08 October 2025
 */

import java.util.List;
import java.util.Arrays;

public record CarRecord(
        String id,
        String type,
        String companyName,
        String model,
        String pickupTime,
        String dropoffTime,
        double price,
        List<String> benefits
) {
    /**
     * Generates a list of mock cars for testing or UI purposes.
     * Immutable read-only data suitable for transport layers.
     */
    public static List<CarRecord> generateMockCars() {
        return Arrays.asList(
                new CarRecord(
                        "car-economy",
                        "car",
                        "Hertz",
                        "Fiat 500",
                        "09:00",
                        "17:00",
                        55,
                        Arrays.asList("Air conditioning", "Unlimited mileage")
                ),
                new CarRecord(
                        "car-suv",
                        "car",
                        "Avis",
                        "Toyota RAV4",
                        "08:00",
                        "18:00",
                        85,
                        Arrays.asList("Air conditioning", "GPS included", "Unlimited mileage")
                )
        );
    }
}
