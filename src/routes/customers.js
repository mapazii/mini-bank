const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { paginateResults } = require('../utils/pagination');

const router = express.Router();
const prisma = new PrismaClient();


router.get('/', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        const [customers, total] = await Promise.all([
            prisma.customer.findMany({
                where: { deletedAt: null },
                skip,
                take: limit,
                orderBy: { id: 'desc' }
            }),
            prisma.customer.count({ where: { deletedAt: null } })
        ]);

        res.json(paginateResults(customers, total, page, limit));
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/', authenticateToken, async (req, res) => {
    try {
        const { fullName, address, birthDate, nik } = req.body;

        if (!fullName || !address || !birthDate || !nik) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if NIK exists
        const existingCustomer = await prisma.customer.findUnique({
            where: { nik }
        });

        if (existingCustomer) {
            return res.status(409).json({ message: 'Customer with this NIK already exists' });
        }

        // Create customer
        const customer = await prisma.customer.create({
            data: {
                fullName,
                address,
                birthDate: new Date(birthDate),
                nik
            }
        });

        res.status(201).json(customer);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);

        const customer = await prisma.customer.findFirst({
            where: {
                id,
                deletedAt: null
            }
        });

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.json(customer);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { fullName, address, birthDate, nik } = req.body;

        const customer = await prisma.customer.findFirst({
            where: {
                id,
                deletedAt: null
            }
        });

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Check if NIK exists (if changed)
        if (nik && nik !== customer.nik) {
            const existingCustomer = await prisma.customer.findUnique({
                where: { nik }
            });

            if (existingCustomer) {
                return res.status(409).json({ message: 'Customer with this NIK already exists' });
            }
        }

        const updatedCustomer = await prisma.customer.update({
            where: { id },
            data: {
                fullName: fullName || customer.fullName,
                address: address || customer.address,
                birthDate: birthDate ? new Date(birthDate) : customer.birthDate,
                nik: nik || customer.nik
            }
        });

        res.json(updatedCustomer);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);

        const customer = await prisma.customer.findFirst({
            where: {
                id,
                deletedAt: null
            }
        });

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Soft delete
        await prisma.customer.update({
            where: { id },
            data: { deletedAt: new Date() }
        });

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
