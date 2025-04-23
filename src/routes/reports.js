// src/routes/reports.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

//get balance
router.get('/customers/:id/balance', authenticateToken, async (req, res) => {
    try {
        const customerId = parseInt(req.params.id, 10);
        const customer = await prisma.customer.findFirst({
            where: {
                id: customerId,
                deletedAt: null
            }
        });

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        const deposits = await prisma.transaction.aggregate({
            where: {
                customerId,
                type: 'DEPOSIT'
            },
            _sum: {
                amount: true
            }
        });

        const withdrawals = await prisma.transaction.aggregate({
            where: {
                customerId,
                type: 'WITHDRAW'
            },
            _sum: {
                amount: true
            }
        });

        const totalDeposits = deposits._sum.amount || 0;
        const totalWithdrawals = withdrawals._sum.amount || 0;
        const balance = totalDeposits - totalWithdrawals;

        res.json({ balance });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

//get transaction
router.get('/customers/:id/transactions', authenticateToken, async (req, res) => {
    try {
        const customerId = parseInt(req.params.id, 10);
        const { type, startDate, endDate } = req.query;

        const customer = await prisma.customer.findFirst({
            where: {
                id: customerId,
                deletedAt: null
            }
        });

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        const query = {
            where: { customerId }
        };

        if (type) {
            query.where.type = type.toUpperCase();
        }

        if (startDate || endDate) {
            query.where.createdAt = {};

            if (startDate) {
                query.where.createdAt.gte = new Date(startDate);
            }

            if (endDate) {
                query.where.createdAt.lte = new Date(endDate);
            }
        }

        query.orderBy = { createdAt: 'desc' };
        const transactions = await prisma.transaction.findMany(query);

        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;