const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

const productsRouter = require('../routes/products');
const authRouter = require('../routes/auth');
const heroRouter = require('../routes/hero');

dotenv.config();

const app = express();

// CORS - Allow requests from frontend
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  'https://sarhadcorporation.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
].filter(Boolean);

// Log allowed origins for debugging
console.log('CORS Allowed Origins:', allowedOrigins);
console.log('CLIENT_URL:', process.env.CLIENT_URL);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        console.log('CORS: No origin header, allowing request');
        return callback(null, true);
      }
      
      console.log('CORS: Request from origin:', origin);
      
      // Always allow the specific frontend URL
      if (origin === 'https://sarhadcorporation.vercel.app' || 
          origin.startsWith('https://sarhadcorporation')) {
        console.log('CORS: Allowing sarhadcorporation.vercel.app');
        return callback(null, true);
      }
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        console.log('CORS: Origin in allowed list');
        callback(null, true);
      } else {
        // For now, allow all origins to fix CORS issue
        // In production, you can restrict this
        console.log('CORS: Allowing origin (permissive mode)');
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Type'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// Handle preflight requests
app.options('*', cors());

// Increase body size limit for file uploads (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Mount routes under /api/*
// Because this function is mounted at /api on Vercel, we keep the /api prefix here
// so that requests to /api/products, /api/auth, /api/health are handled correctly.
app.use('/api/products', productsRouter);
app.use('/api/auth', authRouter);
app.use('/api/hero', heroRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Serverless API is running' });
});

let isConnected = false;

async function connectToDatabase() {
  if (isConnected) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set in environment variables');
  }
  await mongoose.connect(uri);
    isConnected = true;
    console.log('MongoDB connected (serverless)');
}

module.exports = async (req, res) => {
  try {
    // Set CORS headers explicitly before handling request
    const origin = req.headers.origin;
    if (origin && (origin.includes('sarhadcorporation.vercel.app') || origin.includes('localhost'))) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    }
    
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    await connectToDatabase();
    return app(req, res);
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};


