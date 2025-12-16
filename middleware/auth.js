const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const header = req.headers.authorization || req.header('Authorization');
    const token = header && header.startsWith('Bearer ') ? header.replace('Bearer ', '') : null;

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'JWT secret is not configured on the server' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.adminId = decoded.adminId;
    next();
  } catch (error) {
    console.error('JWT verify error:', error);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = auth;




