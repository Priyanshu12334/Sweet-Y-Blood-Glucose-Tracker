import jwt from 'jsonwebtoken';

export default (req, res, next) => {
  const token = req.cookies?.token;
  if (typeof token !== 'string' || token.length === 0) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload || typeof payload.sub !== 'string' || payload.sub.length === 0) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.userId = payload.sub;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
