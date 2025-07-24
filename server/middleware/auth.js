import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.userId;

      // Get the user to check if they're part of a business
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.business && user.business.businessCode) {
        // Add business code to the request
        req.businessCode = user.business.businessCode;
        req.isBusinessOwner = user.business.isBusinessOwner || false;
        console.log(`User ${user.email} is part of business ${user.business.businessCode}, isOwner: ${req.isBusinessOwner}`);
      } else {
        console.log(`User ${user.email} is not part of any business`);
      }

      next();
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return res.status(401).json({ message: 'Token is not valid' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export default auth;