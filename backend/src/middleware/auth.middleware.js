import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'secret_key_lelang_spk_2026';

export const verifyToken = (req, res, next) => {
  const bearerHeader = req.headers['authorization'];
  if (!bearerHeader) {
    return res.status(403).json({ success: false, message: 'No token provided' });
  }

  const token = bearerHeader.split(' ')[1];
  if (!token) return res.status(403).json({ success: false, message: 'Invalid token format' });

  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ success: false, message: 'Unauthorized / Token expired' });
    }
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  });
};

export const verifyAdmin = (req, res, next) => {
  if (req.userRole !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Requires Admin Role' });
  }
  next();
};

export const verifyPenjual = (req, res, next) => {
  if (req.userRole !== 'PENJUAL' && req.userRole !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Requires Penjual Role' });
  }
  next();
};

export const verifyPembeli = (req, res, next) => {
  if (req.userRole !== 'PEMBELI' && req.userRole !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Requires Pembeli Role' });
  }
  next();
};
