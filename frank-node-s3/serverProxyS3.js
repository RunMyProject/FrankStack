/**
 * serverProxyS3.js
 * -------------------------------
 * Simple proxy to fix S3 headers so the PDF opens inline in the browser.
 * Works with LocalStack or any internal S3 endpoint.
 * -------------------------------
 * Author: Edoardo Sabatini
 * Date: 03 November 2025
 */

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3007;

// Base URL of your LocalStack S3 bucket (adjust if needed)
const LOCALSTACK_BASE = 'http://172.17.0.1:4566/frank-aws-invoices/invoices';

app.use(cors());

/**
 * Extended Health Check
 * -----------------------------------
 * Verifies that both the proxy server and LocalStack S3 endpoint are reachable.
 */
app.get('/health', async (req, res) => {
  const health = {
    service: 'S3 PDF Proxy',
    status: 'ok',
    localstack: {
      reachable: false,
      url: LOCALSTACK_BASE,
      status: 'unknown',
    },
    timestamp: new Date().toISOString(),
  };

  try {
    // Perform a HEAD request to check if LocalStack responds
    const response = await fetch(LOCALSTACK_BASE, { method: 'HEAD' });

    if (response.ok) {
      health.localstack.reachable = true;
      health.localstack.status = 'online';
    } else {
      health.localstack.status = `HTTP ${response.status}`;
    }
  } catch (err) {
    health.localstack.status = 'unreachable';
    health.localstack.error = err.message;
  }

  res.json(health);
});

/**
 * PDF Proxy Endpoint
 * Example: GET /invoice/23ca86e1.pdf
 * -----------------------------------
 * The backend builds the full S3 URL, fetches the file, and fixes headers.
 */
app.get('/invoice/:invoiceNumber.pdf', async (req, res) => {
  const { invoiceNumber } = req.params;

  if (!invoiceNumber) {
    return res.status(400).json({ error: 'Missing invoice number' });
  }

  // Build the LocalStack S3 file URL
  const fileUrl = `${LOCALSTACK_BASE}/${invoiceNumber}/invoice.pdf`;

  try {
    console.log(`📄 Proxying LocalStack PDF: ${fileUrl}`);

    const response = await fetch(fileUrl);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'PDF not found on S3' });
    }

    const buffer = await response.buffer();

    // 👉 Only purpose: force inline view in browser
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="invoice-${invoiceNumber}.pdf"`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  } catch (error) {
    console.error('❌ Proxy Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 S3 PDF Proxy running on port ${PORT}`);
});
