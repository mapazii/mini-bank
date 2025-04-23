
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const accessToken = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: '15m' }
        );

        // Generate refresh token
        const refreshToken = jwt.sign(
            { id: user.id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        // Update refresh token
        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken }
        });

        res.status(200).json({ accessToken, refreshToken });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/token/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ message: 'Refresh token is required' });
        }

        const user = await prisma.user.findFirst({
            where: { refreshToken }
        });

        if (!user) {
            return res.status(403).json({ message: 'Invalid refresh token' });
        }

        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Invalid refresh token' });
            }

            const accessToken = jwt.sign(
                { id: user.id, email: user.email },
                process.env.JWT_ACCESS_SECRET,
                { expiresIn: '15m' }
            );

            res.status(200).json({ accessToken });
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});


router.post('/logout', authenticateToken, async (req, res) => {
    try {
        await prisma.user.update({
            where: { id: req.user.id },
            data: { refreshToken: null }
        });

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;