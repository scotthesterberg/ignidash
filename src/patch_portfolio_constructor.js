const fs = require('fs');
const path = '/home/sh38499/git/github/external/ignidash/src/lib/calc/portfolio.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "private withdrawalStrategy: 'proportional' | 'taxEfficient' = 'proportional',",
  "private withdrawalStrategy: 'proportional' | 'taxEfficient' = 'proportional',\n    private acaOptimization: boolean = false,"
);

fs.writeFileSync(path, code);
