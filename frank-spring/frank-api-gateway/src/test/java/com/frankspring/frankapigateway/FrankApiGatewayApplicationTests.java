/**
 * FrankApiGatewayApplicationTests.java
 * -----------------------
 * Minimal Spring Boot test configuration for Frank-API-Gateway microservice
 *
 * NOTES:
 * - Uses @SpringBootTest to start the application context for integration testing
 * - Contains a simple smoke test to verify the context loads without errors
 *
 * Author: Edoardo Sabatini
 * Date: 30 September 2025
 */

package com.frankspring.frankapigateway;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class FrankApiGatewayApplicationTests {

    /**
     * Smoke test: verifies that the Spring application context loads successfully.
     */
    @Test
    void contextLoads() {
        // This test passes if the application context starts without exceptions
    }
}
