import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

if (!JWT_SECRET) {
    console.warn('WARNING: JWT_SECRET not set in environment variables');
}

/**
 * Generate a JWT token
 * @param {Object} payload - Data to sign
 * @returns {string} - Signed JWT
 */
export const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
    });
};

/**
 * Verify a JWT token
 * @param {string} token - JWT string
 * @returns {Object} - Decoded payload
 * @throws {Error} - If token is invalid or expired
 */
export const verifyToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
};
