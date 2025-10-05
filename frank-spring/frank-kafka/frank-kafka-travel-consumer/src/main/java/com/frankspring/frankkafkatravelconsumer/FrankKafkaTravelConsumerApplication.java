package com.frankspring.frankkafkatravelconsumer;

/**
 * FrankKafkaTravelConsumerApplication.java
 * -----------------------
 * Main Spring Boot Application for FrankStack Travel Kafka Consumer
 * 
 * NOTES:
 * - Scans the consumer package for Kafka listeners and REST endpoints
 * - Entry point for Spring Boot consumer application
 * - Listens to travel booking events from Kafka topics
 *
 * Author: Edoardo Sabatini
 * Date: 05 October 2025
 */

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.frankspring.frankkafkatravelconsumer")
public class FrankKafkaTravelConsumerApplication {

    public static void main(String[] args) {
        SpringApplication.run(FrankKafkaTravelConsumerApplication.class, args);
    }

}
