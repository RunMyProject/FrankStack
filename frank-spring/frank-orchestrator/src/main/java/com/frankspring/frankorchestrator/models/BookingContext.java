package com.frankspring.frankorchestrator.models;

/**
 * BookingContext.java
 * -----------------------
 * Lombok version of BookingContext with builder support.
 * Encapsulates user and fill form details for a booking.
 * 
 * Author: Edoardo Sabatini
 * Date: 05 October 2025
 */

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import com.frankspring.frankorchestrator.models.User;
import com.frankspring.frankorchestrator.models.FillForm;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingContext {

    private User user;
    private FillForm fillForm;

}
