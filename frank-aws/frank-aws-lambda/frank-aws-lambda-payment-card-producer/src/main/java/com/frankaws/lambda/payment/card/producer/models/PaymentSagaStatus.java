package com.frankaws.lambda.payment.card.producer.models;

/**
 * PaymentSagaStatus.java
 * -----------------------
 * Enumeration representing the status of a card payment saga.
 * 
 * Author: Edoardo Sabatini
 * Date: 15 October 2025
 */

public enum PaymentSagaStatus {
    CREATED,    // Message created, not yet processed
    PROCESSING, // Payment is currently being processed
    SUCCESS,    // Payment completed successfully
    FAILED      // Payment failed
}
