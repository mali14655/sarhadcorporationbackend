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
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Allow all origins if no specific origins are set (development)
      if (allowedOrigins.length === 0) {
        return callback(null, true);
      }
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // In production, you might want to reject unknown origins
        // For now, allow all to fix CORS issue
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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    await connectToDatabase();
    return app(req, res);
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};


