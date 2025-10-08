package com.frankspring.frankkafkahotelconsumer.utils;

/**
 * BookingUtils.java
 * -----------------------
 * Utility class for booking-related operations.
 * Provides methods to find a HotelBookingEntry by hotel ID,
 * enriching it with complete FillForm data for travel dates, cities.
 *
 * CHANGELOG:
 * - 07 October 2025: Refactored to use FillForm instead of just "people"
 *   to provide richer booking details.
 *
 * Author: Edoardo Sabatini
 * Date: 08 October 2025
 */

import com.frankspring.frankkafkahotelconsumer.models.HotelBookingEntry;
import com.frankspring.frankkafkahotelconsumer.models.FillForm;
import com.frankspring.frankkafkahotelconsumer.models.ResultsContext;

import java.util.Optional;

public class BookingUtils {

    /**
     * Searches for a HotelBookingEntry by hotel ID within the ResultsContext.
     * Enriches the result with data from FillForm (trip cities, dates, luggage).
     *
     * @param hotelId The ID of the specific hotel to find.
     * @param form    The complete FillForm containing user booking preferences.
     * @return Optional<HotelBookingEntry> with the matching entry, or empty if not found.
     */
    public static Optional<HotelBookingEntry> findByHotelId(String hotelId, FillForm form, String userLang) {
        if (form == null || hotelId == null || hotelId.isEmpty()) {
            return Optional.empty();
        }

        return ResultsContext.getHotels(form, userLang).stream()
                .filter(h -> h.id().equalsIgnoreCase(hotelId))
                .map(h -> h.toBookingEntry(form))
                .findFirst();
    }
}
