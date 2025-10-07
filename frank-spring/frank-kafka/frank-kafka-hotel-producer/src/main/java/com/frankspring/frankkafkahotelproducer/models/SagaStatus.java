package com.frankspring.frankkafkahotelproducer.models;

/**
 * SagaStatus.java
 * -----------------------
 * Enum representing possible saga states for travel booking.
 * Tracks key lifecycle transitions for producer, consumer, and orchestrator.
 * 
 * Example usage:
 * - CREATED -> PRODUCER_IN_PROGRESS -> CONSUMER_IN_PROGRESS -> CONFIRMED
 * - FAILED and CANCELLED for error handling and manual cancellation
 *
 * Author: Edoardo Sabatini
 * Date: 07 October 2025
 */
public enum SagaStatus {
    CREATED,              // Saga created and stored in Hazelcast
    SAGA_IN_PROGRESS,     // Saga is currently being processed
    PRODUCER_IN_PROGRESS, // Saga is being processed by the producer
    CONSUMER_IN_PROGRESS, // Saga is being processed by the consumer
    CONFIRMED,            // Saga completed successfully
    FAILED,               // Saga failed, compensation triggered
    CANCELLED,            // Saga manually cancelled
    TRANSPORT_CONFIRMED   // Saga transport step confirmed
}
