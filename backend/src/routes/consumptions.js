const express = require('express');
const db = require('../database');

const router = express.Router();

router.get('/', (req, res) => {
  const { startDate, endDate, type, page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;
  
  let sql = `
    SELECT cr.*, m.child_name, m.parent_name, ps.session_name, p.name as product_name,
           e.name as technician_name
    FROM consumption_records cr
    LEFT JOIN members m ON cr.member_id = m.id
    LEFT JOIN play_sessions ps ON cr.session_id = ps.id
    LEFT JOIN products p ON cr.product_id = p.id
    LEFT JOIN employees e ON cr.technician_id = e.id
    WHERE 1=1
  `;
  let countSql = 'SELECT COUNT(*) as total FROM consumption_records WHERE 1=1';
  const params = [];
  
  if (startDate) {
    sql += ' AND DATE(cr.created_at) >= ?';
    countSql += ' AND DATE(created_at) >= ?';
    params.push(startDate);
  }
  
  if (endDate) {
    sql += ' AND DATE(cr.created_at) <= ?';
    countSql += ' AND DATE(created_at) <= ?';
    params.push(endDate);
  }
  
  if (type) {
    sql += ' AND cr.consumption_type = ?';
    countSql += ' AND consumption_type = ?';
    params.push(type);
  }
  
  sql += ' ORDER BY cr.created_at DESC LIMIT ? OFFSET ?';
  
  const records = db.prepare(sql).all(...params, parseInt(pageSize), offset);
  const { total } = db.prepare(countSql).get(...params);
  
  res.json({ success: true, data: records, total });
});

router.post('/product', (req, res) => {
  const { member_id, product_id, quantity, technician_id, amount } = req.body;
  
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
    
    if (!product) {
      return res.status(400).json({ success: false, message: '产品不存在' });
    }
    
    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: '库存不足' });
    }
    
    db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(quantity, product_id);
    
    const result = db.prepare(`
      INSERT INTO consumption_records (member_id, consumption_type, product_id, quantity, amount, technician_id)
      VALUES (?, 'product', ?, ?, ?, ?)
    `).run(member_id, product_id, quantity, amount, technician_id);
    
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
