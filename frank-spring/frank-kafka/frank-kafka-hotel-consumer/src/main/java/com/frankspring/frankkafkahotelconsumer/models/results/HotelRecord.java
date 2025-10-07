package com.frankspring.frankkafkahotelconsumer.models.results;

/**
 * HotelRecord.java
 * -----------------------
 * Immutable mock record representing a single hotel search result.
 * Each record simulates one available hotel with room type, price and amenities.
 *
 * Author: Edoardo Sabatini
 * Date: 07 October 2025
 */

import com.frankspring.frankkafkahotelconsumer.models.FillForm;
import com.frankspring.frankkafkahotelconsumer.models.HotelBookingEntry;
import java.util.List;
import java.util.UUID;
import java.util.Arrays;

public record HotelRecord(
        String id,
        String hotelName,
        int stars,
        String roomType,
        double price,
        String address,
        List<String> amenities,
        Double rating,
        String distanceFromCenter
) {
    /**
     * Generates 3 mock hotels based on user request.
     * The star rating is inherited from FillForm for consistency.
     */
    public static List<HotelRecord> generateMockHotels(FillForm form) {
        int stars = form.getStarsOfHotel() > 0 ? form.getStarsOfHotel() : 3;

        return List.of(
                new HotelRecord(
                        UUID.randomUUID().toString(),
                        "Hotel MiraMare",
                        stars,
                        "Standard Room",
                        110.0,
                        "Via Roma 25, Naples, Italy",
                        Arrays.asList("Wi-Fi", "Air Conditioning", "Breakfast Included"),
                        8.5,
                        "1.2 km from city center"
                ),
                new HotelRecord(
                        UUID.randomUUID().toString(),
                        "Hotel MiraMonti",
                        stars,
                        "Deluxe Room",
                        175.0,
                        "Corso Italia 10, Florence, Italy",
                        Arrays.asList("Wi-Fi", "Breakfast Included", "Fitness Area", "Parking"),
                        9.1,
                        "800 m from city center"
                ),
                new HotelRecord(
                        UUID.randomUUID().toString(),
                        "Hotel Sogni d’Oro",
                        stars,
                        "Suite",
                        230.0,
                        "Piazza Venezia 3, Rome, Italy",
                        Arrays.asList("Wi-Fi", "Spa", "Room Service", "City View"),
                        9.4,
                        "500 m from city center"
                )
        );
    }

    /**
     * Converts HotelRecord to a HotelBookingEntry enriched with trip details.
     */
    public HotelBookingEntry toBookingEntry(FillForm form) {
        return HotelBookingEntry.of(
                "HOTEL_" + this.id,
                this.price,
                form.getPeople(),
                form.getTripDeparture(),
                form.getTripDestination(),
                form.getDateTimeRoundTripDeparture(),
                form.getDateTimeRoundTripReturn(),
                this.hotelName,
                this.stars,
                this.roomType,
                this.address,
                this.amenities,
                this.rating,
                this.distanceFromCenter
        );
    }
}
