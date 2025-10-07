package com.frankspring.frankkafkahotelconsumer.models;

/**
 * BookingMessage.java
 * -----------------------
 * Lombok version of BookingMessage with builder support.
 * Tracks sagaCorrelationId, booking context, and current saga status.
 * 
 * Author: Edoardo Sabatini
 * Date: 07 October 2025
 */

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import com.frankspring.frankkafkahotelconsumer.models.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingMessage {

    private String sagaCorrelationId;
    private BookingContext bookingContext;
    @Builder.Default
    private SagaStatus status = SagaStatus.CREATED;
    private SagaContext sagaContext;
}
