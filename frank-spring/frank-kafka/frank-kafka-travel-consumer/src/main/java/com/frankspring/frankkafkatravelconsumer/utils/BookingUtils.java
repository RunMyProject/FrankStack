package com.frankspring.frankkafkatravelconsumer.utils;

/**
 * BookingUtils.java
 * -----------------------
 * Utility class for booking-related operations.
 * Provides methods to find BookingEntry by travel mode and ID.
 * 
 * Author: Edoardo Sabatini
 * Date: 06 October 2025    
 */

import com.frankspring.frankkafkatravelconsumer.models.BookingEntry;
import com.frankspring.frankkafkatravelconsumer.models.ResultsContext;
import com.frankspring.frankkafkatravelconsumer.models.results.*;

import java.util.Optional;

public class BookingUtils {

    /**
     * Searches for a BookingEntry by travel mode and ID within the given Results object.
     * Automatically calculates price based on number of people and generates UUID + timestamp.
     *
     * @param travelMode The type of transport: "plane", "train", "bus", "car", "space".
     * @param travelId   The ID of the specific travel item to find.
     * @param people     Number of people for this booking (used for price calculation).
     * @return Optional<BookingEntry> with the matching booking, or empty if not found.
     */
    public static Optional<BookingEntry> findByTravelId(String travelMode, String travelId, int people) {
        switch (travelMode.toLowerCase()) {
            case "plane", "flight", "airplane":
                return ResultsContext.getFlights().stream()
                        .filter(f -> f.id().equalsIgnoreCase(travelId))
                        .map(f -> BookingEntry.of(travelMode, f.flightNumber(), f.price(), people))
                        .findFirst();

            case "train":
                return ResultsContext.getTrains().stream()
                        .filter(t -> t.id().equalsIgnoreCase(travelId))
                        .map(t -> BookingEntry.of(travelMode, t.trainNumber(), t.price(), people))
                        .findFirst();

            case "bus":
                return ResultsContext.getBuses().stream()
                        .filter(b -> b.id().equalsIgnoreCase(travelId))
                        .map(b -> BookingEntry.of(travelMode, b.busNumber(), b.price(), people))
                        .findFirst();

            case "car":
                return ResultsContext.getCars().stream()
                        .filter(c -> c.id().equalsIgnoreCase(travelId))
                        .map(c -> BookingEntry.of(travelMode, c.model(), c.price(), people))
                        .findFirst();

            case "space", "spaceship", "rocket":
                return ResultsContext.getSpaces().stream()
                        .filter(s -> s.id().equalsIgnoreCase(travelId))
                        .map(s -> BookingEntry.of(travelMode, s.missionName(), s.price(), people))
                        .findFirst();

            default:
                return Optional.empty();
        }
    }
}
