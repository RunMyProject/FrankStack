package com.frankspring.frankorchestrator.controller;

/**
 * FrankCallbackController.java
 * -----------------------
 * Webhook endpoint invoked by PaymentCardLambda (Consumer)
 * as part of the SAGA orchestration flow.
 *
 * Author: Edoardo Sabatini
 * Date: 17 October 2025
 */

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import com.frankspring.frankorchestrator.component.AppPropertiesComponent;

import com.frankspring.frankorchestrator.service.SagaStorageService;
import com.frankspring.frankorchestrator.service.SseEmitterManagerService;

@RestController
@RequestMapping("/frankcallback")
public class FrankCallbackController {

    @Autowired
    private AppPropertiesComponent appPropertiesComponent;

    @Autowired
    private SagaStorageService sagaStorage;

    @Autowired
    private SseEmitterManagerService sseEmitterManager;

    /**
     * Endpoint called by PaymentCardLambda when card payment is completed.
     * Emits SSE to React client. Does NOT close or delete saga.
     */
    @PostMapping("/card-payment-complete")
    public Map<String, Object> cardPaymentComplete(@RequestBody Map<String, Object> payload) {

        // 1️⃣ Print received payload for debugging
        System.out.println("==================================================");
        System.out.println("📬 [FrankOrchestrator - PaymentCardLambda] CALLBACK RECEIVED");
        System.out.println("📦 Payload Keys: " + payload.keySet());
        System.out.println("🧾 Payload Content: " + payload);

        String sagaCorrelationId = (String) payload.get("sagaCorrelationId");
        System.out.println("🆔 [DEBUG] sagaCorrelationId: " + sagaCorrelationId);

        // 2️⃣ Prepare SSE emit payload
        Map<String, Object> emitPayload = new HashMap<>();
        emitPayload.put("status", "PAYMENT_CONFIRMED");
        emitPayload.put("emissionClosed", false); // do NOT close yet

        // NB:
        // Mocked S3 URL for invoice (LocalStack)
        // In real AWS environment, this would be https://<bucket>.s3.<region>.amazonaws.com/<key>.pdf
        //
        String invoiceKey = "invoices/" + sagaCorrelationId + ".pdf";
        
        // NB:
        // next step: map this to application.yml
        //
        String invoiceUrl = "http://localhost:4566/my-bucket/" + invoiceKey;

        emitPayload.put("invoiceUrl", invoiceUrl);        
        emitPayload.put("message", "Payment completed successfully");
        emitPayload.put("sagaCorrelationId", sagaCorrelationId);
        emitPayload.put("timestamp", Instant.now().toString());

        // 3️⃣ Notify SSE client
        sseEmitterManager.emit(sagaCorrelationId, emitPayload);

        // 4️⃣ Return simple acknowledgment to Lambda
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Card payment processed and SSE emitted");
        response.put("timestamp", Instant.now().toString());
        response.put("sagaCorrelationId", sagaCorrelationId);

        return response;
    }

    /**
     * Endpoint called by React client to confirm reception of payment SSE.
     * This will close the SSE and delete the saga from Hazelcast.
     */
    @PostMapping("/closeSaga")
    public Map<String, Object> closeSaga(@RequestParam String sagaCorrelationId) {
        System.out.println("🔒 [closeSaga] Closing saga: " + sagaCorrelationId);

        // 1️⃣ Complete SSE and remove emitter
        sseEmitterManager.complete(sagaCorrelationId);

        // 2️⃣ Delete saga from storage
        sagaStorage.deleteSaga(sagaCorrelationId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Saga closed and deleted successfully");
        response.put("timestamp", Instant.now().toString());
        response.put("sagaCorrelationId", sagaCorrelationId);

        return response;
    }
}
