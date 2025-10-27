/**
 * locationProxy.js
 * ------------------------------------------------------
 * Express router acting as a proxy to OpenStreetMap Nominatim API.
 * Prevents CORS errors by routing requests through the backend.
 *
 * Example:
 *   GET /api/location/reverse?lat=45.55&lon=9.23&lang=it
 *
 * Author: Edoardo Sabatini
 * Date: 27 October 2025
 * ------------------------------------------------------
 */

const express = require('express');
const fetch = require('node-fetch'); // lightweight HTTP client
const router = express.Router();

/**
 * Reverse geocoding proxy (lat/lon → human-readable location)
 */
router.get('/reverse', async (req, res) => {
  const { lat, lon, lang = 'it' } = req.query;

  // Validate query params
  if (!lat || !lon) {
    return res.status(400).json({ error: 'lat and lon parameters are required' });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=${lang}`;

    // Mandatory User-Agent header per Nominatim usage policy
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FrankStack/1.0 (contact: edoardo@example.com)'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim HTTP ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Nominatim proxy error:', err);
    res.status(500).json({ error: 'Failed to contact Nominatim', details: err.message });
  }
});

module.exports = router;
