package com.frankspring.frankkafkahotelconsumer.utils;

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
 *
 * Author: Edoardo Sabatini
 * Date: 07 October 2025
 */

import com.frankspring.frankkafkahotelconsumer.models.HotelBookingEntry;
import com.frankspring.frankkafkahotelconsumer.models.FillForm;
import com.frankspring.frankkafkahotelconsumer.models.ResultsContext;
import com.frankspring.frankkafkahotelconsumer.models.results.*;

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
     public static Optional<HotelBookingEntry> findByTravelId(String travelMode, String travelId, FillForm form) {

        if (form == null) return Optional.empty();

        return ResultsContext.getHotels(form).stream()
                        .filter(h -> h.id().equalsIgnoreCase(travelId))
                        .map(h -> h.toBookingEntry(form))
                        .findFirst();
      }
}
