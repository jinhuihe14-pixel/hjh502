const express = require('express');
const db = require('../database');

const router = express.Router();

router.get('/', (req, res) => {
  const { category, status } = req.query;
  
  let sql = 'SELECT * FROM products WHERE 1=1';
  const params = [];
  
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  
  if (status !== undefined) {
    sql += ' AND status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY created_at DESC';
  
  const products = db.prepare(sql).all(...params);
  res.json({ success: true, data: products });
});

router.get('/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  
  if (!product) {
    return res.status(404).json({ success: false, message: '产品不存在' });
  }
  
  res.json({ success: true, data: product });
});

router.post('/', (req, res) => {
  const { name, category, price, commission_amount, stock } = req.body;
  
  try {
    const result = db.prepare(`
      INSERT INTO products (name, category, price, commission_amount, stock)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, category, price, commission_amount, stock);
    
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', (req, res) => {
  const { name, category, price, commission_amount, stock, status } = req.body;
  
  try {
    db.prepare(`
      UPDATE products 
      SET name = ?, category = ?, price = ?, commission_amount = ?, stock = ?, status = ?
      WHERE id = ?
    `).run(name, category, price, commission_amount, stock, status, req.params.id);
    
    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
