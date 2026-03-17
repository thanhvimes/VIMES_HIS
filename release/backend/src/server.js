// ==================== MAIN SERVER - PURE NODE.JS ====================
// File: backend/src/server.js

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Serve static files from frontend build (production mode)
const frontendPath = path.join(__dirname, '../../../dist');
if (require('fs').existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
    console.log('📂 Serving frontend from:', frontendPath);
}

// Import routes
const bookingRoutes = require('./routes/booking.routes');
const roomRoutes = require('./routes/room.routes');
const scheduleRoutes = require('./routes/schedule.routes');
const authRoutes = require('./routes/auth.routes'); // NEW: Authentication routes

// API Health check (before other API routes)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'vClinic Backend API',
        version: '1.0.0'
    });
});

// Register API routes
app.use('/api/v1/auth', authRoutes); // NEW: Authentication routes
app.use('/api/v1/booking', bookingRoutes);
app.use('/api/v1', roomRoutes);
app.use('/api/v1/schedule', scheduleRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
    if (require('fs').existsSync(frontendPath)) {
        res.sendFile(path.join(frontendPath, 'index.html'));
    } else {
        res.status(404).json({
            error: 'Frontend not built. Run "npm run build" first or use Vite dev server on port 3000'
        });
    }
});

// Start automated jobs (Cron/Interval)
const scheduleService = require('./services/schedule.service');
scheduleService.setupAutomatedJobs();

// Start server
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`🚀 vClinic Backend Server`);
    console.log(`📡 Running on port ${PORT}`);
    console.log(`🌐 http://localhost:${PORT}`);
    console.log(`📊 Database: ${process.env.DB_NAME || 'Not configured'}`);
    console.log('='.repeat(50));
});

module.exports = app;
