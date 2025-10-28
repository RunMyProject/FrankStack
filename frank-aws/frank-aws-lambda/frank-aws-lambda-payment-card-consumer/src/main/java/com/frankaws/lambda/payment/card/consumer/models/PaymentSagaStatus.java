package com.frankaws.lambda.payment.card.consumer.models;

/**
 * PaymentSagaStatus.java
 * -----------------------
 * Enumeration representing the status of a card payment saga.
 * 
 * Author: Edoardo Sabatini
 * Date: 28 October 2025
 */

public enum PaymentSagaStatus {
    CREATED,    // Message created, not yet processed
    PENDING,    // Payment is pending
    PROCESSING, // Payment is currently being processed
    SUCCESS,    // Payment completed successfully
    FAILED      // Payment failed
}