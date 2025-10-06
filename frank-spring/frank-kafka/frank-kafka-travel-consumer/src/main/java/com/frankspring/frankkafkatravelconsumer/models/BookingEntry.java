package com.frankspring.frankkafkatravelconsumer.models;

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
 * - Holds details about the booked item, including ID, type, reference, price, number of people, 
 *   and timestamp of the booking.
 * - Used within BookingMessage or BookingUtils to encapsulate individual bookings.
 *
 * Author: Edoardo Sabatini
 * Date: 06 October 2025
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingEntry {

    private String id;              // unique booking reference (UUID)
    private String type;            // plane/train/bus/car/space
    private String reference;       // flightNumber, trainNumber, busNumber, model, missionName
    private double price;           // final price = unitPrice * people
    private int people;             // number of people
    private Instant bookedAt;       // timestamp of the booking

    /**
     * Utility builder method to generate a BookingEntry with automatic UUID and timestamp.
     *
     * @param type      Travel type: "plane", "train", etc.
     * @param reference Reference from model (flightNumber, trainNumber, etc.)
     * @param unitPrice Price per person
     * @param people    Number of people
     * @return BookingEntry instance with calculated price and timestamps
     */
    public static BookingEntry of(String type, String reference, double unitPrice, int people) {
        return BookingEntry.builder()
                .id(UUID.randomUUID().toString())
                .type(type)
                .reference(reference)
                .price(unitPrice * people)
                .people(people)
                .bookedAt(Instant.now())
                .build();
    }
}
