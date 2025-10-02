/**
 * FrankKafkaHotelConsumerApplication.java
 * -----------------------
 * Main Spring Boot Application for Hotel Kafka Consumer microservice in FrankStack Travel AI
 * 
 * NOTES:
 * - Entry point for Spring Boot application
 * - Scans the consumer package for Kafka listeners and REST endpoints
 *
 * Author: Edoardo Sabatini
 * Date: 02 October 2025
 */
package com.frankspring.frankkafkahotelconsumer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.frankspring.frankkafkahotelconsumer")
public class FrankKafkaHotelConsumerApplication {

	public static void main(String[] args) {
		SpringApplication.run(FrankKafkaHotelConsumerApplication.class, args);
	}

}
