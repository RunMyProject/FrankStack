package com.frankspring.frankkafkatravelconsumer.utils;

/**
 * BookingUtils.java
 * -----------------------
 * Utility class for booking-related operations.
 * Provides methods to find a BookingEntry by travel mode and ID,
 * using complete FillForm data for richer booking details.
 *
 * CHANGELOG:
 * - 07 October 2025: Refactored to accept FillForm instead of just "people"
 *   in order to enrich BookingEntry with travel dates, cities, and luggage info.
 * - 08 October 2025: Added support for companyName field in BookingEntry
 *   for more realistic transport provider details (e.g., ITA Airways, Trenitalia).
 *
 * Author: Edoardo Sabatini
 * Date: 08 October 2025
 */

import com.frankspring.frankkafkatravelconsumer.models.BookingEntry;
import com.frankspring.frankkafkatravelconsumer.models.FillForm;
import com.frankspring.frankkafkatravelconsumer.models.ResultsContext;
import com.frankspring.frankkafkatravelconsumer.models.results.*;

import java.util.Optional;

public class BookingUtils {

    /**
     * Searches for a BookingEntry by travel mode and ID within the corresponding ResultsContext.
     * Enriches the result with data from FillForm (trip cities, dates, luggages).
     *
     * @param travelMode The transport type: "plane", "train", "bus", "car", or "space".
     * @param travelId   The ID of the specific travel option to find.
     * @param form       The complete FillForm containing user booking preferences.
     * @return Optional<BookingEntry> with the matching booking entry, or empty if not found.
     */
    public static Optional<BookingEntry> findByTravelId(String travelMode, String travelId, FillForm form) {
        // Defensive null checks
        if (form == null) {
            System.out.println("⚠️ [BookingUtils] FillForm is null. Cannot process booking.");
            return Optional.empty();
        }

        int people = form.getPeople();
        String tripDeparture = form.getTripDeparture();
        String tripDestination = form.getTripDestination();
        String dateTimeRoundTripDeparture = form.getDateTimeRoundTripDeparture();
        String dateTimeRoundTripReturn = form.getDateTimeRoundTripReturn();
        int luggages = form.getLuggages();

        switch (travelMode.toLowerCase()) {
            case "plane", "flight", "airplane":
                return ResultsContext.getFlights().stream()
                        .filter(f -> f.id().equalsIgnoreCase(travelId))
                        .map(f -> BookingEntry.of(
                                travelMode,
                                f.flightNumber(),
                                f.companyName(),
                                f.price(),
                                people,
                                tripDeparture,
                                tripDestination,
                                dateTimeRoundTripDeparture,
                                dateTimeRoundTripReturn,
                                luggages
                        ))
                        .findFirst();

            case "train":
                return ResultsContext.getTrains().stream()
                        .filter(t -> t.id().equalsIgnoreCase(travelId))
                        .map(t -> BookingEntry.of(
                                travelMode,
                                t.trainNumber(),
                                t.companyName(),
                                t.price(),
                                people,
                                tripDeparture,
                                tripDestination,
                                dateTimeRoundTripDeparture,
                                dateTimeRoundTripReturn,
                                luggages
                        ))
                        .findFirst();

            case "bus":
                return ResultsContext.getBuses().stream()
                        .filter(b -> b.id().equalsIgnoreCase(travelId))
                        .map(b -> BookingEntry.of(
                                travelMode,
                                b.busNumber(),
                                b.companyName(),
                                b.price(),
                                people,
                                tripDeparture,
                                tripDestination,
                                dateTimeRoundTripDeparture,
                                dateTimeRoundTripReturn,
                                luggages
                        ))
                        .findFirst();

            case "car":
                return ResultsContext.getCars().stream()
                        .filter(c -> c.id().equalsIgnoreCase(travelId))
                        .map(c -> BookingEntry.of(
                                travelMode,
                                c.model(),
                                c.companyName(),
                                c.price(),
                                people,
                                tripDeparture,
                                tripDestination,
                                dateTimeRoundTripDeparture,
                                dateTimeRoundTripReturn,
                                luggages
                        ))
                        .findFirst();

            case "space", "spaceship", "rocket":
                return ResultsContext.getSpaces().stream()
                        .filter(s -> s.id().equalsIgnoreCase(travelId))
                        .map(s -> BookingEntry.of(
                                travelMode,
                                s.missionName(),
                                s.companyName(),
                                s.price(),
                                people,
                                tripDeparture,
                                tripDestination,
                                dateTimeRoundTripDeparture,
                                dateTimeRoundTripReturn,
                                luggages
                        ))
                        .findFirst();

            default:
                System.out.println("❓ [BookingUtils] Unknown travel mode: " + travelMode);
                return Optional.empty();
        }
    }
}
