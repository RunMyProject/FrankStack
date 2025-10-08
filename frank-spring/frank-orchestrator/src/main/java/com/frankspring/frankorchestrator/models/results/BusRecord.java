package com.frankspring.frankorchestrator.models.results;

/**
 * BusRecord.java
 * -----------------------
 * Immutable data record representing a bus transport.
 *
 * RESPONSIBILITIES:
 * - Acts as a read-only data carrier object (DCO) for transport information.
 * - Designed to be immutable: once created, its values cannot be changed.
 * - Holds bus information that can later be persisted or retrieved from a database.
 * - Conceptually similar to a DAO, but focused purely on data transport, not business logic.
 *
 * CHANGELOG:
 * - 08 October 2025: Renamed field "operator" to "companyName" for naming consistency
 *   across all transport record types (flight, train, car, space).
 *
 * Author: Edoardo Sabatini
 * Date: 08 October 2025
 */

import java.util.List;
import java.util.Arrays;

public record BusRecord(
        String id,
        String type,
        String companyName,
        String busNumber,
        String departureTime,
        String arrivalTime,
        String duration,
        double price,
        int stops,
        List<String> benefits
) {
    /**
     * Generates a list of mock buses for testing or UI purposes.
     * Immutable read-only data suitable for transport layers.
     */
    public static List<BusRecord> generateMockBuses() {
        return Arrays.asList(
                new BusRecord(
                        "bus-standard",
                        "bus",
                        "FlixBus",
                        "F123",
                        "07:30",
                        "10:45",
                        "3h 15m",
                        25,
                        2,
                        Arrays.asList("WiFi", "Power outlets")
                ),
                new BusRecord(
                        "bus-comfort",
                        "bus",
                        "FlixBus",
                        "F456",
                        "13:00",
                        "16:00",
                        "3h 0m",
                        35,
                        1,
                        Arrays.asList("WiFi", "Extra legroom", "Reclining seats")
                )
        );
    }
}
