package com.frankaws.lambda.payment.card.consumer.models;

/**
 * PaymentCardMessage.java
 * -----------------------
 * Lombok version of PaymentCardMessage with builder support.
 * Represents a single card payment message to be sent via SNS.
 * 
 * FEATURES:
 * - Tracks sagaCorrelationId
 * - Stores payment token (myStripeToken) 
 * - Keeps payment context reference (PaymentContext)
 * - Includes current saga/payment status (PaymentSagaStatus)
 * 
 * Author: Edoardo Sabatini
 * Date: 28 October 2025
 */

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentCardMessage {

    private String sagaCorrelationId;     // Unique correlation ID for this payment
    private String myStripeToken;         // Token generated for the card transaction
    @Builder.Default
    private PaymentSagaStatus status = PaymentSagaStatus.CREATED; // Current payment status
    private PaymentContext context;       // Optional payment context (total, references)
    private String invoiceUrl;            // URL of the generated invoice in S3
}
