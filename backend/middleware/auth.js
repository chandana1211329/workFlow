const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT Authentication Middleware
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Access token required'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                error: 'Invalid token or user not found'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expired'
            });
        }
        
        console.error('Authentication error:', error);
        return res.status(500).json({
            success: false,
            error: 'Authentication failed'
        });
    }
};

// Role-based Authorization Middleware
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: 'Access denied: insufficient permissions'
            });
        }

        next();
    };
};

// Admin-only middleware
const requireAdmin = authorizeRoles('admin');

// Intern-only middleware
const requireIntern = authorizeRoles('intern');

// Self-access middleware (users can only access their own data)
const requireSelfAccess = (req, res, next) => {
    const targetUserId = req.params.userId || req.params.id;
    
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }

    // Admins can access any user data
    if (req.user.role === 'admin') {
        return next();
    }

    // Users can only access their own data
    if (req.user._id.toString() !== targetUserId) {
        return res.status(403).json({
            success: false,
            error: 'Access denied: can only access your own data'
        });
    }

    next();
};

module.exports = {
    authenticateToken,
    authorizeRoles,
    requireAdmin,
    requireIntern,
    requireSelfAccess
};
