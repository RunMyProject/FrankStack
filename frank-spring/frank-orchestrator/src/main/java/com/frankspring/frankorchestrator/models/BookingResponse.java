package com.frankspring.frankorchestrator.models;

/**
 * BookingResponse.java
 * -----------------------
 * Simple response object for booking requests.
 * 
 * RESPONSIBILITIES:
 * - Holds sagaCorrelationId, current saga status, and the selected transport data in ResultsContext.
 * - Designed as a plain data carrier, simple and easy to populate from listener.
 * - Leaves filtering logic (streams, switch) in the listener to keep separation of concerns.
 * 
 * Author: Edoardo Sabatini
 * Date: 05 October 2025
 */

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import com.frankspring.frankorchestrator.models.Results;
import com.frankspring.frankorchestrator.models.SagaStatus;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse {

    private String sagaCorrelationId;
    private Results results;
    @Builder.Default
    private SagaStatus status = SagaStatus.CREATED;
}
