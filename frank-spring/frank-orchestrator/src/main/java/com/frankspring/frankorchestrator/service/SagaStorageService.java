package com.frankspring.frankorchestrator.service;

/**
 * SagaStorageService.java
 * -----------------------
 * Service for managing saga state in Hazelcast.
 * 
 * FEATURES:
 * - Create and store saga data
 * - Retrieve saga by ID
 * - Update saga object/status
 * - Delete saga (cleanup)
 * 
 * NOTES:
 * - Uses Hazelcast distributed map for storage
 * - Designed for Saga pattern with real-time updates
 * 
 * Author: Edoardo Sabatini
 * Date: 05 October 2025
 */

import com.hazelcast.core.HazelcastInstance;
import com.hazelcast.map.IMap;
import com.frankspring.frankorchestrator.models.BookingMessage;
import com.frankspring.frankorchestrator.models.BookingContext;
import com.frankspring.frankorchestrator.models.SagaStatus;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class SagaStorageService {

    @Autowired
    private HazelcastInstance hazelcastInstance;

    private static final String SAGA_MAP_NAME = "sagaStore";

    /**
     * 🔹 Create a new saga and store it in Hazelcast
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

        IMap<String, BookingMessage> sagaMap = hazelcastInstance.getMap(SAGA_MAP_NAME);
        sagaMap.put(sagaId, message);

        System.out.println("💾 [STORAGE] Saga stored in Hazelcast: " + sagaId);
        return message;
    }

    /**
     * 🔹 Retrieve saga by sagaCorrelationId
     * @param sagaId Saga identifier
     * @return BookingMessage object, or null if not found
     */
    public BookingMessage getSaga(String sagaId) {
        IMap<String, BookingMessage> sagaMap = hazelcastInstance.getMap(SAGA_MAP_NAME);
        BookingMessage message = sagaMap.get(sagaId);

        if (message != null) {
            System.out.println("📦 [STORAGE] Retrieved saga: " + sagaId);
        } else {
            System.out.println("⚠️ [STORAGE] Saga not found: " + sagaId);
        }
        return message;
    }

    /**
     * 🔹 Check if saga exists in storage
     * @param sagaId Saga identifier
     * @return true if exists, false otherwise
     */
    public boolean exists(String sagaId) {
        IMap<String, BookingMessage> sagaMap = hazelcastInstance.getMap(SAGA_MAP_NAME);
        return sagaMap.containsKey(sagaId);
    }

    /**
     * 🔹 Delete saga from storage
     * @param sagaId Saga identifier
     */
    public void deleteSaga(String sagaId) {
        IMap<String, BookingMessage> sagaMap = hazelcastInstance.getMap(SAGA_MAP_NAME);
        sagaMap.remove(sagaId);
        System.out.println("🗑️ [STORAGE] Deleted saga: " + sagaId);
    }

    /**
     * 🔹 Update full saga object
     * @param bookingMessage Updated BookingMessage object
     */
    public void updateSaga(BookingMessage bookingMessage) {
        if (bookingMessage == null || bookingMessage.getSagaCorrelationId() == null) {
            System.err.println("❌ [STORAGE] Invalid BookingMessage - missing sagaCorrelationId");
            return;
        }

        IMap<String, BookingMessage> sagaMap = hazelcastInstance.getMap(SAGA_MAP_NAME);
        sagaMap.put(bookingMessage.getSagaCorrelationId(), bookingMessage);

        System.out.println("✅ [STORAGE] Updated saga in Hazelcast: " 
            + bookingMessage.getSagaCorrelationId() 
            + " -> status=" + bookingMessage.getStatus());
    }
}
