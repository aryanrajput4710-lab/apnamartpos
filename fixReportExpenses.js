const fs = require('fs');

let report = fs.readFileSync('server/src/controllers/reportController.js', 'utf8');

report = report.replace(
  /      `,\n      \/\/ 17\. Expenses\n      prisma\.expense\.aggregate\(\{\n        where: \{ date: \{ gte: start, lte: end \} \},\n        _sum: \{ amount: true \}\n      \}\)\n    \]\);/,
  "      `\n    ]);"
);

// wait let me verify if "// 17. Expenses" is really there. In my previous replace I just matched \`\n    ]); which probably didn't match because of the comment.
