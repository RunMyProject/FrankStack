package com.frankspring.frankkafkahotelconsumer.models;

/**
 * FillForm.java
 * -----------------------
 * Model class representing a travel booking form with various fields.
 * 
 * Lombok version:
 * - Uses @Data for getters, setters, equals, hashCode, and toString
 * - Uses @Builder for fluent object creation
 * - Maintains default values for all fields
 * 
 * Example:
 * FillForm form = FillForm.builder()
 *      .tripDeparture("Rome")
 *      .tripDestination("Paris")
 *      .budget(1200.50)
 *      .people(2)
 *      .starsOfHotel(4)
 *      .build();
 * 
 * Author: Edoardo Sabatini
 * Date: 07 October 2025
 */

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FillForm {

    @Builder.Default
    private String tripDeparture = "";

    @Builder.Default
    private String tripDestination = "";

    @Builder.Default
    private String dateTimeRoundTripDeparture = "";

    @Builder.Default
    private String dateTimeRoundTripReturn = "";

    @Builder.Default
    private int durationOfStayInDays = 0;

    @Builder.Default
    private String travelMode = "";

    @Builder.Default
    private double budget = 0.0;

    @Builder.Default
    private int people = 0;

    @Builder.Default
    private int starsOfHotel = 0;

    @Builder.Default
    private int luggages = 0;
}
