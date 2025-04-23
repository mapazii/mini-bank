const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const transactionRoutes = require('./routes/transactions');
const reportRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 3000;

const prisma = new PrismaClient();
app.use(express.json());


app.use('/', authRoutes);
app.use('/customers', customerRoutes);
app.use('/', transactionRoutes);
app.use('/', reportRoutes);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal error' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;