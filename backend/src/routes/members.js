const express = require('express');
const db = require('../database');
const dayjs = require('dayjs');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

router.get('/', (req, res) => {
  const { keyword, page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;
  
  let sql = 'SELECT * FROM members WHERE 1=1';
  let countSql = 'SELECT COUNT(*) as total FROM members WHERE 1=1';
  const params = [];
  
  if (keyword) {
    sql += ' AND (child_name LIKE ? OR parent_name LIKE ? OR phone LIKE ? OR member_no LIKE ?)';
    countSql += ' AND (child_name LIKE ? OR parent_name LIKE ? OR phone LIKE ? OR member_no LIKE ?)';
    const search = `%${keyword}%`;
    params.push(search, search, search, search);
  }
  
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  
  const members = db.prepare(sql).all(...params, parseInt(pageSize), offset);
  const { total } = db.prepare(countSql).get(...params);
  
  res.json({ success: true, data: members, total });
});

router.get('/:id', (req, res) => {
  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id);
  
  if (!member) {
    return res.status(404).json({ success: false, message: '会员不存在' });
  }
  
  const cards = db.prepare(`
    SELECT mc.*, ct.name as card_type_name, ct.type as card_type
    FROM member_cards mc
    JOIN card_types ct ON mc.card_type_id = ct.id
    WHERE mc.member_id = ?
    ORDER BY mc.created_at DESC
  `).all(req.params.id);
  
  const records = db.prepare(`
    SELECT cr.*, ps.session_name, p.name as product_name
    FROM consumption_records cr
    LEFT JOIN play_sessions ps ON cr.session_id = ps.id
    LEFT JOIN products p ON cr.product_id = p.id
    WHERE cr.member_id = ?
    ORDER BY cr.created_at DESC
    LIMIT 20
  `).all(req.params.id);
  
  res.json({ success: true, data: { ...member, cards, records } });
});

router.get('/qr/:qrCode', (req, res) => {
  const member = db.prepare('SELECT * FROM members WHERE qr_code = ? OR member_no = ?').get(req.params.qrCode, req.params.qrCode);
  
  if (!member) {
    return res.status(404).json({ success: false, message: '会员不存在' });
  }
  
  const cards = db.prepare(`
    SELECT mc.*, ct.name as card_type_name, ct.type as card_type
    FROM member_cards mc
    JOIN card_types ct ON mc.card_type_id = ct.id
    WHERE mc.member_id = ? AND mc.status = 1
  `).all(member.id);
  
  res.json({ success: true, data: { ...member, cards } });
});

router.post('/', (req, res) => {
  const { child_name, child_age, child_gender, parent_name, phone, address } = req.body;
  
  const memberNo = 'M' + dayjs().format('YYYYMMDDHHmmss');
  const qrCode = uuidv4();
  
  try {
    const result = db.prepare(`
      INSERT INTO members (member_no, child_name, child_age, child_gender, parent_name, phone, address, qr_code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(memberNo, child_name, child_age, child_gender, parent_name, phone, address, qrCode);
    
    res.json({ success: true, data: { id: result.lastInsertRowid, member_no: memberNo, qr_code: qrCode } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', (req, res) => {
  const { child_name, child_age, child_gender, parent_name, phone, address } = req.body;
  
  try {
    db.prepare(`
      UPDATE members 
      SET child_name = ?, child_age = ?, child_gender = ?, parent_name = ?, phone = ?, address = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(child_name, child_age, child_gender, parent_name, phone, address, req.params.id);
    
    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
