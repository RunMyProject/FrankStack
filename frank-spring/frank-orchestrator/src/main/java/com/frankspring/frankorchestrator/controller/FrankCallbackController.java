package com.frankstack.frankorchestrator.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * FrankCallbackController.java
 *
 * Webhook endpoint invoked by AWS Lambda (PaymentCardConsumerLambda)
 * as part of the SAGA orchestration flow.
 *
 * Author: Edoardo Sabatini
 * Date: 16 October 2025
 */

 /* 
@RestController
@RequestMapping("/frankcallback")
public class FrankCallbackController {

    @PostMapping("/card-payment-complete")
    public ResponseEntity<Map<String, Object>> cardPaymentComplete(@RequestBody Map<String, Object> requestBody) {

        System.out.println("==================================================");
        System.out.println("📬 [FrankOrchestrator] CALLBACK RECEIVED");
        System.out.println("--------------------------------------------------");
        System.out.println("🕒 Timestamp: " + LocalDateTime.now());
        System.out.println("📦 Payload Keys: " + requestBody.keySet());
        System.out.println("🧾 Payload Content: " + requestBody);
        System.out.println("==================================================");

        // Create response payload for Lambda acknowledgment
        Map<String, Object> response = new HashMap<>();
        response.put("status", "received");
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("message", "Frank Orchestrator callback received successfully");
        response.put("receivedKeys", requestBody.keySet());

        // Return 200 OK so that Lambda marks the callback as SUCCESS
        return ResponseEntity.ok(response);
    }
*/
@RestController
@RequestMapping("/frankcallback")
public class FrankCallbackController {

    @PostMapping("/card-payment-complete")
    public Map<String, Object> cardPaymentComplete(@RequestBody Map<String, Object> payload) {
        System.out.println("Received card-payment-complete payload: " + payload);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Card payment processed successfully");
        response.put("timestamp", Instant.now().toString());

        return response;
    }
}
