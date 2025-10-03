/**
 * AppPropertiesComponent.java
 * -----------------------
 * Component to store application-level properties
 * 
 * NOTES:
 * - Holds configuration values injected from application.yml or environment
 * - Currently provides the port of the external Kafka Producer service
 *
 * Author: Edoardo Sabatini
 * Date: 03 October 2025
 */

package com.frankstack.frankorchestrator.component;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AppPropertiesComponent {

    // 🌐 Port where the external Kafka Producer service is running
    @Value("${external.kafka-producer-port}")
    private int kafkaProducerPort;

    /**
     * 🔑 Getter for Kafka Producer port
     * @return port number of external Kafka Producer
     */
    public int getKafkaProducerPort() {
        return kafkaProducerPort;
    }
}
