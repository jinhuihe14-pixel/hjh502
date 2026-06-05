const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const dayjs = require('dayjs');

const dbPath = path.join(__dirname, '../../data/playground.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS card_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    price REAL NOT NULL,
    total_times INTEGER,
    valid_days INTEGER,
    description TEXT,
    status INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_no TEXT UNIQUE NOT NULL,
    child_name TEXT NOT NULL,
    child_age INTEGER,
    child_gender TEXT,
    parent_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT,
    avatar TEXT,
    qr_code TEXT UNIQUE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS member_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    card_type_id INTEGER NOT NULL,
    card_no TEXT UNIQUE NOT NULL,
    remaining_times INTEGER,
    total_times INTEGER,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    status INTEGER DEFAULT 1,
    salesperson_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id),
    FOREIGN KEY (card_type_id) REFERENCES card_types(id)
  );

  CREATE TABLE IF NOT EXISTS play_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    session_type TEXT NOT NULL,
    session_name TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    max_capacity INTEGER DEFAULT 50,
    current_count INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    UNIQUE(date, session_type)
  );

  CREATE TABLE IF NOT EXISTS consumption_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_card_id INTEGER,
    member_id INTEGER,
    consumption_type TEXT NOT NULL,
    session_id INTEGER,
    product_id INTEGER,
    quantity INTEGER DEFAULT 1,
    amount REAL NOT NULL,
    technician_id INTEGER,
    operator_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_card_id) REFERENCES member_cards(id),
    FOREIGN KEY (member_id) REFERENCES members(id),
    FOREIGN KEY (session_id) REFERENCES play_sessions(id)
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    commission_amount REAL DEFAULT 0,
    stock INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_no TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    position TEXT NOT NULL,
    base_salary REAL DEFAULT 0,
    status INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS commission_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    position TEXT NOT NULL,
    commission_type TEXT NOT NULL,
    commission_rate REAL DEFAULT 0,
    fixed_amount REAL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS commission_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    related_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    commission_amount REAL NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
  );

  CREATE TABLE IF NOT EXISTS salary_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    month TEXT NOT NULL,
    base_salary REAL DEFAULT 0,
    card_commission REAL DEFAULT 0,
    product_commission REAL DEFAULT 0,
    bonus REAL DEFAULT 0,
    deduction REAL DEFAULT 0,
    total_salary REAL DEFAULT 0,
    status TEXT DEFAULT 'draft',
    locked_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    UNIQUE(employee_id, month)
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    employee_id INTEGER,
    status INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
  );

  CREATE TABLE IF NOT EXISTS promotions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    type TEXT,
    start_date TEXT,
    end_date TEXT,
    status INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

const cardTypes = [
  { name: '单次散票', type: 'single', price: 68, total_times: 1, valid_days: 1, description: '单次游玩门票' },
  { name: '10次卡', type: 'times', price: 500, total_times: 10, valid_days: 180, description: '10次畅玩卡，半年有效期' },
  { name: '月卡', type: 'monthly', price: 800, total_times: null, valid_days: 30, description: '月卡，不限次数' },
  { name: '年卡', type: 'yearly', price: 3600, total_times: null, valid_days: 365, description: '年卡，不限次数' }
];

const insertCardType = db.prepare('INSERT INTO card_types (name, type, price, total_times, valid_days, description) VALUES (?, ?, ?, ?, ?, ?)');
cardTypes.forEach(card => {
  insertCardType.run(card.name, card.type, card.price, card.total_times, card.valid_days, card.description);
});

const products = [
  { name: 'DIY手工黏土', category: 'diy', price: 58, commission_amount: 10, stock: 100 },
  { name: 'DIY绘画套装', category: 'diy', price: 88, commission_amount: 15, stock: 50 },
  { name: '电玩代币10枚', category: 'game', price: 20, commission_amount: 0, stock: 9999 },
  { name: '电玩代币50枚', category: 'game', price: 100, commission_amount: 5, stock: 9999 }
];

const insertProduct = db.prepare('INSERT INTO products (name, category, price, commission_amount, stock) VALUES (?, ?, ?, ?, ?)');
products.forEach(product => {
  insertProduct.run(product.name, product.category, product.price, product.commission_amount, product.stock);
});

