const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('password', 10);

    await prisma.user.upsert({
        where: { email: '' },
        update: {},
        create: {
            email: 'daffa@bank.com',
            name: 'Admin',
            password: hashedPassword
        }
    });

    console.log('Database seeded successfully');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });