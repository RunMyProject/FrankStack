package com.frankaws.lambda.payment.card.consumer;

/**
 * FrankAwsLambdaPaymentCardConsumerApplication.java
 * -------------------------------------------------
 * Main Spring Boot application class for CardPayment Consumer Lambda.
 * 
 * FEATURES:
 * - Bootstraps the Spring Boot application
 * - Initializes the Lambda microservice for consuming messages from AWS SQS
 * - Supports processing of card payment events via LocalStack SNS/SQS flow
 * 
 * Author: Edoardo Sabatini
 * Date: 15 October 2025
 * 
 * PURPOSE:
 * - Provide a clean entry point for the CardPayment Consumer Lambda
 * - Ensure reactive and minimal setup for testing and monitoring
 */

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class FrankAwsLambdaPaymentCardConsumerApplication {

    public static void main(String[] args) {
        SpringApplication.run(FrankAwsLambdaPaymentCardConsumerApplication.class, args);
    }

}
