const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Access token is required' });
        }

        jwt.verify(token, process.env.JWT_ACCESS_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Invalid token' });
            }

            const user = await prisma.user.findUnique({
                where: { id: decoded.id }
            });

            if (!user) {
                return res.status(403).json({ message: 'Invalid token' });
            }

            req.user = user;
            next();
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { authenticateToken };