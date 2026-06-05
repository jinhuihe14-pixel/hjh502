const express = require('express');
const db = require('../database');
const dayjs = require('dayjs');

const router = express.Router();

router.get('/settings', (req, res) => {
  const settings = db.prepare('SELECT * FROM commission_settings').all();
  res.json({ success: true, data: settings });
});

router.post('/settings', (req, res) => {
  const { position, commission_type, commission_rate, fixed_amount } = req.body;
  
  try {
    const result = db.prepare(`
      INSERT INTO commission_settings (position, commission_type, commission_rate, fixed_amount)
      VALUES (?, ?, ?, ?)
    `).run(position, commission_type, commission_rate, fixed_amount);
    
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/settings/:id', (req, res) => {
  const { commission_type, commission_rate, fixed_amount } = req.body;
  
  try {
    db.prepare(`
      UPDATE commission_settings 
      SET commission_type = ?, commission_rate = ?, fixed_amount = ?
      WHERE id = ?
    `).run(commission_type, commission_rate, fixed_amount, req.params.id);
    
    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/records', (req, res) => {
  const { startDate, endDate, type, employeeId, page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;
  
  let sql = `
    SELECT cr.*, e.name as employee_name, e.position
    FROM commission_records cr
    JOIN employees e ON cr.employee_id = e.id
    WHERE 1=1
  `;
  let countSql = 'SELECT COUNT(*) as total FROM commission_records WHERE 1=1';
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
    sql += ' AND cr.type = ?';
    countSql += ' AND type = ?';
    params.push(type);
  }
  
  if (employeeId) {
    sql += ' AND cr.employee_id = ?';
    countSql += ' AND employee_id = ?';
    params.push(employeeId);
  }
  
  sql += ' ORDER BY cr.created_at DESC LIMIT ? OFFSET ?';
  
  const records = db.prepare(sql).all(...params, parseInt(pageSize), offset);
  const { total } = db.prepare(countSql).get(...params);
  
  res.json({ success: true, data: records, total });
});

router.get('/daily/:date', (req, res) => {
  const date = req.params.date;
  
  const records = db.prepare(`
    SELECT cr.*, e.name as employee_name, e.position
    FROM commission_records cr
    JOIN employees e ON cr.employee_id = e.id
    WHERE DATE(cr.created_at) = ?
    ORDER BY cr.created_at DESC
  `).all(date);
  
  const totalCommission = records.reduce((sum, r) => sum + r.commission_amount, 0);
  const totalAmount = records.reduce((sum, r) => sum + r.amount, 0);
  
  res.json({ 
    success: true, 
    data: {
      records,
      totalCommission,
      totalAmount,
      recordCount: records.length
    }
  });
});

router.get('/salary/:month', (req, res) => {
  const month = req.params.month;
  const startDate = `${month}-01`;
  const endDate = dayjs(startDate).endOf('month').format('YYYY-MM-DD');
  
  const employees = db.prepare('SELECT * FROM employees WHERE status = 1').all();
  
  const salaryData = employees.map(emp => {
    let cardCommission = 0;
    let productCommission = 0;
    
    const cardResult = db.prepare(`
      SELECT SUM(commission_amount) as commission
      FROM commission_records
      WHERE employee_id = ? AND type = 'card'
        AND DATE(created_at) BETWEEN ? AND ?
    `).get(emp.id, startDate, endDate);
    cardCommission = cardResult.commission || 0;
    
    const productResult = db.prepare(`
      SELECT SUM(commission_amount) as commission
      FROM commission_records
      WHERE employee_id = ? AND type = 'product'
        AND DATE(created_at) BETWEEN ? AND ?
    `).get(emp.id, startDate, endDate);
    productCommission = productResult.commission || 0;
    
    const totalSalary = emp.base_salary + cardCommission + productCommission;
    
    return {
      employee_id: emp.id,
      employee_name: emp.name,
      position: emp.position,
      base_salary: emp.base_salary,
      card_commission: cardCommission,
      product_commission: productCommission,
      total_salary: totalSalary
    };
  });
  
  res.json({ success: true, data: salaryData });
});

router.post('/salary/generate', (req, res) => {
  const { month } = req.body;
  const startDate = `${month}-01`;
  const endDate = dayjs(startDate).endOf('month').format('YYYY-MM-DD');
  
  const employees = db.prepare('SELECT * FROM employees WHERE status = 1').all();
  
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO salary_records 
    (employee_id, month, base_salary, card_commission, product_commission, total_salary, status)
    VALUES (?, ?, ?, ?, ?, ?, 'draft')
  `);
  
  employees.forEach(emp => {
    let cardCommission = 0;
    let productCommission = 0;
    
    const cardResult = db.prepare(`
      SELECT SUM(commission_amount) as commission
      FROM commission_records
      WHERE employee_id = ? AND type = 'card'
        AND DATE(created_at) BETWEEN ? AND ?
    `).get(emp.id, startDate, endDate);
    cardCommission = cardResult.commission || 0;
    
    const productResult = db.prepare(`
      SELECT SUM(commission_amount) as commission
      FROM commission_records
      WHERE employee_id = ? AND type = 'product'
        AND DATE(created_at) BETWEEN ? AND ?
    `).get(emp.id, startDate, endDate);
    productCommission = productResult.commission || 0;
    
    const totalSalary = emp.base_salary + cardCommission + productCommission;
    
    insertStmt.run(emp.id, month, emp.base_salary, cardCommission, productCommission, totalSalary);
  });
  
  const salaryRecords = db.prepare(`
    SELECT sr.*, e.name as employee_name, e.position
    FROM salary_records sr
    JOIN employees e ON sr.employee_id = e.id
    WHERE sr.month = ?
  `).all(month);
  
  res.json({ success: true, data: salaryRecords });
});

router.get('/salary/records/:month', (req, res) => {
  const records = db.prepare(`
    SELECT sr.*, e.name as employee_name, e.position
    FROM salary_records sr
    JOIN employees e ON sr.employee_id = e.id
    WHERE sr.month = ?
  `).all(req.params.month);
  
  res.json({ success: true, data: records });
});

router.put('/salary/:id', (req, res) => {
  const { bonus, deduction } = req.body;
  
  try {
    const record = db.prepare('SELECT * FROM salary_records WHERE id = ?').get(req.params.id);
    
    const totalSalary = record.base_salary + record.card_commission + record.product_commission + (bonus || 0) - (deduction || 0);
    
    db.prepare(`
      UPDATE salary_records 
      SET bonus = ?, deduction = ?, total_salary = ?
      WHERE id = ?
    `).run(bonus, deduction, totalSalary, req.params.id);
    
    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/salary/:id/lock', (req, res) => {
  try {
    db.prepare(`
      UPDATE salary_records 
      SET status = 'locked', locked_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.params.id);
    
    res.json({ success: true, message: '薪资已锁定归档' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
