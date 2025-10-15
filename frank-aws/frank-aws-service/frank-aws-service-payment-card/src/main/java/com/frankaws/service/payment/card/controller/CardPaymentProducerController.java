package com.frankaws.service.payment.card.controller;

// ================================================================
// CardPaymentProducerController.java
// ------------------------------------------------
// REST Controller for Frank AWS Lambda Payment Producer
//
// PURPOSE:
// • Exposes an HTTP POST endpoint (/cardpayment/send)
// • Receives payment event payloads from the API Gateway
// • Invokes the internal AWS Lambda (via LambdaInvokerService)
// • Runs on local port 18082 for LocalStack integration testing
//
// TECH NOTES:
// • Uses Spring WebFlux (@RestController + Mono) for reactive flow
// • Translates JSON -> PaymentCardMessage -> Lambda Invocation
// • Follows clean architecture: Controller → Service → AWS SDK
//
// USAGE:
// • Triggered by test-wrapper.sh or local Gateway
// • Returns a Mono<String> with the Lambda response message
//
// Author: Edoardo Sabatini
// Date: 15 October 2025
// ================================================================

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import com.frankaws.service.payment.card.models.PaymentCardMessage;
import com.frankaws.service.payment.card.service.LambdaInvokerService;

/**
 * REST Controller for the Card Payment Producer Service (Port 18082).
 * Acts as an API Facade, receiving HTTP requests from the Gateway
 * and translating them into an internal AWS Lambda invocation event.
 */
@RestController
public class CardPaymentProducerController {

    private final LambdaInvokerService lambdaInvokerService;

    /**
     * Constructor injection for the LambdaInvokerService.
     * Using constructor-based DI ensures immutability and testability.
     */
    public CardPaymentProducerController(LambdaInvokerService lambdaInvokerService) {
        // Avoids field injection (@Autowired) for cleaner design.
        this.lambdaInvokerService = lambdaInvokerService;
    }

    /**
     * Handles POST requests for sending a payment event.
     * Endpoint path matches the API Gateway route.
     * 
     * @param message The JSON payload automatically mapped to PaymentCardMessage.
     * @return Mono<String> representing the Lambda invocation result.
     */
    @PostMapping("/cardpayment/send")
    public Mono<String> sendPaymentEvent(@RequestBody PaymentCardMessage message) {
        // Delegate logic to the LambdaInvokerService → invokes LocalStack Lambda.
        return lambdaInvokerService.invokePaymentCardLambda(message);
    }
}
