const express = require('express');
const db = require('../database');
const dayjs = require('dayjs');

const router = express.Router();

router.get('/overview', (req, res) => {
  const today = dayjs().format('YYYY-MM-DD');
  
  const memberCount = db.prepare('SELECT COUNT(*) as count FROM members').get().count;
  const activeCardCount = db.prepare('SELECT COUNT(*) as count FROM member_cards WHERE status = 1').get().count;
  
  const todaySales = db.prepare(`
    SELECT 
      COUNT(*) as order_count,
      COALESCE(SUM(amount), 0) as total_amount
    FROM consumption_records 
    WHERE DATE(created_at) = ?
  `).get(today);
  
  const todayNewMembers = db.prepare(`
    SELECT COUNT(*) as count FROM members WHERE DATE(created_at) = ?
  `).get(today).count;
  
  const todayNewCards = db.prepare(`
    SELECT COUNT(*) as count FROM member_cards WHERE DATE(created_at) = ?
  `).get(today).count;
  
  res.json({
    success: true,
    data: {
      memberCount,
      activeCardCount,
      todayOrderCount: todaySales.order_count,
      todaySalesAmount: todaySales.total_amount,
      todayNewMembers,
      todayNewCards
    }
  });
});

router.get('/session-traffic', (req, res) => {
  const { startDate, endDate } = req.query;
  
  const data = db.prepare(`
    SELECT 
      ps.date,
      ps.session_type,
      ps.session_name,
      ps.current_count,
      ps.max_capacity
    FROM play_sessions ps
    WHERE ps.date BETWEEN ? AND ?
    ORDER BY ps.date, ps.session_type
  `).all(startDate, endDate);
  
  res.json({ success: true, data });
});

router.get('/card-sales', (req, res) => {
  const { startDate, endDate } = req.query;
  
  const data = db.prepare(`
    SELECT 
      ct.id,
      ct.name,
      ct.type,
      COUNT(mc.id) as sales_count,
      SUM(ct.price) as total_amount
    FROM card_types ct
    LEFT JOIN member_cards mc ON ct.id = mc.card_type_id 
      AND DATE(mc.created_at) BETWEEN ? AND ?
    GROUP BY ct.id
    ORDER BY total_amount DESC
  `).all(startDate, endDate);
  
  res.json({ success: true, data });
});

router.get('/product-sales', (req, res) => {
  const { startDate, endDate, category } = req.query;
  
  let sql = `
    SELECT 
      p.id,
      p.name,
      p.category,
      COUNT(cr.id) as sales_count,
      SUM(cr.amount) as total_amount,
      SUM(p.commission_amount) as total_commission
    FROM products p
    LEFT JOIN consumption_records cr ON p.id = cr.product_id 
      AND cr.consumption_type = 'product'
      AND DATE(cr.created_at) BETWEEN ? AND ?
  `;
  
  const params = [startDate, endDate];
  
  if (category) {
    sql += ' WHERE p.category = ?';
    params.push(category);
  }
  
  sql += ' GROUP BY p.id ORDER BY total_amount DESC';
  
  const data = db.prepare(sql).all(...params);
  
  res.json({ success: true, data });
});

router.get('/daily-sales', (req, res) => {
  const { startDate, endDate } = req.query;
  
  const data = db.prepare(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as order_count,
      SUM(amount) as total_amount
    FROM consumption_records
    WHERE DATE(created_at) BETWEEN ? AND ?
    GROUP BY DATE(created_at)
    ORDER BY date
  `).all(startDate, endDate);
  
  res.json({ success: true, data });
});

router.get('/promotions', (req, res) => {
  const promotions = db.prepare('SELECT * FROM promotions WHERE status = 1 ORDER BY created_at DESC').all();
  res.json({ success: true, data: promotions });
});

router.post('/promotions', (req, res) => {
  const { title, content, type, start_date, end_date } = req.body;
  
  try {
    const result = db.prepare(`
      INSERT INTO promotions (title, content, type, start_date, end_date)
      VALUES (?, ?, ?, ?, ?)
    `).run(title, content, type, start_date, end_date);
    
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/promotions/:id', (req, res) => {
  const { title, content, type, start_date, end_date, status } = req.body;
  
  try {
    db.prepare(`
      UPDATE promotions 
      SET title = ?, content = ?, type = ?, start_date = ?, end_date = ?, status = ?
      WHERE id = ?
    `).run(title, content, type, start_date, end_date, status, req.params.id);
    
    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
