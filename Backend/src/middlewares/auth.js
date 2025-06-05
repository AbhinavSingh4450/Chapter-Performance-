const adminOnly = (req, res, next) => {
  const isAdmin = true; // Replace this with real auth later
  if (!isAdmin) return res.status(403).json({ message: 'Access denied. Admins only.' });
  next();
};

module.exports = adminOnly;