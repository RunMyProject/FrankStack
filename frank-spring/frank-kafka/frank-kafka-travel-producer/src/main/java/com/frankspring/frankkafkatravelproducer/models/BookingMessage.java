package com.frankspring.frankkafkatravelproducer.models;

/**
 * BookingMessage.java
 * -----------------------
 * Lombok version of BookingMessage with builder support.
 * Tracks sagaCorrelationId, booking context, and current saga status.
 * 
 * Author: Edoardo Sabatini
 * Date: 05 October 2025
 */

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import com.frankspring.frankkafkatravelproducer.models.BookingContext;
import com.frankspring.frankkafkatravelproducer.models.SagaStatus;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingMessage {

    private String sagaCorrelationId;
    private BookingContext bookingContext;
    @Builder.Default
    private SagaStatus status = SagaStatus.CREATED;

}
