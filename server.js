require('dotenv').config();
const express = require('express');
const https = require('https');
const fs = require('fs');
const app = express();
const port = 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enhanced logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url} from ${req.headers.origin}`);
  next();
});

// CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowed = ['https://expresscouriers.co', 'https://www.expresscouriers.co'];
  if (allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    console.log(`Allowed origin: ${origin}`);
  } else {
    console.log(`Blocked origin: ${origin}`);
    res.setHeader('Access-Control-Allow-Origin', 'https://expresscouriers.co');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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
  console.error('SSL certificate loading error:', err);
  process.exit(1);
}

// Google Maps API key endpoint
app.get('/config/maps-api-key', (req, res) => {
  console.log('API Key requested from:', req.headers.origin);
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.error('Google Places API key not found in environment');
    return res.status(500).json({ error: 'API key not configured' });
  }
  res.json({ key: apiKey });
});

// Address autocomplete (native fetch)
app.get('/api/address-autocomplete', async (req, res) => {
  const input = req.query.input || '';
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
  try {
    console.log('Using native fetch:', typeof fetch);
    const response = await fetch(url);
    const data = await response.json();
    console.log('API response:', data);
    res.json(data);
  } catch (error) {
    console.error('Address lookup failed:', error);
    res.status(500).json({ error: 'Address lookup failed', details: error.message });
  }
});

// Test endpoint to verify form submission
app.get('/api/delivery-orders', (req, res) => {
  res.json({ message: 'Delivery orders endpoint is working' });
});

// Delivery form submission (native fetch)
app.post('/api/delivery-orders', async (req, res) => {
  try {
    console.log('Received delivery order:', req.body);
    // For testing, just log and return the data
    console.log('Form data received:', req.body);
    res.json({ 
      success: true, 
      message: 'Order received successfully',
      data: req.body 
    });
    
    /* Commented out for testing
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
    console.error('Order processing error:', error);
    res.status(500).json({ error: 'Failed to process order', details: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Create HTTPS server with SSL options
const server = https.createServer(sslOptions, app);

// Start server
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
