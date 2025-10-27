/**
 * myStripeServer.js
 * -----------------------
 * Simulated Stripe server for generating payment tokens.
 * For demo purposes only; no real Stripe integration.
 *
 * Author: Edoardo Sabatini
 * Date: 27 October 2025
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

const STRIPE_PORT = parseInt(process.env.STRIPE_PORT || '4000', 10);
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'dummy_key_for_local';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'dummy_webhook';
const STRIPE_CANCEL_URL = process.env.STRIPE_CANCEL_URL || 'http://localhost:4000/cancel';
const STRIPE_SUCCESS_URL = process.env.STRIPE_SUCCESS_URL || 'http://localhost:4000/success';

app.listen(STRIPE_PORT, () => {
  console.log(`🚀 MyStripeServer running on http://localhost:${STRIPE_PORT}`);
});
