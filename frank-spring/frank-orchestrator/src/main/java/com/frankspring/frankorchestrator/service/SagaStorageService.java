/**
 * SagaStorageService.java
 * -----------------------
 * Service for managing saga state in Hazelcast
 * 
 * FEATURES:
 * - Create and store saga data
 * - Retrieve saga by ID
 * - Update saga status
 * - Delete saga (cleanup)
 * 
 * NOTES:
 * - Uses Hazelcast distributed map for storage
 * - Designed for two-step Saga pattern with real-time SSE updates
 * 
 * Author: Edoardo Sabatini
 * Date: 03 October 2025
 */

package com.frankstack.frankorchestrator.service;

import com.hazelcast.core.HazelcastInstance;
import com.hazelcast.map.IMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class SagaStorageService {

    @Autowired
    private HazelcastInstance hazelcastInstance;

    private static final String SAGA_MAP_NAME = "sagaStore";

    /**
     * 🔹 Create a new saga and store it in Hazelcast
     * @param bookingContext Initial saga data
     * @return Generated saga ID
     */
    public String createSaga(Map<String, Object> bookingContext) {
        String sagaId = UUID.randomUUID().toString();
        
        IMap<String, Map<String, Object>> sagaMap = hazelcastInstance.getMap(SAGA_MAP_NAME);
        
        Map<String, Object> sagaData = new HashMap<>(bookingContext);
        sagaData.put("sagaId", sagaId);
        sagaData.put("status", "CREATED");
        sagaData.put("createdAt", System.currentTimeMillis());
        
        sagaMap.put(sagaId, sagaData);
        
        System.out.println("💾 [STORAGE] Saga stored in Hazelcast: " + sagaId);
        
        return sagaId;
    }

    /**
     * 🔹 Retrieve saga data from Hazelcast
     * @param sagaId Saga identifier
     * @return Saga data map, or null if not found
     */
    public Map<String, Object> getSaga(String sagaId) {
        IMap<String, Map<String, Object>> sagaMap = hazelcastInstance.getMap(SAGA_MAP_NAME);
        Map<String, Object> saga = sagaMap.get(sagaId);
        
        if (saga != null) {
            System.out.println("📦 [STORAGE] Retrieved saga: " + sagaId);
        } else {
            System.out.println("⚠️ [STORAGE] Saga not found: " + sagaId);
        }
        
        return saga;
    }

    /**
     * 🔹 Check if saga exists in storage
     * @param sagaId Saga identifier
     * @return true if exists, false otherwise
     */
    public boolean exists(String sagaId) {
        IMap<String, Map<String, Object>> sagaMap = hazelcastInstance.getMap(SAGA_MAP_NAME);
        return sagaMap.containsKey(sagaId);
    }

    /**
     * 🔹 Update saga status in Hazelcast
     * @param sagaId Saga identifier
     * @param status New status value
     */
    public void updateSagaStatus(String sagaId, String status) {
        IMap<String, Map<String, Object>> sagaMap = hazelcastInstance.getMap(SAGA_MAP_NAME);
        Map<String, Object> saga = sagaMap.get(sagaId);
        
        if (saga != null) {
            saga.put("status", status);
            saga.put("updatedAt", System.currentTimeMillis());
            sagaMap.put(sagaId, saga);
            
            System.out.println("✅ [STORAGE] Updated saga status: " + sagaId + " -> " + status);
        } else {
            System.err.println("❌ [STORAGE] Cannot update - saga not found: " + sagaId);
        }
    }

    /**
     * 🔹 Delete saga from storage
     * @param sagaId Saga identifier
     */
    public void deleteSaga(String sagaId) {
        IMap<String, Map<String, Object>> sagaMap = hazelcastInstance.getMap(SAGA_MAP_NAME);
        sagaMap.remove(sagaId);
        
        System.out.println("🗑️ [STORAGE] Deleted saga: " + sagaId);
    }
}
