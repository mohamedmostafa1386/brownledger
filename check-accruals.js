const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const prepaids = await prisma.prepaidExpense.findMany();
    const loans = await prisma.loan.findMany();
    console.log('Prepaid Expenses:', JSON.stringify(prepaids, null, 2));
    console.log('Loans:', JSON.stringify(loans, null, 2));
    await prisma.$disconnect();
}

check();
