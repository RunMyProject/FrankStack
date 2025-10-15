package com.frankaws.lambda.payment.card.producer.lambda;

/**
 * PaymentCardLambda.java
 * ----------------------------------------
 * AWS Lambda for CardPayment producer with LocalStack support.
 *
 * FEATURES:
 * - Accepts PaymentCardMessage from API Gateway or direct invocation
 * - Publishes message to SNS topic with proper JSON serialization
 * - Works with LocalStack via endpoint configuration
 * - Returns structured response
 *
 * Author: Edoardo Sabatini
 * Date: 15 October 2025
 */

import com.frankaws.lambda.payment.card.producer.models.PaymentCardMessage;
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.PublishRequest;
import software.amazon.awssdk.services.sns.model.PublishResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;

public class PaymentCardLambda implements RequestHandler<PaymentCardMessage, String> {

    private static final ObjectMapper objectMapper = new ObjectMapper();
    private final SnsClient snsClient;
    private final String topicArn;

    public PaymentCardLambda() {

        // Read SNS topic ARN from environment variable set by deploy script
        this.topicArn = System.getenv("SNS_TOPIC_ARN") != null
            ? System.getenv("SNS_TOPIC_ARN")
            : "arn:aws:sns:eu-central-1:000000000000:cardPaymentTopic";

        // Read AWS endpoint URL for LocalStack (e.g., http://host.docker.internal:4566)
        String endpointUrl = System.getenv("AWS_ENDPOINT_URL");

        // Build SNS client with LocalStack endpoint if available
        var builder = SnsClient.builder();

        if (endpointUrl != null && !endpointUrl.isEmpty()) {
            builder.endpointOverride(URI.create(endpointUrl));
        }

        this.snsClient = builder
            .region(software.amazon.awssdk.regions.Region.EU_CENTRAL_1)
            .build();
    }

    @Override
    public String handleRequest(PaymentCardMessage msg, Context ctx) {
        ctx.getLogger().log("=== PaymentCardLambda Invoked ===");
        ctx.getLogger().log("Saga Correlation ID: " + msg.getSagaCorrelationId());

        try {
            // Serialize message to proper JSON
            String jsonMessage = objectMapper.writeValueAsString(msg);
            ctx.getLogger().log("Message JSON: " + jsonMessage);

            // Publish to SNS
            PublishRequest request = PublishRequest.builder()
                .topicArn(topicArn)
                .message(jsonMessage)
                .subject("CardPayment - " + msg.getSagaCorrelationId())
                .build();

            ctx.getLogger().log("Publishing to topic: " + topicArn);
            PublishResponse response = snsClient.publish(request);

            String successMsg = "✅ Message published with ID: " + response.messageId();
            ctx.getLogger().log(successMsg);
            return successMsg;

        } catch (Exception e) {
            String errorMsg = "❌ Failed to publish message: " + e.getMessage();
            ctx.getLogger().log(errorMsg);
            e.printStackTrace(System.err);
            throw new RuntimeException(errorMsg, e);
        }
    }
}
