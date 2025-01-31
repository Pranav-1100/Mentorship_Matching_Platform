// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const profileRoutes = require('./routes/profile.routes');
const matchingRoutes = require('./routes/matching.routes');
const connectionRoutes = require('./routes/connection.routes');
const chatRoutes = require('./routes/chat.routes');  // Add this line
const notificationRoutes = require('./routes/notification.routes');
const applicationRoutes = require('./routes/application.routes');

// Import middlewares
const { errorHandler } = require('./middlewares/error.middleware');
const { authMiddleware } = require('./middlewares/auth.middleware');

const app = express();

// Middleware
app.use(helmet());
const corsOptions = {
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['*'], // Allow all headers
  credentials: false // Disable credentials when allowing all origins
};

app.use(cors(corsOptions));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/profiles', authMiddleware, profileRoutes);
app.use('/api/matching', authMiddleware, matchingRoutes);
app.use('/api/connections', authMiddleware, connectionRoutes);
app.use('/api/chat', authMiddleware, chatRoutes);  // Add this line
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/applications', authMiddleware, applicationRoutes);

// Error handling
app.use(errorHandler);

module.exports = app;
