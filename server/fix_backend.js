const fs = require('fs');
let code = fs.readFileSync('src/controllers/reportController.js', 'utf8');

// The block ends with:
//         ORDER BY quantity DESC
//       `
//     ]);
const idx = code.indexOf('ORDER BY quantity DESC');
const idx2 = code.indexOf(']);', idx);

const chunk = code.substring(idx, idx2 + 3);

const replacement = `ORDER BY quantity DESC
      \`,
      // PREV SUMMARY
      prisma.order.aggregate({
        where: prevOrderWhere,
        _sum: { total: true },
        _count: { id: true }
      }),
      prisma.orderItem.aggregate({
        where: { order: prevOrderWhere },
        _sum: { quantity: true }
      }),
      prisma.$queryRaw\`
        SELECT SUM("total" - ("unitCostPrice" * "quantity")) as profit
        FROM "OrderItem"
        WHERE "orderId" IN (
          SELECT id FROM "Order" 
          WHERE "status" = 'COMPLETED' AND "createdAt" >= \${pStart} AND "createdAt" <= \${pEnd}
        )
      \`
    ]);`;

code = code.replace(chunk, replacement);
fs.writeFileSync('src/controllers/reportController.js', code);
