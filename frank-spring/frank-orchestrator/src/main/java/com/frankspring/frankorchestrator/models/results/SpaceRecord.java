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
 * Author: Edoardo Sabatini
 * Date: 05 October 2025
 */

import java.util.List;
import java.util.Arrays;

public record SpaceRecord(
        String id,
        String type,
        String company,
        String missionName,
        String departureTime,
        String arrivalTime,
        String duration,
        double price,
        int stops,
        List<String> benefits
) {

    public static List<SpaceRecord> generateMockSpaces() {
        return Arrays.asList(
                new SpaceRecord(
                        "space-moon",
                        "space",
                        "SpaceX",
                        "Lunar Adventure",
                        "2025-12-01T08:00",
                        "2025-12-01T20:00",
                        "12h",
                        500000,
                        0,
                        Arrays.asList("Lunar landing", "Moonwalk", "Zero-G experience")
                ),
                new SpaceRecord(
                        "space-mars",
                        "space",
                        "Blue Origin",
                        "Mars Expedition",
                        "2026-03-15T07:00",
                        "2026-03-25T17:00",
                        "10 days",
                        2500000,
                        0,
                        Arrays.asList("Mars orbit", "Surface exploration", "Zero-G training")
                )
        );
    }
}
