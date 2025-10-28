package com.frankaws.lambda.payment.card.consumer.lambda;

/**
 * PaymentInvoicePdfGenerator
 * ----------------------------------------
 * Generates beautiful PDF invoices in boarding pass style.
 * Uses iText 7 library for PDF generation.
 * 
 * Author: Edoardo Sabatini
 * Date: 28 October 2025
 */

import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.borders.Border;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Data class holding all invoice information
 */
class InvoiceData {
    private String sagaCorrelationId;
    private String invoiceNumber;
    private LocalDateTime timestamp;
    private BigDecimal totalAmount;
    private String currency;
    private String cardHolder;
    private String status;
    private String travelId;
    private String hotelId;
    
    public InvoiceData(String sagaCorrelationId, String invoiceNumber) {
        this.sagaCorrelationId = sagaCorrelationId;
        this.invoiceNumber = invoiceNumber;
        this.timestamp = LocalDateTime.now();
        this.status = "PAID";
    }
    
    // Getters and Setters
    public String getSagaCorrelationId() { return sagaCorrelationId; }
    public void setSagaCorrelationId(String sagaCorrelationId) { this.sagaCorrelationId = sagaCorrelationId; }
    
    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }
    
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    
    public String getCardHolder() { return cardHolder; }
    public void setCardHolder(String cardHolder) { this.cardHolder = cardHolder; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getTravelId() { return travelId; }
    public void setTravelId(String travelId) { this.travelId = travelId; }
    
    public String getHotelId() { return hotelId; }
    public void setHotelId(String hotelId) { this.hotelId = hotelId; }
}

public class PaymentInvoicePdfGenerator {
    
    // FrankStack brand colors
    private static final DeviceRgb FRANKSTACK_BLUE = new DeviceRgb(41, 128, 185);
    private static final DeviceRgb FRANKSTACK_GREEN = new DeviceRgb(46, 204, 113);
    private static final DeviceRgb FRANKSTACK_DARK = new DeviceRgb(44, 62, 80);
    private static final DeviceRgb FRANKSTACK_LIGHT_GRAY = new DeviceRgb(236, 240, 241);
    
    /**
     * Generates a PDF invoice in boarding pass style.
     * 
     * @param data InvoiceData containing all invoice information
     * @return byte array containing the PDF
     * @throws Exception if PDF generation fails
     */
    public byte[] generateInvoicePdf(InvoiceData data) throws Exception {
        
        System.out.println("🎨 Generating PDF invoice (Boarding Pass style)...");
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);
        
        // Set margins
        document.setMargins(20, 20, 20, 20);
        
        try {
            // Load fonts
            PdfFont boldFont = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            PdfFont regularFont = PdfFontFactory.createFont(StandardFonts.HELVETICA);
            
            // === HEADER: FrankStack Logo & Title ===
            addHeader(document, boldFont);
            
            // === BOARDING PASS STYLE CONTAINER ===
            addBoardingPassContainer(document, data, boldFont, regularFont);
            
            // === PAYMENT DETAILS TABLE ===
            addPaymentDetailsTable(document, data, boldFont, regularFont);
            
            // === FOOTER ===
            addFooter(document, regularFont);
            
            System.out.println("✅ PDF invoice generated successfully");
            
        } finally {
            document.close();
        }
        
