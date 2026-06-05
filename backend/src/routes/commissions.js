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

router.get('/daily/:date', (req, res) => {
  const date = req.params.date;
  
  const salesData = db.prepare(`
    SELECT 
      e.id as employee_id,
      e.name as employee_name,
      COUNT(mc.id) as card_count,
      SUM(ct.price) as total_sales,
      SUM(ct.price * cs.commission_rate / 100) as commission
    FROM member_cards mc
    JOIN employees e ON mc.salesperson_id = e.id
    JOIN card_types ct ON mc.card_type_id = ct.id
    JOIN commission_settings cs ON e.position = cs.position
    WHERE DATE(mc.created_at) = ?
    GROUP BY e.id
  `).all(date);
  
  const technicianData = db.prepare(`
    SELECT 
      e.id as employee_id,
      e.name as employee_name,
      COUNT(cr.id) as product_count,
      SUM(cr.amount) as total_sales,
      SUM(p.commission_amount) as commission
    FROM consumption_records cr
    JOIN employees e ON cr.technician_id = e.id
    JOIN products p ON cr.product_id = p.id
    WHERE DATE(cr.created_at) = ? AND cr.consumption_type = 'product'
    GROUP BY e.id
  `).all(date);
  
  res.json({ 
    success: true, 
    data: { 
      sales: salesData, 
      technicians: technicianData 
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
    
    if (emp.position === 'sales') {
      const salesResult = db.prepare(`
        SELECT 
          COUNT(mc.id) as card_count,
          SUM(ct.price) as total_sales,
          SUM(ct.price * cs.commission_rate / 100) as commission
        FROM member_cards mc
        JOIN card_types ct ON mc.card_type_id = ct.id
        JOIN commission_settings cs ON cs.position = 'sales'
        WHERE mc.salesperson_id = ? AND DATE(mc.created_at) BETWEEN ? AND ?
      `).get(emp.id, startDate, endDate);
      
      cardCommission = salesResult.commission || 0;
    }
    
    if (emp.position === 'technician') {
      const techResult = db.prepare(`
        SELECT 
          COUNT(cr.id) as product_count,
          SUM(p.commission_amount) as commission
        FROM consumption_records cr
        JOIN products p ON cr.product_id = p.id
        WHERE cr.technician_id = ? AND cr.consumption_type = 'product'
          AND DATE(cr.created_at) BETWEEN ? AND ?
      `).get(emp.id, startDate, endDate);
      
      productCommission = techResult.commission || 0;
    }
    
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
    
    if (emp.position === 'sales') {
      const salesResult = db.prepare(`
        SELECT SUM(ct.price * cs.commission_rate / 100) as commission
        FROM member_cards mc
        JOIN card_types ct ON mc.card_type_id = ct.id
        JOIN commission_settings cs ON cs.position = 'sales'
        WHERE mc.salesperson_id = ? AND DATE(mc.created_at) BETWEEN ? AND ?
      `).get(emp.id, startDate, endDate);
      
      cardCommission = salesResult.commission || 0;
    }
    
    if (emp.position === 'technician') {
      const techResult = db.prepare(`
        SELECT SUM(p.commission_amount) as commission
        FROM consumption_records cr
        JOIN products p ON cr.product_id = p.id
        WHERE cr.technician_id = ? AND cr.consumption_type = 'product'
          AND DATE(cr.created_at) BETWEEN ? AND ?
      `).get(emp.id, startDate, endDate);
      
      productCommission = techResult.commission || 0;
    }
    
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
