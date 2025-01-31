const { verifyToken } = require('../utils/jwt.utils');
const admin = require('../config/firebase');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Verify with Firebase
    const firebaseUser = await admin.auth().getUser(decoded.userId);
    if (!firebaseUser) {
      return res.status(401).json({ message: 'Invalid user' });
    }

    req.user = {
      id: decoded.userId,
      email: firebaseUser.email
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = {
  authMiddleware
};

