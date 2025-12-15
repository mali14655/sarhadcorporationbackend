const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

const productsRouter = require('../routes/products');
const authRouter = require('../routes/auth');

dotenv.config();

const app = express();

// CORS
const allowedOrigin = process.env.CLIENT_URL || process.env.FRONTEND_URL;
app.use(
  cors({
    origin: allowedOrigin || '*',
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount routes under /api/*
// Because this function is mounted at /api on Vercel, we keep the /api prefix here
// so that requests to /api/products, /api/auth, /api/health are handled correctly.
app.use('/api/products', productsRouter);
app.use('/api/auth', authRouter);

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


