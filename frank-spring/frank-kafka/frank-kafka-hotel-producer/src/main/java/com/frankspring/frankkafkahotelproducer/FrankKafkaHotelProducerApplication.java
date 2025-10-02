/**
 * FrankKafkaHotelProducerApplication.java
 * -----------------------
 * Main Spring Boot Application for Hotel Kafka Producer in FrankStack Travel AI
 * 
 * NOTES:
 * - Entry point for hotel producer microservice
 * - Sends hotel booking events (availability, reservations) to Kafka topics
 * - Scans base package for Spring components
 *
 * Author: Edoardo Sabatini
 * Date: 02 October 2025
 */
package com.frankspring.frankkafkahotelproducer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.frankspring.frankkafkahotelproducer")
public class FrankKafkaHotelProducerApplication {

    public static void main(String[] args) {
        SpringApplication.run(FrankKafkaHotelProducerApplication.class, args);
    }

}
