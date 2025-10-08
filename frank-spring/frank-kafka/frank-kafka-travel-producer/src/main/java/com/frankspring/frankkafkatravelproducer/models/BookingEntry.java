package com.frankspring.frankkafkatravelproducer.models;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.Instant;
import java.util.UUID;

/**
 * BookingEntry.java
 * -----------------------
 * Represents a single booking entry for any transport type.
 *
 * RESPONSIBILITIES:
 * - Acts as a data carrier object (DCO) for booking information.
 * - Holds details about the booked item, including ID, type, reference, price,
 *   number of people, travel details (cities, times, luggages), and timestamp.
 * - Used within BookingMessage or BookingUtils to encapsulate individual bookings.
 *
 * Author: Edoardo Sabatini
 * Date: 08 October 2025
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingEntry {

    private String id;                     // unique booking reference (UUID)
    private String type;                   // plane/train/bus/car/space
    private String reference;              // flightNumber, trainNumber, etc.
    private String companyName;            // airline or transport company name
    private double price;                  // final price = unitPrice * people
    private int people;                    // number of people
    private Instant bookedAt;              // timestamp of the booking

    private String tripDeparture;          // departure city
    private String tripDestination;        // destination city
    private String dateTimeRoundTripDeparture; // departure date/time
    private String dateTimeRoundTripReturn;    // return date/time
    private int luggages;                  // number of luggages

    /**
     * Utility builder method to generate a BookingEntry with automatic UUID and timestamp.
     *
     * @param type Travel type: "plane", "train", etc.
     * @param reference Reference from model (flightNumber, trainNumber, etc.)
     * @param companyName Airline or transport company name
     * @param unitPrice Price per person
     * @param people Number of people
     * @param tripDeparture Departure city
     * @param tripDestination Destination city
     * @param dateTimeRoundTripDeparture Departure date/time
     * @param dateTimeRoundTripReturn Return date/time
     * @param luggages Number of luggages
     * @return BookingEntry instance with calculated price and timestamps
     */
    public static BookingEntry of(
            String type,
            String reference,
            String companyName,
            double unitPrice,
            int people,
            String tripDeparture,
            String tripDestination,
            String dateTimeRoundTripDeparture,
            String dateTimeRoundTripReturn,
            int luggages
    ) {
        return BookingEntry.builder()
                .id(UUID.randomUUID().toString())
                .type(type)
                .reference(reference)
                .companyName(companyName)
                .price(unitPrice * people)
                .people(people)
                .tripDeparture(tripDeparture)
                .tripDestination(tripDestination)
                .dateTimeRoundTripDeparture(dateTimeRoundTripDeparture)
                .dateTimeRoundTripReturn(dateTimeRoundTripReturn)
                .luggages(luggages)
                .bookedAt(Instant.now())
                .build();
    }
}
