const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

const router = express.Router();
const JWT_SECRET = 'your-secret-key-change-in-production';

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  
  if (!user) {
    return res.status(401).json({ success: false, message: '用户名或密码错误' });
  }
  
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ success: false, message: '用户名或密码错误' });
  }
  
  if (user.status !== 1) {
    return res.status(403).json({ success: false, message: '账号已被禁用' });
  }
  
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    }
  });
});

module.exports = router;
