package com.frankspring.frankkafkahotelconsumer.models.results;

/**
 * HotelRecord.java
 * -----------------------
 * Immutable mock record representing a single hotel search result.
 * Each record simulates one available hotel with room type, price and amenities.
 *
 * Author: Edoardo Sabatini
 * Date: 08 October 2025
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
     public static List<HotelRecord> generateMockHotels(FillForm form, String userLang) {
        String city = form.getTripDestination();
        int startOfHotel = form.getStarsOfHotel();
        return List.of(
                new HotelRecord(
                        "hotel-001",
                        "Hilton",
                        startOfHotel, // stars set to 0 to signal error if misused
                        "Standard Room",
                        120.0,
                        city,
                        Arrays.asList("Wi-Fi", "Air Conditioning", "Breakfast Included"),
                        8.0,
                        "1 km from city center"
                ),
                new HotelRecord(
                        "hotel-002",
                        "Marriott",
                        startOfHotel,
                        "Deluxe Room",
                        200.0,
                        city,
                        Arrays.asList("Wi-Fi", "Breakfast Included", "Fitness Center", "Parking"),
                        8.8,
                        "1.5 km from city center"
                ),
                new HotelRecord(
                        "hotel-003",
                        "Sheraton",
                        startOfHotel,
                        "Suite",
                        250.0,
                        city,
                        Arrays.asList("Wi-Fi", "Spa", "Room Service", "City View"),
                        9.2,
                        "2 km from city center"
                )
        );
    }

    /**
     * Converts HotelRecord to a HotelBookingEntry enriched with trip details.
     */
     public HotelBookingEntry toBookingEntry(FillForm form) {
        double totalPrice = this.price * form.getPeople();

        return HotelBookingEntry.of(
                "HOTEL_" + this.id,
                totalPrice,
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
