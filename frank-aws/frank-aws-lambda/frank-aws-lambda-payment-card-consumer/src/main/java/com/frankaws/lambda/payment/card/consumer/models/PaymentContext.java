package com.frankaws.lambda.payment.card.consumer.models;

/**
 * PaymentContext.java
 * -----------------------
 * Simplified context for PaymentCardMessage.
 * Keeps track of optional references like travelId and hotelId,
 * as well as the total amount to be charged.
 * 
 * Author: Edoardo Sabatini
 * Date: 15 October 2025
 */

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentContext {
    private String travelId;   // Reference to a travel booking (if any)
    private String hotelId;    // Reference to a hotel booking (if any)
    private BigDecimal total;  // Amount to be charged
}
