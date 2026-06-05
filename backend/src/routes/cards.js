const express = require('express');
const db = require('../database');
const dayjs = require('dayjs');

const router = express.Router();

router.get('/types', (req, res) => {
  const types = db.prepare('SELECT * FROM card_types WHERE status = 1').all();
  res.json({ success: true, data: types });
});

router.get('/types/:id', (req, res) => {
  const type = db.prepare('SELECT * FROM card_types WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: type });
});

router.post('/types', (req, res) => {
  const { name, type, price, total_times, valid_days, description } = req.body;
  
  try {
    const result = db.prepare(`
      INSERT INTO card_types (name, type, price, total_times, valid_days, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, type, price, total_times, valid_days, description);
    
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/types/:id', (req, res) => {
  const { name, type, price, total_times, valid_days, description, status } = req.body;
  
  try {
    db.prepare(`
      UPDATE card_types 
      SET name = ?, type = ?, price = ?, total_times = ?, valid_days = ?, description = ?, status = ?
      WHERE id = ?
    `).run(name, type, price, total_times, valid_days, description, status, req.params.id);
    
    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/', (req, res) => {
  const { memberId, status } = req.query;
  
  let sql = `
    SELECT mc.*, m.child_name, m.parent_name, m.phone, ct.name as card_type_name, ct.type as card_type,
           e.name as salesperson_name
    FROM member_cards mc
    JOIN members m ON mc.member_id = m.id
    JOIN card_types ct ON mc.card_type_id = ct.id
    LEFT JOIN employees e ON mc.salesperson_id = e.id
    WHERE 1=1
  `;
  const params = [];
  
  if (memberId) {
    sql += ' AND mc.member_id = ?';
    params.push(memberId);
  }
  
  if (status !== undefined) {
    sql += ' AND mc.status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY mc.created_at DESC';
  
  const cards = db.prepare(sql).all(...params);
  res.json({ success: true, data: cards });
});

router.post('/', (req, res) => {
  const { member_id, card_type_id, salesperson_id } = req.body;
  
  if (!salesperson_id) {
    return res.status(400).json({ success: false, message: '请选择导购员' });
  }
  
  const cardType = db.prepare('SELECT * FROM card_types WHERE id = ?').get(card_type_id);
  if (!cardType) {
    return res.status(400).json({ success: false, message: '卡种不存在' });
  }
  
  const salesperson = db.prepare('SELECT * FROM employees WHERE id = ? AND status = 1').get(salesperson_id);
  if (!salesperson) {
    return res.status(400).json({ success: false, message: '导购员不存在或已离职' });
  }
  
  const cardNo = 'C' + dayjs().format('YYYYMMDDHHmmss');
  const startDate = dayjs().format('YYYY-MM-DD');
  const endDate = dayjs().add(cardType.valid_days, 'day').format('YYYY-MM-DD');
  
  const commissionSetting = db.prepare('SELECT * FROM commission_settings WHERE position = ?').get(salesperson.position);
  
  let commissionAmount = 0;
  if (commissionSetting) {
    if (commissionSetting.commission_type === 'percentage' || commissionSetting.commission_type === 'rate') {
      commissionAmount = cardType.price * (commissionSetting.commission_rate / 100);
    } else if (commissionSetting.commission_type === 'fixed') {
      commissionAmount = commissionSetting.fixed_amount;
    }
  }
  
  try {
    const result = db.prepare(`
      INSERT INTO member_cards (member_id, card_type_id, card_no, remaining_times, total_times, start_date, end_date, salesperson_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      member_id, 
      card_type_id, 
      cardNo, 
      cardType.total_times, 
      cardType.total_times, 
      startDate, 
      endDate, 
      salesperson_id
    );
    
    db.prepare(`
      INSERT INTO commission_records (employee_id, type, related_id, amount, commission_amount)
      VALUES (?, 'card', ?, ?, ?)
    `).run(salesperson_id, result.lastInsertRowid, cardType.price, commissionAmount);
    
    res.json({ success: true, data: { id: result.lastInsertRowid, card_no: cardNo } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/consume', (req, res) => {
  const { session_id } = req.body;
  const cardId = req.params.id;
  
  const card = db.prepare('SELECT * FROM member_cards WHERE id = ?').get(cardId);
  
  if (!card) {
    return res.status(404).json({ success: false, message: '会员卡不存在' });
  }
  
  if (card.status !== 1) {
    return res.status(400).json({ success: false, message: '会员卡已停用' });
  }
  
  const cardType = db.prepare('SELECT * FROM card_types WHERE id = ?').get(card.card_type_id);
  
  if (cardType.type !== 'single' && cardType.type !== 'times') {
    if (dayjs().isAfter(dayjs(card.end_date))) {
      return res.status(400).json({ success: false, message: '会员卡已过期' });
    }
  }
  
  if (cardType.type === 'times' && card.remaining_times <= 0) {
    return res.status(400).json({ success: false, message: '剩余次数不足' });
  }
  
  try {
    if (cardType.type === 'times') {
      db.prepare('UPDATE member_cards SET remaining_times = remaining_times - 1 WHERE id = ?').run(cardId);
    }
    
    if (session_id) {
      db.prepare('UPDATE play_sessions SET current_count = current_count + 1 WHERE id = ?').run(session_id);
    }
    
    db.prepare(`
      INSERT INTO consumption_records (member_card_id, member_id, consumption_type, session_id, amount)
      VALUES (?, ?, 'play', ?, 0)
    `).run(cardId, card.member_id, session_id);
    
    res.json({ success: true, message: '核销成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
