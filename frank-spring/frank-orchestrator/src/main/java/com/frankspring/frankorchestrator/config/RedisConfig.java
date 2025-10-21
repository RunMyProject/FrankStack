package com.frankspring.frankorchestrator.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer; // Changed from GenericJackson2JsonRedisSerializer
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

/**
 * RedisConfig.java
 * -----------------------
 * Redis in-memory configuration using Lettuce.
 * Sets up proper serializers for keys and values, including complex JSON objects.
 *
 * FIX: Configures Jackson2JsonRedisSerializer with Type Hinting to prevent ClassCastException
 * when deserializing objects from Redis (LinkedHashMap -> BookingMessage).
 * Also registers JavaTimeModule for java.time.Instant support.
 *
 * Author: Edoardo Sabatini
 * Date: 21 October 2025 (Updated 22 October 2025 for Type Hinting fix)
 */

@Configuration
public class RedisConfig {

    /**
     * Redis connection bean.
     * Uses the Docker container name defined in docker-compose.yml.
     * Default Redis port: 6379
     */
    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        return new LettuceConnectionFactory("frankstack-redis", 6379);
    }

    /**
     * Custom RedisTemplate bean.
     * Configures serializers to ensure proper serialization and deserialization
     * of complex objects using Jackson Type Hinting.
     */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        
        // 1. Create a custom ObjectMapper
        ObjectMapper objectMapper = new ObjectMapper();
        
        // 2. Register the module for Java 8 Time types (Instant, LocalDate, etc.)
        objectMapper.registerModule(new JavaTimeModule());

        // 3. CRUCIAL FIX: Enable Type Hinting
        // This embeds the Java class name (e.g., com.frankspring.frankorchestrator.models.BookingMessage)
        // into the JSON, allowing Jackson to deserialize it back to the correct object 
        // instead of a generic LinkedHashMap.
        objectMapper.activateDefaultTyping(
            objectMapper.getPolymorphicTypeValidator(), 
            ObjectMapper.DefaultTyping.NON_FINAL
        );
        
        // 4. Create the Jackson Serializer using the configured ObjectMapper
        // Use Object.class to handle any type stored as a value
        Jackson2JsonRedisSerializer<Object> jacksonSerializer = new Jackson2JsonRedisSerializer<>(Object.class);
        jacksonSerializer.setObjectMapper(objectMapper);


        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        // Serializers for keys
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());

        // Serializers for values (USING THE TYPE-HINTED SERIALIZER)
        template.setValueSerializer(jacksonSerializer);
        template.setHashValueSerializer(jacksonSerializer);

        template.afterPropertiesSet();
        return template;
    }
}
