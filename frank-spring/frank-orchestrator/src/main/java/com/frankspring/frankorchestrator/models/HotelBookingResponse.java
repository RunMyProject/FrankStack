package com.frankspring.frankorchestrator.models;

/**
 * HotelBookingResponse.java
 * -----------------------
 * Simple response object for booking requests.
 * 
 * RESPONSIBILITIES:
 * - Holds sagaCorrelationId, current saga status, and the selected transport data in ResultsContext.
 * - Designed as a plain data carrier, simple and easy to populate from listener.
 * - Leaves filtering logic (streams, switch) in the listener to keep separation of concerns.
 * 
 * Author: Edoardo Sabatini
 * Date: 07 October 2025
 */

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import com.frankspring.frankorchestrator.models.HotelResults;
import com.frankspring.frankorchestrator.models.SagaStatus;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HotelBookingResponse {

    private String sagaCorrelationId;
    private HotelResults hotelResults;
    @Builder.Default
    private SagaStatus status = SagaStatus.CREATED;
}
