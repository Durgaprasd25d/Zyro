const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication Middleware
 * Verifies JWT token in Authorization header (Bearer <token>)
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, error: 'Authentication required. Token missing.' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, error: 'Invalid token format.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_change_me');
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({ success: false, error: 'User account not found or deactivated.' });
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, error: 'Account has been disabled. Please contact support.' });
        }

        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, error: 'Session expired. Please log in again.' });
        }
        return res.status(401).json({ success: false, error: 'Invalid or malformed authentication token.' });
    }
};

/**
 * Role-Based Access Control Middleware
 * @param  {...string} allowedRoles Roles permitted to access the endpoint
 */
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'Authentication required.' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: `Access denied. Requires one of: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`
            });
        }

        next();
    };
};

module.exports = {
    authenticate,
    requireRole
};
