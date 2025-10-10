/**
 * myStripeServer.js
 * -----------------------
 * Simulated Stripe server for generating payment tokens.
 * For demo purposes only; no real Stripe integration.
 *
 * Author: Edoardo Sabatini
 * Date: 10 October 2025
 */

import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

/**
 * POST /getToken
 * Receives partial card info (number last 4 digits, expiry) and returns a fake token.
 */
app.post('/getToken', (req, res) => {
  const { lastFourDigits, cardType } = req.body;
  if (!lastFourDigits || !cardType) {
    return res.status(400).json({ error: 'Missing card information' });
  }

  // Generate fake token for demo
  const token = `tok_${Date.now()}`;

  return res.json({
    token,
    lastFourDigits,
    cardType,
    timestamp: new Date().toISOString()
  });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 MyStripeServer running on http://localhost:${PORT}`);
});
