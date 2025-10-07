package com.frankspring.frankkafkahotelproducer.models;

/**
 * BookingContext.java
 * -----------------------
 * Lombok version of BookingContext with builder support.
 * Encapsulates user and fill form details for a booking.
 * 
 * Author: Edoardo Sabatini
 * Date: 07 October 2025
 */

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import com.frankspring.frankkafkahotelproducer.models.User;
import com.frankspring.frankkafkahotelproducer.models.FillForm;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingContext {

    private User user;
    private FillForm fillForm;

}
