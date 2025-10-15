package com.frankaws.lambda.payment.card.producer;

/*
 * ==========================================================
 * Spring Boot Entry Point (NOT REQUIRED FOR AWS LAMBDA)
 * --------------------------------------------------------
 * This class is the standard entry point for a traditional 
 * Spring Boot standalone application.
 * * In this project, the application is deployed as a native
 * AWS Lambda function, which means:
 * 1. The AWS Lambda runtime invokes the specific 'handleRequest'
 * method defined in PaymentCardLambda.java (the Handler).
 * 2. The entire Spring Boot framework is unnecessary for this 
 * simple producer logic, saving startup time and memory.
 * 3. This class and its main method will be ignored by the 
 * Lambda runtime environment.
 * ==========================================================
 *
 * Author: Edoardo Sabatini
 * Date: 15 October 2025
 */
// @SpringBootApplication
public class FrankAwsLambdaPaymentCardProducerApplication {

        public static void main(String[] args) {
                // SpringApplication.run(FrankAwsLambdaPaymentCardProducerApplication.class, args);
        }

}