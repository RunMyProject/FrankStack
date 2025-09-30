/**
 * SagaStorageService.java
 * Saga Context Storage with Hazelcast
 * -----------------------
 * Manages saga context storage in Hazelcast distributed map.
 * Provides CRUD operations for booking contexts with automatic TTL.
 * 
 * Features:
 * - Store/Retrieve saga contexts by ID
 * - Automatic expiration after 1 hour (configured in HazelcastConfig)
 * - Thread-safe operations
 * - JSON-friendly Map storage
 * 
 * Author: Edoardo Sabatini
 * Date: 30 September 2025
 */

package com.frankstack.frankorchestrator.service;

import com.hazelcast.core.HazelcastInstance;
import com.hazelcast.map.IMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
public class SagaStorageService {

    private final HazelcastInstance hazelcastInstance;

    @Autowired
    public SagaStorageService(HazelcastInstance hazelcastInstance) {
        this.hazelcastInstance = hazelcastInstance;
        System.out.println("✅ [SAGA STORAGE] Service initialized with Hazelcast");
    }

    /**
     * Creates a new saga context and returns unique ID
     * 
     * @param bookingContext JSON map containing booking data
     * @return Unique saga ID
     */
    public String createSaga(Map<String, Object> bookingContext) {
        String sagaId = UUID.randomUUID().toString();
        
        IMap<String, Map<String, Object>> sagaMap = hazelcastInstance.getMap("saga-contexts");
        sagaMap.put(sagaId, bookingContext);
        
        System.out.println("💾 [SAGA STORAGE] Created saga with ID: " + sagaId);
        System.out.println("📦 [SAGA STORAGE] Stored context: " + bookingContext);
        
        return sagaId;
    }

    /**
     * Retrieves saga context by ID
     * 
     * @param sagaId Unique saga identifier
     * @return Booking context map or null if not found
     */
    public Map<String, Object> getSaga(String sagaId) {
        IMap<String, Map<String, Object>> sagaMap = hazelcastInstance.getMap("saga-contexts");
        Map<String, Object> context = sagaMap.get(sagaId);
        
        if (context != null) {
            System.out.println("✅ [SAGA STORAGE] Retrieved saga: " + sagaId);
            System.out.println("📦 [SAGA STORAGE] Context: " + context);
        } else {
            System.out.println("⚠️ [SAGA STORAGE] Saga not found: " + sagaId);
        }
        
        return context;
    }

    /**
     * Deletes saga context after completion
     * 
     * @param sagaId Unique saga identifier
     */
    public void deleteSaga(String sagaId) {
        IMap<String, Map<String, Object>> sagaMap = hazelcastInstance.getMap("saga-contexts");
        sagaMap.remove(sagaId);
        System.out.println("🗑️ [SAGA STORAGE] Deleted saga: " + sagaId);
    }

    /**
     * Checks if saga exists
     * 
     * @param sagaId Unique saga identifier
     * @return true if saga exists, false otherwise
     */
    public boolean exists(String sagaId) {
        IMap<String, Map<String, Object>> sagaMap = hazelcastInstance.getMap("saga-contexts");
        return sagaMap.containsKey(sagaId);
    }
}
