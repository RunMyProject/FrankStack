package com.frankaws.service.payment.card.service;

// ================================================================
// LambdaInvokerService.java
// ------------------------------------------------
// Service class responsible for invoking the PaymentCard Lambda
//
// PURPOSE:
// • Serializes PaymentCardMessage objects and sends them to AWS Lambda
//   running on LocalStack for testing local producer/consumer flows.
// • Provides a reactive Mono<String> response for non-blocking API integration
// • Encapsulates all AWS SDK v2 Lambda logic in a single service
//
// TECH NOTES:
// • Uses AWS SDK v2 with LambdaClient configured for LocalStack endpoint
// • Reactive Mono from Reactor is used to wrap blocking invocation call
// • Any Lambda errors are mapped to RuntimeException for upstream handling
// • ObjectMapper handles JSON serialization of the payment message
//
// USAGE:
// • Injected in CardPaymentProducerController to handle '/cardpayment/send'
// • Returns a string with success message and Lambda payload ID
//
// Author: Edoardo Sabatini
// Date: 15 October 2025
// ================================================================

import com.frankaws.service.payment.card.models.PaymentCardMessage;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.lambda.LambdaClient;
import software.amazon.awssdk.services.lambda.model.InvokeRequest;
import software.amazon.awssdk.services.lambda.model.InvokeResponse;

import java.net.URI;

@Service
public class LambdaInvokerService {

    private static final String LAMBDA_NAME = "PaymentCardLambda";

    // LocalStack endpoint inside Docker container network
    private static final String LOCALSTACK_ENDPOINT = "http://172.17.0.1:4566"; 

    private final ObjectMapper objectMapper = new ObjectMapper();

    // Initialize Lambda client pointing to LocalStack
    private final LambdaClient lambdaClient = LambdaClient.builder()
        .endpointOverride(URI.create(LOCALSTACK_ENDPOINT))
        .region(Region.EU_CENTRAL_1)
        .build();

    /**
     * Serialize the payment message and invoke the PaymentCard Lambda on LocalStack.
     * @param message The payment payload received from the controller
     * @return Mono<String> containing the Lambda invocation result
     */
    public Mono<String> invokePaymentCardLambda(PaymentCardMessage message) {
        return Mono.fromCallable(() -> {
            // 1. Serialize Java object into JSON bytes
            SdkBytes payload = SdkBytes.fromUtf8String(objectMapper.writeValueAsString(message));

            // 2. Build the Lambda invocation request
            InvokeRequest request = InvokeRequest.builder()
                .functionName(LAMBDA_NAME)
                .payload(payload)
                .build();

            // 3. Execute synchronous call to Lambda (on LocalStack)
            InvokeResponse response = lambdaClient.invoke(request);

            // 4. Decode payload returned by Lambda
            String result = response.payload().asUtf8String();

            // Handle Lambda errors
            if (response.functionError() != null) {
                throw new RuntimeException("Lambda Error: " + result);
            }

            // Return success message with Lambda ID
            return "Lambda Invoked Successfully: " + result;

        }).onErrorMap(e -> new RuntimeException("Error during Lambda invocation", e));
    }
}
