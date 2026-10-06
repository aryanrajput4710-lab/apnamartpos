const fs = require('fs');
let schema = fs.readFileSync('server/prisma/schema.prisma', 'utf8');

schema += `
model Expense {
  id          String   @id @default(uuid())
  category    String   // e.g. TRANSPORTATION, LABOUR, OTHERS
  amount      Decimal
  description String?
  date        DateTime @default(now())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
`;

fs.writeFileSync('server/prisma/schema.prisma', schema);
