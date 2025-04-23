const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/customers/:id/deposit', authenticateToken, async (req, res) => {
    try {
        const customerId = parseInt(req.params.id, 10);
        const { amount } = req.body;

        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            return res.status(400).json({ message: 'A positive amount is required' });
        }

        const customer = await prisma.customer.findFirst({
            where: {
                id: customerId,
                deletedAt: null
            }
        });

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        const transaction = await prisma.$transaction(async (tx) => {
            // Create deposit transaction
            return tx.transaction.create({
                data: {
                    customerId,
                    amount: parseFloat(amount),
                    type: 'DEPOSIT'
                }
            });
        });

        res.status(201).json(transaction);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/customers/:id/withdraw', authenticateToken, async (req, res) => {
    try {
        const customerId = parseInt(req.params.id, 10);
        const { amount } = req.body;

        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            return res.status(400).json({ message: 'A positive amount is required' });
        }

        const customer = await prisma.customer.findFirst({
            where: {
                id: customerId,
                deletedAt: null
            }
        });

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        try {
            const transaction = await prisma.$transaction(async (tx) => {
                const deposits = await tx.transaction.aggregate({
                    where: {
                        customerId,
                        type: 'DEPOSIT'
                    },
                    _sum: {
                        amount: true
                    }
                });

                const withdrawals = await tx.transaction.aggregate({
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

                if (balance < parseFloat(amount)) {
                    throw new Error('Insufficient balance');
                }
                return tx.transaction.create({
                    data: {
                        customerId,
                        amount: parseFloat(amount),
                        type: 'WITHDRAW'
                    }
                });
            });

            res.status(201).json(transaction);
        } catch (error) {
            if (error.message === 'Insufficient balance') {
                return res.status(400).json({ message: 'Insufficient balance' });
            }
            throw error;
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;