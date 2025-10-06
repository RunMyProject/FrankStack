package com.frankspring.frankkafkatravelproducer.models;

/**
 * SagaContext.java
 * -----------------------
 * Encapsulates saga-related data like selected and booked transport/hotel IDs.
 * 
 * Author: Edoardo Sabatini
 * Date: 06 October 2025
 */

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SagaContext {
    private String selectedTravelId;
    private String bookedTravelId;
    private String selectedHotelId;
    private String bookedHotelId;
}
