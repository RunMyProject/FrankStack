package com.frankspring.frankorchestrator.service;

/**
 * SagaStorageService.java
 * -----------------------
 * Service for managing saga state in Hazelcast.
 *
 * CHANGES (07 October 2025):
 * - Store saga state as JSON string in Hazelcast to avoid Compact serialization issues
 *   with java.time types (Instant). Uses injected ObjectMapper (configured with JavaTimeModule).
 *
 * Author: Edoardo Sabatini
 * Date: 07 October 2025 (updated 07 October 2025)
 */

import com.hazelcast.core.HazelcastInstance;
import com.hazelcast.map.IMap;
import com.frankspring.frankorchestrator.models.BookingMessage;
import com.frankspring.frankorchestrator.models.BookingContext;
import com.frankspring.frankorchestrator.models.SagaStatus;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.UUID;

@Service
public class SagaStorageServiceOld {

    @Autowired
    private HazelcastInstance hazelcastInstance;

    @Autowired
    private ObjectMapper objectMapper; // Spring-configured mapper (with JavaTimeModule)

    private static final String SAGA_MAP_NAME = "sagaStore";

    /**
     * 🔹 Create a new saga and store it in Hazelcast (as JSON string).
     * @param bookingContext BookingContext object
     * @return BookingMessage containing sagaCorrelationId and context
     */
    public BookingMessage createSaga(BookingContext bookingContext) {
        String sagaId = UUID.randomUUID().toString();
        BookingMessage message = BookingMessage.builder()
                .sagaCorrelationId(sagaId)
                .bookingContext(bookingContext)
                .status(SagaStatus.CREATED)
                .build();

        try {
            IMap<String, String> sagaMap = hazelcastInstance.getMap(SAGA_MAP_NAME);
            String json = objectMapper.writeValueAsString(message);
            sagaMap.put(sagaId, json);

            System.out.println("💾 [STORAGE] Saga stored in Hazelcast (json): " + sagaId);
        } catch (Exception e) {
            System.err.println("💥 [STORAGE] Error storing saga as JSON: " + e.getMessage());
            e.printStackTrace();
            // still return the POJO so caller has the id/context
        }
        return message;
    }

    /**
     * 🔹 Retrieve saga by sagaCorrelationId (reads JSON and deserializes to BookingMessage)
     * @param sagaId Saga identifier
     * @return BookingMessage object, or null if not found / on error
     */
    public BookingMessage getSaga(String sagaId) {
        IMap<String, String> sagaMap = hazelcastInstance.getMap(SAGA_MAP_NAME);
        String json = sagaMap.get(sagaId);

        if (json == null) {
            System.out.println("⚠️ [STORAGE] Saga not found: " + sagaId);
            return null;
        }

        try {
            BookingMessage message = objectMapper.readValue(json, BookingMessage.class);
            System.out.println("📦 [STORAGE] Retrieved saga: " + sagaId);
            return message;
        } catch (Exception e) {
            System.err.println("💥 [STORAGE] Error deserializing saga JSON for id " + sagaId + ": " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    /**
     * 🔹 Check if saga exists in storage
     * @param sagaId Saga identifier
     * @return true if exists, false otherwise
     */
    public boolean exists(String sagaId) {
        IMap<String, String> sagaMap = hazelcastInstance.getMap(SAGA_MAP_NAME);
        return sagaMap.containsKey(sagaId);
    }

    /**
     * 🔹 Delete saga from storage
     * @param sagaId Saga identifier
     */
    public void deleteSaga(String sagaId) {
        IMap<String, String> sagaMap = hazelcastInstance.getMap(SAGA_MAP_NAME);
        sagaMap.remove(sagaId);
        System.out.println("🗑️ [STORAGE] Deleted saga: " + sagaId);
    }

    /**
     * 🔹 Update full saga object (stores as JSON string)
     * @param bookingMessage Updated BookingMessage object
     */
    public void updateSaga(BookingMessage bookingMessage) {
        if (bookingMessage == null || bookingMessage.getSagaCorrelationId() == null) {
            System.err.println("❌ [STORAGE] Invalid BookingMessage - missing sagaCorrelationId");
            return;
        }

        try {
            IMap<String, String> sagaMap = hazelcastInstance.getMap(SAGA_MAP_NAME);
            String json = objectMapper.writeValueAsString(bookingMessage);
            sagaMap.put(bookingMessage.getSagaCorrelationId(), json);

            System.out.println("✅ [STORAGE] Updated saga in Hazelcast: "
                    + bookingMessage.getSagaCorrelationId()
                    + " -> status=" + bookingMessage.getStatus());
        } catch (Exception e) {
            System.err.println("💥 [STORAGE] Error updating saga as JSON: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
