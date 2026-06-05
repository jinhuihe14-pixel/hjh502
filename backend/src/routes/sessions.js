const express = require('express');
const db = require('../database');
const dayjs = require('dayjs');

const router = express.Router();

const sessionConfig = [
  { type: 'morning', name: '上午场', startTime: '09:00', endTime: '12:00' },
  { type: 'afternoon', name: '下午场', startTime: '14:00', endTime: '18:00' },
  { type: 'evening', name: '夜场', startTime: '19:00', endTime: '21:30' }
];

router.get('/today', (req, res) => {
  const today = dayjs().format('YYYY-MM-DD');
  
  let sessions = db.prepare('SELECT * FROM play_sessions WHERE date = ?').all(today);
  
  if (sessions.length === 0) {
    const insert = db.prepare(`
      INSERT INTO play_sessions (date, session_type, session_name, start_time, end_time, max_capacity)
      VALUES (?, ?, ?, ?, ?, 50)
    `);
    
    sessions = sessionConfig.map(config => {
      insert.run(today, config.type, config.name, config.startTime, config.endTime);
      return {
        date: today,
        session_type: config.type,
        session_name: config.name,
        start_time: config.startTime,
        end_time: config.endTime,
        max_capacity: 50,
        current_count: 0
      };
    });
    
    sessions = db.prepare('SELECT * FROM play_sessions WHERE date = ?').all(today);
  }
  
  res.json({ success: true, data: sessions });
});

router.get('/:date', (req, res) => {
  const date = req.params.date;
  
  let sessions = db.prepare('SELECT * FROM play_sessions WHERE date = ?').all(date);
  
  if (sessions.length === 0) {
    const insert = db.prepare(`
      INSERT INTO play_sessions (date, session_type, session_name, start_time, end_time, max_capacity)
      VALUES (?, ?, ?, ?, ?, 50)
    `);
    
    sessionConfig.forEach(config => {
      insert.run(date, config.type, config.name, config.startTime, config.endTime);
    });
    
    sessions = db.prepare('SELECT * FROM play_sessions WHERE date = ?').all(date);
  }
  
  res.json({ success: true, data: sessions });
});

router.put('/:id', (req, res) => {
  const { max_capacity } = req.body;
  
  try {
    db.prepare('UPDATE play_sessions SET max_capacity = ? WHERE id = ?').run(max_capacity, req.params.id);
    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/walk-in', (req, res) => {
  const { session_id, amount } = req.body;
  
  const session = db.prepare('SELECT * FROM play_sessions WHERE id = ?').get(session_id);
  
  if (!session) {
    return res.status(400).json({ success: false, message: '场次不存在' });
  }
  
  if (session.current_count >= session.max_capacity) {
    return res.status(400).json({ success: false, message: '本场次已达上限', isFull: true });
  }
  
  try {
    db.prepare('UPDATE play_sessions SET current_count = current_count + 1 WHERE id = ?').run(session_id);
    
    db.prepare(`
      INSERT INTO consumption_records (consumption_type, session_id, amount)
      VALUES ('walk-in', ?, ?)
    `).run(session_id, amount);
    
    const updatedSession = db.prepare('SELECT * FROM play_sessions WHERE id = ?').get(session_id);
    const isNearFull = updatedSession.current_count >= updatedSession.max_capacity * 0.9;
    
    res.json({ 
      success: true, 
      message: '购票成功', 
      isNearFull,
      currentCount: updatedSession.current_count,
      maxCapacity: updatedSession.max_capacity
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
