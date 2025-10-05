package com.frankspring.frankorchestrator.service;

/**
 * SseEmitterManagerService.java
 * -----------------------
 * Service to manage SSE emitters for saga orchestration
 * 
 * FEATURES:
 * - Thread-safe emitter storage using ConcurrentHashMap
 * - Automatic cleanup on completion/timeout/error
 * - Error handling for disconnected clients
 * - Explicit removal method
 * 
 * Author: Edoardo Sabatini
 * Date: 05 October 2025
 */

import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SseEmitterManagerService {
    
    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();

    /**
     * Registers an SSE emitter for a specific saga ID
     * @param sagaId Unique saga identifier
     * @param emitter SSE emitter instance
     */
    public void addEmitter(String sagaId, SseEmitter emitter) {
        System.out.println("📡 [SSE-MANAGER] Registering emitter for saga: " + sagaId);
        emitters.put(sagaId, emitter);
        
        // Automatic cleanup on completion
        emitter.onCompletion(() -> {
            System.out.println("✅ [SSE-MANAGER] Emitter completed for saga: " + sagaId);
            removeEmitter(sagaId);
        });
        
        // Automatic cleanup on timeout
        emitter.onTimeout(() -> {
            System.out.println("⏱️ [SSE-MANAGER] Emitter timeout for saga: " + sagaId);
            if (emitters.containsKey(sagaId)) { 
                emitter.complete();
            }
            removeEmitter(sagaId);
        });
        
        // Automatic cleanup on error
        emitter.onError((ex) -> {
            System.err.println("❌ [SSE-MANAGER] Emitter error for saga: " + sagaId + " - " + ex.getMessage());
            removeEmitter(sagaId);
        });
    }

    /**
     * Removes an SSE emitter from the active map
     * @param sagaId Unique saga identifier
     */
    public void removeEmitter(String sagaId) {
        SseEmitter removedEmitter = emitters.remove(sagaId);
        if (removedEmitter != null) {
            System.out.println("🧹 [SSE-MANAGER] Successfully removed emitter for saga: " + sagaId);
        } else {
            System.out.println("⚠️ [SSE-MANAGER] Emitter not found or already removed for saga: " + sagaId);
        }
    }

    /**
     * Emits data to the SSE client for a specific saga
     * @param sagaId Unique saga identifier
     * @param data Data to send to client
     */
    public void emit(String sagaId, Object data) {
        SseEmitter emitter = emitters.get(sagaId);
        
        if (emitter != null) {
            try {
                System.out.println("📤 [SSE-MANAGER] Sending data for saga: " + sagaId);
                System.out.println("📦 [SSE-MANAGER] Data: " + data);
                
                emitter.send(SseEmitter.event().data(data).build());
                
                System.out.println("✔️ [SSE-MANAGER] Data sent successfully for saga: " + sagaId);
                
            } catch (IOException e) {
                System.err.println("💥 [SSE-MANAGER] I/O error (Client disconnected?) for saga: " + sagaId + " - " + e.getMessage());
                emitter.completeWithError(e);
                removeEmitter(sagaId);
            }
        } else {
            System.err.println("⚠️ [SSE-MANAGER] No emitter found for saga: " + sagaId);
        }
    }

    /**
     * Completes the SSE stream for a specific saga
     * @param sagaId Unique saga identifier
     */
    public void complete(String sagaId) {
        SseEmitter emitter = emitters.get(sagaId);
        
        if (emitter != null) {
            System.out.println("🏁 [SSE-MANAGER] Completing emitter for saga: " + sagaId);
            emitter.complete();
            removeEmitter(sagaId); 
        }
    }

    /**
     * Checks if an emitter exists for a saga
     * @param sagaId Unique saga identifier
     * @return true if emitter exists, false otherwise
     */
    public boolean hasEmitter(String sagaId) {
        return emitters.containsKey(sagaId);
    }

    /**
     * Gets the count of active emitters
     * @return Number of active emitters
     */
    public int getActiveEmittersCount() {
        return emitters.size();
    }
}
