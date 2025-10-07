package com.frankspring.frankkafkahotelproducer.models;

/**
 * SagaContext.java
 * -----------------------
 * Encapsulates saga-related data like selected and booked transport/hotel IDs.
 * Used to maintain state across the travel booking saga.
 * BookingEntry is now included to track booking details.
 *      
 * Author: Edoardo Sabatini
 * Date: 07 October 2025
 */

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.frankspring.frankkafkahotelproducer.models.HotelBookingEntry;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SagaContext {
    private String selectedTravelId;
    private String bookedTravelId;
    private String selectedHotelId;
    private String bookedHotelId;
    private HotelBookingEntry hotelBookingEntry;
}
