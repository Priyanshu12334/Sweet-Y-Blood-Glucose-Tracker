function validateEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateRegister(req, res, next) {
  const { name, email, password } = req.body ?? {};
  if (typeof name !== 'string' || name.length < 2 || name.length > 50) {
    return res.status(400).json({ message: '"name" length must be between 2 and 50 characters long' });
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ message: '"email" must be a valid email' });
  }
  if (typeof password !== 'string' || password.length < 6 || password.length > 100) {
    return res.status(400).json({ message: '"password" length must be between 6 and 100 characters long' });
  }
  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body ?? {};
  if (!validateEmail(email)) {
    return res.status(400).json({ message: '"email" must be a valid email' });
  }
  if (typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ message: '"password" is required' });
  }
  next();
}

export { validateRegister, validateLogin };
