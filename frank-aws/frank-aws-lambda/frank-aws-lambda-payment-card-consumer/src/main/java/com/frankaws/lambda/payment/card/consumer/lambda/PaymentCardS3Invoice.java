package com.frankaws.lambda.payment.card.consumer.lambda;

/**
 * PaymentCardS3Invoice
 * ----------------------------------------
 * Handles S3 invoice file generation and storage for payment card processing.
 * 
 * This class generates invoice files in both text and JSON formats, stores them
 * in Amazon S3 (or LocalStack), and returns the public URL for accessing the files.
 * 
 * *************************************************************************
 *
 * Author: Edoardo Sabatini
 * Date: 03 November 2025
 */

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.amazonaws.services.s3.model.AmazonS3Exception;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class PaymentCardS3Invoice {

    // Configuration from environment variables
    private static final String S3_BUCKET_NAME = System.getenv("S3_BUCKET_NAME") != null ? System.getenv("S3_BUCKET_NAME") : "frank-aws-invoices";
    private static final String AWS_REGION = System.getenv("AWS_REGION") != null ? System.getenv("AWS_REGION") : "eu-central-1";
    private static final String S3_ENDPOINT = System.getenv("S3_ENDPOINT_URL") != null ? System.getenv("S3_ENDPOINT_URL") : "http://127.0.0.1:4566";
    
    // Invoice configuration
    private static final String INVOICE_PREFIX = "invoices";
    private static final String INVOICE_TEXT_FILENAME = "invoice.pdf";
    private static final String INVOICE_JSON_FILENAME = "invoice.json";
    
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private final AmazonS3 s3Client;
    
    // Flag to track bucket initialization
    private boolean bucketInitialized = false;

    public PaymentCardS3Invoice() {
        
        System.out.println("🔧 Initializing PaymentCardS3Invoice...");
        System.out.println("📦 S3_BUCKET_NAME: " + S3_BUCKET_NAME);
        System.out.println("🌐 S3_ENDPOINT: " + S3_ENDPOINT);
        System.out.println("🗺️ AWS_REGION: " + AWS_REGION);

        // Configure S3 client (works with both AWS and LocalStack)
        if (S3_ENDPOINT != null && !S3_ENDPOINT.trim().isEmpty()) {
            // LocalStack configuration
            this.s3Client = AmazonS3ClientBuilder.standard()
                .withEndpointConfiguration(
                    new com.amazonaws.client.builder.AwsClientBuilder.EndpointConfiguration(
                        S3_ENDPOINT, AWS_REGION))
                .withPathStyleAccessEnabled(true)
                .build();
        } else {
            // AWS production configuration
            this.s3Client = AmazonS3ClientBuilder.defaultClient();
        }
    }

    /**
     * Generates invoice files in S3 and returns the public URL.
     * 
     * @param jsonMessage The raw JSON message from SNS containing payment data
     * @return Public URL of the generated invoice file, or null if generation fails
     */
    public String generate(String jsonMessage) {
          
         System.out.println("🔧 S3 Invoice Generator STARTED");
        try {
            System.out.println("📦 S3_BUCKET_NAME: " + S3_BUCKET_NAME);
            System.out.println("🌐 S3_ENDPOINT: " + S3_ENDPOINT);
            System.out.println("🗺️ AWS_REGION: " + AWS_REGION);
            
            // Parse JSON message to extract relevant data
            System.out.println("📄 Parsing JSON message...");
            JsonNode messageNode = objectMapper.readTree(jsonMessage);
            System.out.println("✅ JSON parsed successfully");
            
            // Extract saga correlation ID for folder structure
            System.out.println("🔍 Extracting saga correlation ID...");
            String sagaCorrelationId = extractSagaCorrelationId(messageNode);
            System.out.println("📋 Saga ID: " + sagaCorrelationId);
            
            if (sagaCorrelationId == null) {
                throw new IllegalArgumentException("Saga correlation ID not found in message");
            }
            
            // Ensure S3 bucket exists
            System.out.println("🪣 Ensuring S3 bucket exists...");
            ensureBucketExists();
            System.out.println("✅ Bucket check completed");
            
            // Upload PDF invoice (NEW!)
            System.out.println("⬆️ Uploading PDF invoice to S3...");
            String pdfFileKey = uploadPdfInvoice(messageNode, sagaCorrelationId);
            System.out.println("✅ PDF uploaded to S3");
            
            // Upload JSON invoice (backup)
            String jsonInvoiceContent = generateJsonInvoiceContent(messageNode, sagaCorrelationId);
            String jsonFileKey = uploadJsonInvoice(jsonInvoiceContent, sagaCorrelationId);
            System.out.println("✅ JSON backup uploaded to S3");
            
            // Generate and return public URL for PDF
            System.out.println("🔗 Generating public URL...");
            String publicUrl = generatePublicUrl(pdfFileKey);
            System.out.println("✅ Invoice generated successfully: " + publicUrl);
                        
            return publicUrl;
            
        } catch (Exception e) {
            System.err.println("❌ Error generating invoice: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    /**
     * Ensures the S3 bucket exists, creates it if necessary.
     */
    private void ensureBucketExists() {
        if (bucketInitialized) {
            return;
        }
        
        if (S3_BUCKET_NAME == null || S3_BUCKET_NAME.trim().isEmpty()) {
            throw new IllegalStateException("S3_BUCKET_NAME environment variable is not configured");
        }
        
        try {
            if (s3Client.doesBucketExistV2(S3_BUCKET_NAME)) {
                System.out.println("✅ S3 Bucket already exists: " + S3_BUCKET_NAME);
            } else {
                System.out.println("🔄 Creating S3 bucket: " + S3_BUCKET_NAME);
                
                // Crea il bucket specificando la regione
                s3Client.createBucket(S3_BUCKET_NAME, AWS_REGION);
                
                // Wait for bucket to be ready
                waitForBucketCreation();
                System.out.println("✅ S3 Bucket created successfully: " + S3_BUCKET_NAME);
            }
            bucketInitialized = true;
            
        } catch (AmazonS3Exception e) {
            if (e.getErrorCode().equals("BucketAlreadyExists")) {
                System.out.println("ℹ️ Bucket already exists (different region): " + S3_BUCKET_NAME);
                bucketInitialized = true;
            } else {
                throw new RuntimeException("Failed to create S3 bucket: " + e.getMessage(), e);
            }
        } catch (Exception e) {
            throw new RuntimeException("S3 bucket operation failed: " + e.getMessage(), e);
        }
    }

    /**
     * Waits for bucket creation to complete.
     */
    private void waitForBucketCreation() {
        int maxAttempts = 10;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                Thread.sleep(1000);
                if (s3Client.doesBucketExistV2(S3_BUCKET_NAME)) {
                    System.out.println("✅ Bucket is now available: " + S3_BUCKET_NAME);
                    return;
                }
                System.out.println("🔄 Waiting for bucket creation... attempt " + attempt);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new RuntimeException("Interrupted while waiting for bucket creation", e);
            }
        }
        throw new RuntimeException("Bucket creation timeout");
    }

    /**
     * Extracts saga correlation ID from JSON message.
     */
    private String extractSagaCorrelationId(JsonNode messageNode) {
        // Try different possible field names for correlation ID
        if (messageNode.has("sagaCorrelationId")) {
            return messageNode.get("sagaCorrelationId").asText();
        } else if (messageNode.has("correlationId")) {
            return messageNode.get("correlationId").asText();
        } else if (messageNode.has("id")) {
            return messageNode.get("id").asText();
        }
        return null;
    }

    /**
     * Generates human-readable invoice content.
     */
    private String generateInvoiceContent(JsonNode messageNode, String sagaCorrelationId) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        String timestamp = LocalDateTime.now().format(formatter);
        
        StringBuilder invoice = new StringBuilder();
        invoice.append("=== PAYMENT INVOICE ===\n");
        invoice.append("Saga ID: ").append(sagaCorrelationId).append("\n");
        invoice.append("Generated: ").append(timestamp).append("\n");
        invoice.append("-----------------------\n");
        
        // Extract payment details
        if (messageNode.has("context")) {
            JsonNode context = messageNode.get("context");
            if (context.has("total")) {
                invoice.append("Total Amount: ").append(context.get("total").asText()).append("\n");
            }
            if (context.has("currency")) {
                invoice.append("Currency: ").append(context.get("currency").asText()).append("\n");
            }
        }
        
        if (messageNode.has("status")) {
            invoice.append("Status: ").append(messageNode.get("status").asText()).append("\n");
        }
        
        invoice.append("-----------------------\n");
        invoice.append("Thank you for your payment!\n");
        invoice.append("========================\n");
        
        return invoice.toString();
    }

    /**
     * Generates structured JSON invoice content.
     */
    private String generateJsonInvoiceContent(JsonNode messageNode, String sagaCorrelationId) {
        try {
            JsonNode invoiceJson = objectMapper.createObjectNode()
                .put("invoiceType", "PAYMENT_CARD")
                .put("sagaCorrelationId", sagaCorrelationId)
                .put("generatedAt", LocalDateTime.now().toString())
                .set("paymentDetails", messageNode);
            
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(invoiceJson);
        } catch (Exception e) {
            throw new RuntimeException("Error generating JSON invoice: " + e.getMessage(), e);
        }
    }

    /**
     * Uploads text invoice to S3.
     */
    private String uploadTextInvoice(String content, String sagaCorrelationId) {
        String s3Key = String.format("%s/%s/%s", INVOICE_PREFIX, sagaCorrelationId, INVOICE_TEXT_FILENAME);
        
        try (InputStream inputStream = new ByteArrayInputStream(content.getBytes("UTF-8"))) {
            PutObjectRequest putRequest = new PutObjectRequest(S3_BUCKET_NAME, s3Key, inputStream, null);
            s3Client.putObject(putRequest);
            System.out.println("✅ Text invoice uploaded: " + s3Key);
            return s3Key;
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload text invoice: " + e.getMessage(), e);
        }
    }

    /**
     * Uploads JSON invoice to S3.
     */
    private String uploadJsonInvoice(String content, String sagaCorrelationId) {
        String s3Key = String.format("%s/%s/%s", INVOICE_PREFIX, sagaCorrelationId, INVOICE_JSON_FILENAME);
        
        try (InputStream inputStream = new ByteArrayInputStream(content.getBytes("UTF-8"))) {
            PutObjectRequest putRequest = new PutObjectRequest(S3_BUCKET_NAME, s3Key, inputStream, null);
            s3Client.putObject(putRequest);
            System.out.println("✅ JSON invoice uploaded: " + s3Key);
            return s3Key;
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload JSON invoice: " + e.getMessage(), e);
        }
    }

    /**
     * Generates public URL for the uploaded invoice.
     */
    private String generatePublicUrl(String s3Key) {
        if (S3_ENDPOINT != null && !S3_ENDPOINT.trim().isEmpty()) {
            // LocalStack URL format
            return String.format("%s/%s/%s", S3_ENDPOINT, S3_BUCKET_NAME, s3Key);
        } else {
            // AWS S3 public URL format
            return String.format("https://%s.s3.amazonaws.com/%s", S3_BUCKET_NAME, s3Key);
        }
    }

    /**
     * Uploads PDF invoice to S3 (generated from InvoiceData).
     */
    private String uploadPdfInvoice(JsonNode messageNode, String sagaCorrelationId) {
        String s3Key = String.format("%s/%s/%s", INVOICE_PREFIX, sagaCorrelationId, INVOICE_TEXT_FILENAME);
        
        try {
            System.out.println("🎨 Creating PDF invoice data...");
            
            // Create InvoiceData object
            InvoiceData invoiceData = new InvoiceData(sagaCorrelationId, extractInvoiceNumber(messageNode));
            
            // Extract data from JSON
            if (messageNode.has("context")) {
                JsonNode context = messageNode.get("context");
                
                if (context.has("total")) {
                    invoiceData.setTotalAmount(new BigDecimal(context.get("total").asText()));
                }
                if (context.has("currency")) {
                    invoiceData.setCurrency(context.get("currency").asText());
                }
                if (context.has("cardHolder")) {
                    invoiceData.setCardHolder(context.get("cardHolder").asText());
                }
                if (context.has("travelId")) {
                    invoiceData.setTravelId(context.get("travelId").asText());
                }
                if (context.has("hotelId")) {
                    invoiceData.setHotelId(context.get("hotelId").asText());
                }
            }
            
            if (messageNode.has("status")) {
                invoiceData.setStatus(messageNode.get("status").asText());
            }
            
            System.out.println("🎨 Generating PDF with boarding pass style...");
            
            // Generate PDF
            PaymentInvoicePdfGenerator pdfGenerator = new PaymentInvoicePdfGenerator();
            byte[] pdfBytes = pdfGenerator.generateInvoicePdf(invoiceData);
            
            System.out.println("📄 PDF generated, size: " + pdfBytes.length + " bytes");
            
            // Upload to S3
            try (InputStream inputStream = new ByteArrayInputStream(pdfBytes)) {
                PutObjectRequest putRequest = new PutObjectRequest(S3_BUCKET_NAME, s3Key, inputStream, null);
                s3Client.putObject(putRequest);
                System.out.println("✅ PDF invoice uploaded: " + s3Key);
                return s3Key;
            }
            
        } catch (Exception e) {
            System.err.println("❌ Failed to upload PDF invoice: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to upload PDF invoice: " + e.getMessage(), e);
        }
    }

    /**
     * Extracts invoice number from JSON message.
     */
    private String extractInvoiceNumber(JsonNode messageNode) {
        if (messageNode.has("context")) {
            JsonNode context = messageNode.get("context");
            if (context.has("invoiceNumber")) {
                return context.get("invoiceNumber").asText();
            }
        }
        return null;
    }
}