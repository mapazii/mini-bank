const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/dashboard/summary', authenticateToken, async (req, res) => {
    try {
        // Get total customers (not deleted)
        const totalCustomers = await prisma.customer.count({
            where: { deletedAt: null }
        });

        // Get total transactions
        const totalTransactions = await prisma.transaction.count();

        // Get total amount for deposits and withdrawals
        const depositSum = await prisma.transaction.aggregate({
            where: { type: 'DEPOSIT' },
            _sum: { amount: true }
        });

        const withdrawalSum = await prisma.transaction.aggregate({
            where: { type: 'WITHDRAW' },
            _sum: { amount: true }
        });

        // Get today's transactions count
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayTransactions = await prisma.transaction.count({
            where: {
                createdAt: {
                    gte: today
                }
            }
        });

        res.json({
            totalCustomers,
            totalTransactions,
            totalDeposits: depositSum._sum.amount || 0,
            totalWithdrawals: withdrawalSum._sum.amount || 0,
            todayTransactions
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;