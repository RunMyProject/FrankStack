package com.frankspring.frankkafkahotelproducer.models;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * HotelBookingEntry.java
 * -----------------------
 * Represents a single hotel booking entry in the system.
 *
 * RESPONSIBILITIES:
 * - Acts as a data carrier object (DCO) for hotel booking information.
 * - Holds all relevant data for a hotel stay, including name, address,
 *   stars, room type, amenities, and alignment with trip dates.
 * - Used within BookingMessage or SagaStep to encapsulate hotel reservations
 *   alongside transport bookings.
 *
 * Author: Edoardo Sabatini
 * Date: 07 October 2025
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HotelBookingEntry {

    private String id;                             // unique booking reference (UUID)
    private String type;                           // booking type (e.g. "hotel")
    private String reference;                      // internal or external booking code
    private double price;                          // total booking price
    private int people;                            // number of guests
    private Instant bookedAt;                      // timestamp of booking creation

    private String tripDeparture;                  // trip departure city
    private String tripDestination;                // trip destination city
    private String dateTimeRoundTripDeparture;     // check-in aligned with trip start
    private String dateTimeRoundTripReturn;        // check-out aligned with trip end

    // Hotel-specific fields
    private String hotelName;                      // name of the hotel
    private int stars;                             // 1-7 rating
    private String roomType;                       // type of room booked
    private String address;                        // hotel address
    private List<String> amenities;                // list of available amenities
    private Double rating;                         // optional rating (1-10)
    private String distanceFromCenter;             // e.g. "2.5 km from city center"

    /**
     * Utility builder method to generate a HotelBookingEntry
     * with automatic UUID and timestamp.
     *
     * @param reference Booking reference or code
     * @param price Total booking price
     * @param people Number of guests
     * @param tripDeparture Departure city
     * @param tripDestination Destination city
     * @param dateTimeRoundTripDeparture Check-in date/time
     * @param dateTimeRoundTripReturn Check-out date/time
     * @param hotelName Name of the hotel
     * @param stars Star rating
     * @param roomType Room type
     * @param address Hotel address
     * @param amenities List of amenities
     * @param rating Optional rating
     * @param distanceFromCenter Distance from city center
     * @return HotelBookingEntry instance with UUID and timestamp
     */
    public static HotelBookingEntry of(
            String reference,
            double price,
            int people,
            String tripDeparture,
            String tripDestination,
            String dateTimeRoundTripDeparture,
            String dateTimeRoundTripReturn,
            String hotelName,
            int stars,
            String roomType,
            String address,
            List<String> amenities,
            Double rating,
            String distanceFromCenter
    ) {
        return HotelBookingEntry.builder()
                .id(UUID.randomUUID().toString())
                .type("hotel")
                .reference(reference)
                .price(price)
                .people(people)
                .tripDeparture(tripDeparture)
                .tripDestination(tripDestination)
                .dateTimeRoundTripDeparture(dateTimeRoundTripDeparture)
                .dateTimeRoundTripReturn(dateTimeRoundTripReturn)
                .hotelName(hotelName)
                .stars(stars)
                .roomType(roomType)
                .address(address)
                .amenities(amenities)
                .rating(rating)
                .distanceFromCenter(distanceFromCenter)
                .bookedAt(Instant.now())
                .build();
    }
}