const employees = [
  { employee_no: 'E001', name: '张导购', phone: '13800138001', position: 'sales', base_salary: 3000 },
  { employee_no: 'E002', name: '李技师', phone: '13800138002', position: 'technician', base_salary: 3500 },
  { employee_no: 'E003', name: '王收银', phone: '13800138003', position: 'cashier', base_salary: 2800 },
  { employee_no: 'E004', name: '赵管理', phone: '13800138004', position: 'manager', base_salary: 5000 }
];

const insertEmployee = db.prepare('INSERT INTO employees (employee_no, name, phone, position, base_salary) VALUES (?, ?, ?, ?, ?)');
employees.forEach(emp => {
  insertEmployee.run(emp.employee_no, emp.name, emp.phone, emp.position, emp.base_salary);
});

const insertUser = db.prepare('INSERT INTO users (username, password, name, role, employee_id) VALUES (?, ?, ?, ?, ?)');
const hashedPassword = bcrypt.hashSync('123456', 10);
insertUser.run('admin', hashedPassword, '系统管理员', 'admin', 4);
insertUser.run('cashier', hashedPassword, '收银员', 'cashier', 3);
insertUser.run('sales', hashedPassword, '导购员', 'sales', 1);

const commissionSettings = [
  { position: 'sales', commission_type: 'percentage', commission_rate: 5, fixed_amount: 0 },
  { position: 'technician', commission_type: 'fixed', commission_rate: 0, fixed_amount: 10 }
];

const insertCommission = db.prepare('INSERT INTO commission_settings (position, commission_type, commission_rate, fixed_amount) VALUES (?, ?, ?, ?)');
commissionSettings.forEach(setting => {
  insertCommission.run(setting.position, setting.commission_type, setting.commission_rate, setting.fixed_amount);
});

const members = [
  { member_no: 'M20260601000001', child_name: '小明', child_age: 5, child_gender: 'male', parent_name: '王明', phone: '13800138011', address: '北京市朝阳区', qr_code: 'qr-uuid-001' },
  { member_no: 'M20260601000002', child_name: '小红', child_age: 4, child_gender: 'female', parent_name: '李芳', phone: '13800138012', address: '北京市海淀区', qr_code: 'qr-uuid-002' },
  { member_no: 'M20260601000003', child_name: '小华', child_age: 6, child_gender: 'male', parent_name: '张伟', phone: '13800138013', address: '北京市西城区', qr_code: 'qr-uuid-003' }
];

const insertMember = db.prepare('INSERT INTO members (member_no, child_name, child_age, child_gender, parent_name, phone, address, qr_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
members.forEach(member => {
  insertMember.run(member.member_no, member.child_name, member.child_age, member.child_gender, member.parent_name, member.phone, member.address, member.qr_code);
});

const memberCards = [
  { member_id: 1, card_type_id: 2, card_no: 'C20260601000001', remaining_times: 10, total_times: 10, start_date: dayjs().format('YYYY-MM-DD'), end_date: dayjs().add(180, 'day').format('YYYY-MM-DD'), salesperson_id: 1 },
  { member_id: 2, card_type_id: 3, card_no: 'C20260601000002', remaining_times: null, total_times: null, start_date: dayjs().format('YYYY-MM-DD'), end_date: dayjs().add(30, 'day').format('YYYY-MM-DD'), salesperson_id: 1 },
  { member_id: 3, card_type_id: 2, card_no: 'C20260601000003', remaining_times: 7, total_times: 10, start_date: dayjs().subtract(30, 'day').format('YYYY-MM-DD'), end_date: dayjs().add(150, 'day').format('YYYY-MM-DD'), salesperson_id: 1 }
];

const insertMemberCard = db.prepare('INSERT INTO member_cards (member_id, card_type_id, card_no, remaining_times, total_times, start_date, end_date, salesperson_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
memberCards.forEach(card => {
  insertMemberCard.run(card.member_id, card.card_type_id, card.card_no, card.remaining_times, card.total_times, card.start_date, card.end_date, card.salesperson_id);
});

console.log('数据库初始化完成！');
console.log('默认登录账号: admin / 123456');
console.log('初始会员账号: M20260601000001, M20260601000002, M20260601000003');

db.close();
