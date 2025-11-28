const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const analyticsRoutes = require('./routes/analytics');
const pushRoutes = require('./routes/push');
const productPhotos = require('./routes/product_photos');
const subscriptionsRoutes = require('./routes/subscriptions');

const app = express();
app.use(bodyParser.json());

// Routes
app.use('/auth', authRoutes);
app.use('/products', productsRoutes);
app.use('/products', productPhotos);
app.use('/analytics', analyticsRoutes);
app.use('/push', pushRoutes);
app.use('/subscriptions', subscriptionsRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`MAICA backend listening on port ${PORT}`));
