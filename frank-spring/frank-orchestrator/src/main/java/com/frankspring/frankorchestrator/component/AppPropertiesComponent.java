package com.frankspring.frankorchestrator.component;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * AppPropertiesComponent.java
 * -----------------------
 * Centralized component to store application-level configuration values.
 *
 * Author: Edoardo Sabatini
 * Date: 23 October 2025
 */

@Component
public class AppPropertiesComponent {

    // 🌐 Travel Producer hostname + port
    @Value("${external.frankstack-kafka-travel-producer-host}")
    private String kafkaTravelProducerHost;
    @Value("${external.frankstack-kafka-producer-port-travel}")
    private int kafkaTravelProducerPort;

    // 🌐 Hotel Producer hostname + port
    @Value("${external.frankstack-kafka-hotel-producer-host}")
    private String kafkaHotelProducerHost;
    @Value("${external.frankstack-kafka-producer-port-hotel}")
    private int kafkaHotelProducerPort;

    /**
     * 🔗 Build the base URL for the Kafka Travel Producer
     * @return complete HTTP URL to the Travel Producer service
     */
    public String getKafkaTravelProducerUrl() {
        return "http://" + kafkaTravelProducerHost + ":" + kafkaTravelProducerPort + "/kafka";
    }

    /**
     * 🔗 Build the base URL for the Kafka Hotel Producer
     * @return complete HTTP URL to the Hotel Producer service
     */
    public String getKafkaHotelProducerUrl() {
        return "http://" + kafkaHotelProducerHost + ":" + kafkaHotelProducerPort + "/kafka";
    }

    @Value("${external.aws-payment-service-url}")
    private String awsPaymentServiceUrl;

    public String getAwsPaymentServiceUrl() {
        return awsPaymentServiceUrl;
    }

}
