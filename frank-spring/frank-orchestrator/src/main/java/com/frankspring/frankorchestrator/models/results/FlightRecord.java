package com.frankspring.frankorchestrator.models.results;

/**
 * FlightRecord.java
 * -----------------------
 * Immutable data record representing a flight.
 *
 * RESPONSIBILITIES:
 * - Acts as a read-only data carrier object (DCO) for transport information.
 * - Designed to be immutable: once created, its values cannot be changed.
 * - Holds flight information that can later be persisted or retrieved from a database.
 * - Conceptually similar to a DAO, but focused purely on data transport, not business logic.
 *
 * CHANGELOG:
 * - 08 October 2025: Renamed field "airline" to "companyName" for better consistency
 *   with other transport record types (train, bus, car, space).
 *
 * Author: Edoardo Sabatini
 * Date: 08 October 2025
 */

import java.util.List;
import java.util.Arrays;

public record FlightRecord(
        String id,
        String type,
        String companyName,
        String flightNumber,
        String departureTime,
        String arrivalTime,
        String duration,
        double price,
        int stops,
        String seatClass,
        List<String> benefits
) {
    /**
     * Generates a list of mock flights for testing or UI purposes.
     * Immutable read-only data suitable for transport layers.
     */
    public static List<FlightRecord> generateMockFlights() {
        return Arrays.asList(
                new FlightRecord(
                        "flight-economy",
                        "plane",
                        "Alitalia",
                        "AZ1234",
                        "08:30",
                        "10:45",
                        "2h 15m",
                        89,
                        0,
                        "Economy",
                        Arrays.asList("1 cabin bag", "Seat selection")
                ),
                new FlightRecord(
                        "flight-comfort",
                        "plane",
                        "Lufthansa",
                        "LH5678",
                        "14:20",
                        "16:50",
                        "2h 30m",
                        156,
                        0,
                        "Economy Plus",
                        Arrays.asList("1 checked bag", "Extra legroom", "Priority boarding")
                ),
                new FlightRecord(
                        "flight-premium",
                        "plane",
                        "Emirates",
                        "EK9012",
                        "18:00",
                        "20:15",
                        "2h 15m",
                        289,
                        0,
                        "Business",
                        Arrays.asList("Lounge access", "Premium meals", "Lie-flat seat")
                )
        );
    }
}
