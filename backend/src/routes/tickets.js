const express = require('express');
const db = require('../database');
const dayjs = require('dayjs');

const router = express.Router();

const generateTicketNo = () => {
  const dateStr = dayjs().format('YYYYMMDD');
  const prefix = `T${dateStr}`;
  
  const row = db.prepare(`
    SELECT ticket_no FROM tickets 
    WHERE ticket_no LIKE ? 
    ORDER BY ticket_no DESC LIMIT 1
  `).get(prefix + '%');
  
  if (!row) {
    return `${prefix}0001`;
  }
  
  const seqStr = row.ticket_no.slice(prefix.length);
  const seq = parseInt(seqStr, 10) + 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
};

router.post('/purchase', (req, res) => {
  const { session_id, quantity = 1, amount, card_type_id, contact_phone } = req.body;
  
  if (!session_id || !quantity || quantity < 1) {
    return res.status(400).json({ success: false, message: '参数错误' });
  }
  
  const session = db.prepare('SELECT * FROM play_sessions WHERE id = ?').get(session_id);
  
  if (!session) {
    return res.status(400).json({ success: false, message: '场次不存在' });
  }
  
  const remaining = session.max_capacity - session.current_count;
  if (quantity > remaining) {
    return res.status(400).json({ 
      success: false, 
      message: `超出场次剩余容量 ${quantity - remaining} 人`,
      remaining
    });
  }
  
  try {
    const ticketNo = generateTicketNo();
    
    const result = db.prepare(`
      INSERT INTO tickets (session_id, ticket_no, quantity, amount, card_type_id, contact_phone, status)
      VALUES (?, ?, ?, ?, ?, ?, 'valid')
    `).run(session_id, ticketNo, quantity, amount || 0, card_type_id || null, contact_phone || null);
    
    db.prepare('UPDATE play_sessions SET current_count = current_count + ? WHERE id = ?').run(quantity, session_id);
    
    db.prepare(`
      INSERT INTO consumption_records (consumption_type, session_id, quantity, amount)
      VALUES ('walk-in', ?, ?, ?)
    `).run(session_id, quantity, amount || 0);
    
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(result.lastInsertRowid);
    const updatedSession = db.prepare('SELECT * FROM play_sessions WHERE id = ?').get(session_id);
    const isNearFull = updatedSession.current_count >= updatedSession.max_capacity * 0.9;
    const isFull = updatedSession.current_count >= updatedSession.max_capacity;
    
    res.json({
      success: true,
      message: '购票成功',
      data: {
        ticket,
        session: updatedSession,
        isNearFull,
        isFull
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:ticketNo', (req, res) => {
  const { ticketNo } = req.params;
  
  const ticket = db.prepare(`
    SELECT t.*, ps.session_name, ps.date, ps.start_time, ps.end_time, ps.max_capacity, ps.current_count,
           ct.name as card_type_name
    FROM tickets t
    LEFT JOIN play_sessions ps ON t.session_id = ps.id
    LEFT JOIN card_types ct ON t.card_type_id = ct.id
    WHERE t.ticket_no = ?
  `).get(ticketNo);
  
  if (!ticket) {
    return res.status(404).json({ success: false, message: '票号不存在' });
  }
  
  res.json({ success: true, data: ticket });
});

router.post('/:ticketNo/refund', (req, res) => {
  const { ticketNo } = req.params;
  
  const ticket = db.prepare(`
    SELECT t.*, ps.session_name, ps.date, ps.start_time, ps.end_time
    FROM tickets t
    LEFT JOIN play_sessions ps ON t.session_id = ps.id
    WHERE t.ticket_no = ?
  `).get(ticketNo);
  
  if (!ticket) {
    return res.status(404).json({ success: false, message: '票号不存在' });
  }
  
  if (ticket.status === 'refunded') {
    return res.status(400).json({ success: false, message: '该票已退票' });
  }
  
  const sessionEndStr = `${ticket.date} ${ticket.end_time}`;
  const sessionEndTime = dayjs(sessionEndStr);
  const now = dayjs();
  
  if (now.isAfter(sessionEndTime)) {
    return res.status(400).json({ success: false, message: '场次已结束，不允许退票' });
  }
  
  try {
    db.prepare(`
      UPDATE tickets SET status = 'refunded', refunded_at = ? WHERE id = ?
    `).run(dayjs().format('YYYY-MM-DD HH:mm:ss'), ticket.id);
    
    db.prepare('UPDATE play_sessions SET current_count = current_count - ? WHERE id = ?').run(ticket.quantity, ticket.session_id);
    
    db.prepare(`
      INSERT INTO consumption_records (consumption_type, session_id, quantity, amount)
      VALUES ('refund', ?, ?, ?)
    `).run(ticket.session_id, ticket.quantity, -Math.abs(ticket.amount));
    
    const updatedSession = db.prepare('SELECT * FROM play_sessions WHERE id = ?').get(ticket.session_id);
    const isNearFull = updatedSession.current_count >= updatedSession.max_capacity * 0.9;
    const isFull = updatedSession.current_count >= updatedSession.max_capacity;
    
    res.json({
      success: true,
      message: '退票成功',
      data: {
        session: updatedSession,
        isNearFull,
        isFull
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  const tickets = db.prepare(`
    SELECT t.*, ct.name as card_type_name
    FROM tickets t
    LEFT JOIN card_types ct ON t.card_type_id = ct.id
    WHERE t.session_id = ?
    ORDER BY t.created_at DESC
  `).all(sessionId);
  
  res.json({ success: true, data: tickets });
});

module.exports = router;
