const fs = require('fs');
let file = fs.readFileSync('server/prisma/schema.prisma', 'utf8');

// Add CashRegister model at the end
const cashRegisterModel = `
model CashRegister {
  id            String    @id @default(uuid())
  openedAt      DateTime  @default(now())
  closedAt      DateTime?
  openedById    String
  openedBy      User      @relation(fields: [openedById], references: [id])
  openingFloat  Decimal   @default(0)
  expectedCash  Decimal?
  actualCash    Decimal?
  difference    Decimal?
  totalUPI      Decimal?
  status        String    @default("OPEN") // OPEN, CLOSED
}
`;

file += cashRegisterModel;

// Add relations to User model
file = file.replace(
  'role         UserRole @default(CASHIER)',
  'role         UserRole @default(CASHIER)\n  registers    CashRegister[]'
);

fs.writeFileSync('server/prisma/schema.prisma', file, 'utf8');
console.log("Updated schema.prisma with CashRegister");
