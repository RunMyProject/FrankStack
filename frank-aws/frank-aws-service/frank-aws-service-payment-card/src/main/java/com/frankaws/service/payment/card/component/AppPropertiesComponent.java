package com.frankaws.service.payment.card.component;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * AppPropertiesComponent.java
 * ------------------------------------------------------------
 * Centralized component for managing AWS Lambda configuration values.
 *
 * PURPOSE:
 * • Reads LocalStack endpoint and AWS region from application.yml
 * • Provides getter methods for AWS Lambda configuration
 *
 * USAGE:
 * • Injected into LambdaInvokerService or Controller
 *
 * Author: Edoardo Sabatini
 * Date: 23 October 2025
 * ------------------------------------------------------------
 */

@Component
public class AppPropertiesComponent {

    // 🌐 LocalStack endpoint and AWS region (read from application.yml)
    @Value("${aws.endpoint}")
    private String localstackEndpoint;

    @Value("${aws.lambda-name}")
    private String lambdaName;

    @Value("${aws.region}")
    private String awsRegion;

    // 🔗 Returns the LocalStack endpoint
    public String getLocalstackEndpoint() {
        return localstackEndpoint;
    }

    // 🌍 Returns the configured AWS region
    public String getAwsRegion() {
        return awsRegion;
    }

    // 🟢 Returns the Lambda function name
    public String getLambdaName() {
        return lambdaName;
    }
}
