/**
 * HazelcastConfig.java
 * Hazelcast In-Memory Configuration
 * -----------------------
 * Configures embedded Hazelcast for distributed in-memory storage
 * without requiring external Redis or database.
 * 
 * Features:
 * - Embedded Hazelcast instance (no external server needed)
 * - Automatic TTL for saga contexts (1 hour expiration)
 * - Thread-safe distributed map for saga storage
 * - Perfect for development and single-instance production
 * 
 * Author: Edoardo Sabatini
 * Date: 30 September 2025
 */

package com.frankstack.frankorchestrator.config;

import com.hazelcast.config.Config;
import com.hazelcast.config.MapConfig;
import com.hazelcast.core.Hazelcast;
import com.hazelcast.core.HazelcastInstance;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class HazelcastConfig {

    /**
     * Creates Hazelcast configuration with TTL for saga storage
     */
    @Bean
    public Config hazelcastConfiguration() {
        Config config = new Config();
        config.setClusterName("saga-orchestrator-cluster");
        
        // 🗺️ MAP CONFIG: Saga storage with 1-hour TTL
        MapConfig sagaMapConfig = new MapConfig();
        sagaMapConfig.setName("saga-contexts");
        sagaMapConfig.setTimeToLiveSeconds(3600); // 1 hour TTL
        
        config.addMapConfig(sagaMapConfig);
        
        System.out.println("✅ [HAZELCAST] Configuration created with TTL=1h");
        return config;
    }

    /**
     * Creates embedded Hazelcast instance
     */
    @Bean
    public HazelcastInstance hazelcastInstance(Config config) {
        HazelcastInstance instance = Hazelcast.newHazelcastInstance(config);
        System.out.println("🚀 [HAZELCAST] Embedded instance started successfully!");
        return instance;
    }
}
