require('dotenv').config();
const express = require('express');
const https = require('https');
const fs = require('fs');
const app = express();
const port = 3001;

console.log("GitHub deploy test -Feb 26");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enhanced logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url} from ${req.headers.origin}`);
  next();
});

// CORS middleware - simplified, single origin header
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowed = ['https://expresscouriers.co', 'https://www.expresscouriers.co'];
  
  if (allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    console.log(`CORS allowed for: ${origin}`);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://expresscouriers.co');
    console.log(`CORS defaulted to: https://expresscouriers.co (origin: ${origin})`);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// SSL Configuration
let sslOptions;
try {
  console.log('Loading SSL certificates...');
  sslOptions = {
    key: fs.readFileSync('/home/bitnami/localhost.key'),
    cert: fs.readFileSync('/home/bitnami/localhost.crt'),
  };
  console.log('SSL certificates loaded successfully');
} catch (err) {
  console.error('SSL certificate loading error:', err.message);
  process.exit(1);
}

// Google Maps API key endpoint
app.get('/config/maps-api-key', (req, res) => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.error('Google Places API key not found in environment');
    return res.status(500).json({ error: 'API key not configured' });
  }
  res.json({ key: apiKey });
});

// Address autocomplete
app.get('/api/address-autocomplete', async (req, res) => {
  const input = req.query.input || '';
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Address lookup failed:', error.message);
    res.status(500).json({ error: 'Address lookup failed', details: error.message });
  }
});

// Test endpoint
app.get('/api/delivery-orders', (req, res) => {
  res.json({ message: 'Delivery orders endpoint is working' });
});

// Delivery form submission
app.post('/api/delivery-orders', async (req, res) => {
  try {
    console.log('Received delivery order:', req.body);
    res.json({
      success: true,
      message: 'Order received successfully',
      data: req.body
    });
    /* Uncomment for production
    const response = await fetch('https://endpoint.puffski.com/express/courier/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(`Dispatch service error: ${response.status}`);
    console.log('Order dispatched successfully:', data);
    res.json(data);
    */
  } catch (error) {
    console.error('Order processing error:', error.message);
    res.status(500).json({ error: 'Failed to process order', details: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Start HTTPS server
https.createServer(sslOptions, app).listen(port, () => {
  console.log(`HTTPS Server running on port ${port}`);
});
