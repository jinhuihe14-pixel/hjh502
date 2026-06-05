const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/members', require('./routes/members'));
app.use('/api/cards', require('./routes/cards'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/consumptions', require('./routes/consumptions'));
app.use('/api/products', require('./routes/products'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/commissions', require('./routes/commissions'));
app.use('/api/statistics', require('./routes/statistics'));
app.use('/api/auth', require('./routes/auth'));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '乐园管理系统服务正常运行' });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
