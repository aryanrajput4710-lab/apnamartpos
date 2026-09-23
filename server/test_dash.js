const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const u = await prisma.user.findFirst();
  const o = await prisma.order.create({
    data: {
      orderNumber: `T-${Date.now()}`,
      subtotal: 100,
      total: 100,
      status: 'COMPLETED',
      createdBy: u.id,
      payments: {
        create: {
          amount: 100,
          method: 'CASH',
          status: 'COMPLETED'
        }
      }
    }
  });

  const start = new Date(0);
  const end = new Date(4000000000000);
  
  const res = await prisma.$queryRaw`
    SELECT 
      DATE(o."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') as date,
      SUM(o."total") as revenue,
      COUNT(o."id") as orders
    FROM "Order" o
    WHERE o."status" = 'COMPLETED'
      AND o."createdAt" >= ${start}
      AND o."createdAt" <= ${end}
      AND EXISTS (
        SELECT 1 FROM "Payment" p WHERE p."orderId" = o."id" AND p."status" = 'COMPLETED'
      )
    GROUP BY DATE(o."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')
    ORDER BY date ASC
  `;
  console.log(res);

  // Now test getDashboardSummary directly
  const { getDashboardSummary } = require('./src/controllers/reportController');
  const req = { query: { range: 'Today' } };
  const _res = {
    status: (code) => ({
      json: (data) => console.log('Response JSON:', code, JSON.stringify(data).substring(0, 500) + '...')
    })
  };
  await getDashboardSummary(req, _res);

}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
