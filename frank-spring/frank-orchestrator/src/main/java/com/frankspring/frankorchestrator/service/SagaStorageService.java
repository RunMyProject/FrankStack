package com.frankspring.frankorchestrator.service;

/**
 * SagaStorageService.java
 * -----------------------
 *
 * Author: Edoardo Sabatini
 * Date: 21 October 2025
 */
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.UUID;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.connection.RedisConnectionFactory;

import com.frankspring.frankorchestrator.models.BookingMessage;
import com.frankspring.frankorchestrator.models.BookingContext;
import com.frankspring.frankorchestrator.models.SagaStatus;

@Service
public class SagaStorageService {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    private static final String SAGA_KEY_PREFIX = "saga:";

    public BookingMessage createSaga(BookingContext bookingContext) {
        String sagaId = UUID.randomUUID().toString();
        BookingMessage message = BookingMessage.builder()
                .sagaCorrelationId(sagaId)
                .bookingContext(bookingContext)
                .status(SagaStatus.CREATED)
                .build();

        redisTemplate.opsForValue().set(SAGA_KEY_PREFIX + sagaId, message);
        System.out.println("💾 [STORAGE] Saga stored in Redis: " + sagaId);
        return message;
    }

    // This is the line that was failing due to missing Type Hinting in RedisConfig.
    // The cast will now succeed thanks to the configured serializer.
    public BookingMessage getSaga(String sagaId) { 
        BookingMessage message = (BookingMessage) redisTemplate.opsForValue().get(SAGA_KEY_PREFIX + sagaId);
        if (message == null) {
            System.out.println("⚠️ [STORAGE] Saga not found in Redis: " + sagaId);
        }
        return message;
    }

    public void updateSaga(BookingMessage bookingMessage) {
        if (bookingMessage == null || bookingMessage.getSagaCorrelationId() == null) return;
        redisTemplate.opsForValue().set(SAGA_KEY_PREFIX + bookingMessage.getSagaCorrelationId(), bookingMessage);
        System.out.println("✅ [STORAGE] Updated saga in Redis: " + bookingMessage.getSagaCorrelationId());
    }

    public void deleteSaga(String sagaId) {
        redisTemplate.delete(SAGA_KEY_PREFIX + sagaId);
        System.out.println("🗑️ [STORAGE] Deleted saga: " + sagaId);
    }

    public boolean exists(String sagaId) {
        return redisTemplate.hasKey(SAGA_KEY_PREFIX + sagaId);
    }
}