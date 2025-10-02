/**
 * FrankKafkaTravelProducerApplication.java
 * -----------------------
 * Main Spring Boot Application for FrankStack Travel Producer Kafka Application
 * 
 * Responsibilities:
 * - Produces travel booking events (search, trip details, reservations) into Kafka topics
 * - Entry point for the travel saga
 * - Scans the package for Spring components and REST endpoints
 *
 * Author: Edoardo Sabatini
 * Date: 02 October 2025
 */
package com.frankspring.frankkafkatravelproducer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.frankspring.frankkafkatravelproducer")
public class FrankKafkaTravelProducerApplication {

	public static void main(String[] args) {
		SpringApplication.run(FrankKafkaTravelProducerApplication.class, args);
	}

}
