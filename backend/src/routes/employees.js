const express = require('express');
const db = require('../database');

const router = express.Router();

router.get('/', (req, res) => {
  const { position, status } = req.query;
  
  let sql = 'SELECT * FROM employees WHERE 1=1';
  const params = [];
  
  if (position) {
    sql += ' AND position = ?';
    params.push(position);
  }
  
  if (status !== undefined) {
    sql += ' AND status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY created_at DESC';
  
  const employees = db.prepare(sql).all(...params);
  res.json({ success: true, data: employees });
});

router.get('/:id', (req, res) => {
  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  
  if (!employee) {
    return res.status(404).json({ success: false, message: '员工不存在' });
  }
  
  res.json({ success: true, data: employee });
});

router.post('/', (req, res) => {
  const { employee_no, name, phone, position, base_salary } = req.body;
  
  try {
    const result = db.prepare(`
      INSERT INTO employees (employee_no, name, phone, position, base_salary)
      VALUES (?, ?, ?, ?, ?)
    `).run(employee_no, name, phone, position, base_salary);
    
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', (req, res) => {
  const { name, phone, position, base_salary, status } = req.body;
  
  try {
    db.prepare(`
      UPDATE employees 
      SET name = ?, phone = ?, position = ?, base_salary = ?, status = ?
      WHERE id = ?
    `).run(name, phone, position, base_salary, status, req.params.id);
    
    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
