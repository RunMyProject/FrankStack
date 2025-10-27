/**
 * testLocation.js
 * ------------------------------------------------------
 *
 * Author: Edoardo Sabatini
 * Date: 27 October 2025
 * ------------------------------------------------------
 */
const express = require('express');
const fetch = require('node-fetch');

const app = express();

// Proxy route
app.get('/api/location/reverse', async (req, res) => {
  const { lat, lon, lang = 'it' } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'lat and lon required' });

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=${lang}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'FrankStack/1.0 (contact: edoardo@example.com)' }
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Avvio server
app.listen(3001, () => console.log('Test location server running on http://localhost:3001'));
