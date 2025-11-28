const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const analyticsRoutes = require('./routes/analytics');
const pushRoutes = require('./routes/push');
const productPhotos = require('./routes/product_photos');
const subscriptionsRoutes = require('./routes/subscriptions');
const reportsRoutes = require('./routes/reports');
const salesRoutes = require('./routes/sales');
const expensesRoutes = require('./routes/expenses');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

app.use('/auth', authRoutes);
app.use('/products', productsRoutes);
app.use('/products', productPhotos);
app.use('/analytics', analyticsRoutes);
app.use('/push', pushRoutes);
app.use('/subscriptions', subscriptionsRoutes);
app.use('/reports', reportsRoutes);
app.use('/sales', salesRoutes);
app.use('/expenses', expensesRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`MAICA backend listening on port ${PORT}`));
