const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');

const app = express();

// Middlewares
app.use(cors({
  origin: '*', // Allow requests from any origin or React dev server
  credentials: true,
}));
app.use(express.json());

// Health route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Task Manager API is running smoothly',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Task Manager API is up and running.');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? {} : err.message,
  });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('ERROR: MONGO_URI is not set in environment variables');
  process.exit(1);
}

// Connect to MongoDB and start server
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(' Successfully connected to MongoDB Atlas');
    app.listen(PORT, () => {
      console.log(` Server running on port ${PORT} (http://localhost:${PORT})`);
    });
  })
  .catch((err) => {
    console.error(' MongoDB connection failed:', err.message);
    process.exit(1);
  });
