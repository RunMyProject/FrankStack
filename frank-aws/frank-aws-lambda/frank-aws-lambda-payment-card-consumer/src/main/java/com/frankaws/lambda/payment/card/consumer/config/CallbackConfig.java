package com.frankaws.lambda.payment.card.consumer.config;

// CallbackConfig.java

/* 
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "callback")

*/
public class CallbackConfig {

    /**
     * Orchestrator callback URL injected from application.yml
     */
    private String orchestratorUrl;

    public String getOrchestratorUrl() {
        return orchestratorUrl;
    }

    public void setOrchestratorUrl(String orchestratorUrl) {
        this.orchestratorUrl = orchestratorUrl;
    }
}