        return baos.toByteArray();
    }
    
    /**
     * Adds the header with FrankStack branding
     */
    private void addHeader(Document document, PdfFont boldFont) {
        
        // Title
        Paragraph title = new Paragraph("FRANKSTACK PAYMENT INVOICE")
            .setFont(boldFont)
            .setFontSize(24)
            .setFontColor(FRANKSTACK_BLUE)
            .setTextAlignment(TextAlignment.CENTER)
            .setMarginBottom(5);
        
        document.add(title);
        
        // Subtitle
        Paragraph subtitle = new Paragraph("Your Travel Payment Receipt")
            .setFont(boldFont)
            .setFontSize(12)
            .setFontColor(FRANKSTACK_DARK)
            .setTextAlignment(TextAlignment.CENTER)
            .setMarginBottom(20);
        
        document.add(subtitle);
    }
    
    /**
     * Adds the main boarding pass style container
     */
    private void addBoardingPassContainer(Document document, InvoiceData data, 
                                         PdfFont boldFont, PdfFont regularFont) {
        
        // Create a table for the boarding pass layout
        Table boardingPass = new Table(UnitValue.createPercentArray(new float[]{1, 1}));
        boardingPass.setWidth(UnitValue.createPercentValue(100));
        boardingPass.setBackgroundColor(FRANKSTACK_LIGHT_GRAY);
        boardingPass.setBorder(new SolidBorder(FRANKSTACK_BLUE, 2));
        
        // === LEFT SIDE: Main Info ===
        Cell leftCell = new Cell()
            .setBorder(Border.NO_BORDER)
            .setPadding(15);
        
        // Invoice Number (Big and Bold)
        leftCell.add(new Paragraph("INVOICE")
            .setFont(boldFont)
            .setFontSize(10)
            .setFontColor(FRANKSTACK_DARK)
            .setMarginBottom(2));
        
        leftCell.add(new Paragraph(data.getInvoiceNumber() != null ? 
                                  data.getInvoiceNumber() : "INV-" + data.getSagaCorrelationId().substring(0, 8))
            .setFont(boldFont)
            .setFontSize(18)
            .setFontColor(FRANKSTACK_BLUE)
            .setMarginBottom(15));
        
        // Passenger (Cardholder)
        if (data.getCardHolder() != null) {
            leftCell.add(new Paragraph("PASSENGER")
                .setFont(boldFont)
                .setFontSize(9)
                .setFontColor(FRANKSTACK_DARK)
                .setMarginBottom(2));
            
            leftCell.add(new Paragraph(data.getCardHolder().toUpperCase())
                .setFont(boldFont)
                .setFontSize(14)
                .setFontColor(FRANKSTACK_DARK)
                .setMarginBottom(15));
        }
        
        // Date
        leftCell.add(new Paragraph("DATE")
            .setFont(boldFont)
            .setFontSize(9)
            .setFontColor(FRANKSTACK_DARK)
            .setMarginBottom(2));
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm");
        leftCell.add(new Paragraph(data.getTimestamp().format(formatter))
            .setFont(regularFont)
            .setFontSize(11)
            .setFontColor(FRANKSTACK_DARK));
        
        boardingPass.addCell(leftCell);
        
        // === RIGHT SIDE: Amount & Status ===
        Cell rightCell = new Cell()
            .setBorder(new SolidBorder(FRANKSTACK_BLUE,  2))
            .setPadding(15)
            .setTextAlignment(TextAlignment.RIGHT);
        
        // Amount
        rightCell.add(new Paragraph("TOTAL AMOUNT")
            .setFont(boldFont)
            .setFontSize(10)
            .setFontColor(FRANKSTACK_DARK)
            .setMarginBottom(2));
        
        String amountStr = String.format("%.2f %s", 
            data.getTotalAmount() != null ? data.getTotalAmount() : BigDecimal.ZERO,
            data.getCurrency() != null ? data.getCurrency() : "EUR");
        
        rightCell.add(new Paragraph(amountStr)
            .setFont(boldFont)
            .setFontSize(22)
            .setFontColor(FRANKSTACK_GREEN)
            .setMarginBottom(15));
        
        // Status Badge
        Paragraph statusBadge = new Paragraph(data.getStatus() != null ? 
                                             data.getStatus().toUpperCase() : "PAID")
            .setFont(boldFont)
            .setFontSize(12)
            .setFontColor(ColorConstants.WHITE)
            .setBackgroundColor(FRANKSTACK_GREEN)
            .setPadding(5)
            .setPaddingLeft(15)
            .setPaddingRight(15)
            .setTextAlignment(TextAlignment.CENTER);
        
        rightCell.add(statusBadge);
        
        boardingPass.addCell(rightCell);
        
        document.add(boardingPass);
        document.add(new Paragraph("\n"));
    }
    
    /**
     * Adds detailed payment information table
     */
    private void addPaymentDetailsTable(Document document, InvoiceData data,
                                       PdfFont boldFont, PdfFont regularFont) {
        
        // Section title
        document.add(new Paragraph("PAYMENT DETAILS")
            .setFont(boldFont)
            .setFontSize(14)
            .setFontColor(FRANKSTACK_DARK)
            .setMarginBottom(10));
        
        // Create details table
        Table detailsTable = new Table(UnitValue.createPercentArray(new float[]{1, 2}));
        detailsTable.setWidth(UnitValue.createPercentValue(100));
        
        // Add rows
        addDetailRow(detailsTable, "Transaction ID:", data.getSagaCorrelationId(), boldFont, regularFont);
        
        if (data.getInvoiceNumber() != null) {
            addDetailRow(detailsTable, "Invoice Number:", data.getInvoiceNumber(), boldFont, regularFont);
        }
        
        if (data.getTravelId() != null) {
            addDetailRow(detailsTable, "Travel Booking ID:", data.getTravelId(), boldFont, regularFont);
        }
        
        if (data.getHotelId() != null) {
            addDetailRow(detailsTable, "Hotel Booking ID:", data.getHotelId(), boldFont, regularFont);
        }
        
        DateTimeFormatter fullFormatter = DateTimeFormatter.ofPattern("dd MMMM yyyy - HH:mm:ss");
        addDetailRow(detailsTable, "Payment Date:", data.getTimestamp().format(fullFormatter), boldFont, regularFont);
        
        if (data.getCurrency() != null) {
            addDetailRow(detailsTable, "Currency:", data.getCurrency(), boldFont, regularFont);
        }
        
        document.add(detailsTable);
        document.add(new Paragraph("\n"));
    }
    
    /**
     * Helper method to add a row to details table
     */
    private void addDetailRow(Table table, String label, String value, 
                             PdfFont boldFont, PdfFont regularFont) {
        
        Cell labelCell = new Cell()
            .add(new Paragraph(label).setFont(boldFont).setFontSize(10))
            .setBorder(Border.NO_BORDER)
            .setPaddingTop(5)
            .setPaddingBottom(5)
            .setBackgroundColor(FRANKSTACK_LIGHT_GRAY);
        
        Cell valueCell = new Cell()
            .add(new Paragraph(value).setFont(regularFont).setFontSize(10))
            .setBorder(Border.NO_BORDER)
            .setPaddingTop(5)
            .setPaddingBottom(5)
            .setPaddingLeft(10);
        
        table.addCell(labelCell);
        table.addCell(valueCell);
    }
    
    /**
     * Adds footer with thank you message
     */
    private void addFooter(Document document, PdfFont regularFont) {
        
        // Separator line
        Table separator = new Table(1);
        separator.setWidth(UnitValue.createPercentValue(100));
        separator.addCell(new Cell()
            .setBorder(Border.NO_BORDER)
            .setBorderTop(new SolidBorder(FRANKSTACK_LIGHT_GRAY, 1))
            .setHeight(10));
        document.add(separator);
        
        // Thank you message
        Paragraph thankYou = new Paragraph("Thank you for choosing FrankStack!")
            .setFont(regularFont)
            .setFontSize(12)
            .setTextAlignment(TextAlignment.CENTER)
            .setFontColor(FRANKSTACK_DARK)
            .setMarginTop(10);
        
        document.add(thankYou);
        
        // Contact info
        Paragraph contact = new Paragraph("For support, contact: support@frankstack.io")
            .setFont(regularFont)
            .setFontSize(9)
            .setTextAlignment(TextAlignment.CENTER)
            .setFontColor(ColorConstants.GRAY)
            .setMarginTop(5);
        
        document.add(contact);
        
        // Powered by
        Paragraph poweredBy = new Paragraph("Powered by FrankStack AWS Lambda & LocalStack S3")
            .setFont(regularFont)
            .setFontSize(8)
            .setTextAlignment(TextAlignment.CENTER)
            .setFontColor(ColorConstants.LIGHT_GRAY)
            .setMarginTop(10);
        
        document.add(poweredBy);
    }
}
