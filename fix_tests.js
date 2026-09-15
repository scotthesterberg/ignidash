const fs = require('fs');

const files = [
  '/home/sh38499/git/github/external/ignidash/src/lib/calc/__tests__/tax-efficient.test.ts',
  '/home/sh38499/git/github/external/ignidash/src/lib/calc/__tests__/test-utils.ts',
  '/home/sh38499/git/github/external/ignidash/src/lib/calc/returns-providers/stochastic-returns-provider.test.ts',
  '/home/sh38499/git/github/external/ignidash/src/lib/calc/simulation-engine.test.ts',
  '/home/sh38499/git/github/external/ignidash/src/app/dashboard/simulator/[planId]/components/outputs/drawers/simulation-settings-drawer.tsx'
];

for (const path of files) {
  let code = fs.readFileSync(path, 'utf8');

  // Fix tax-efficient.test.ts (PortfolioProcessor args)
  if (path.includes('tax-efficient.test.ts')) {
    code = code.replace(
      "const processor = new PortfolioProcessor(state, context, rules, undefined, 'taxEfficient', 'marriedFilingJointly');",
      "const processor = new PortfolioProcessor(state, context, rules, undefined, 'taxEfficient', false, 'marriedFilingJointly');"
    );
  }

  // Fix test-utils.ts
  if (path.includes('test-utils.ts')) {
    code = code.replace(
      "simulationSettings: overrides?.simulationSettings ?? { simulationSeed: 12345, simulationMode: 'fixedReturns', withdrawalStrategy: 'proportional' },",
      "simulationSettings: overrides?.simulationSettings ?? { simulationSeed: 12345, simulationMode: 'fixedReturns', acaOptimization: false, withdrawalStrategy: 'proportional' },"
    );
  }

  // Fix stochastic-returns-provider.test.ts
  if (path.includes('stochastic-returns-provider.test.ts')) {
    code = code.replace(
      "simulationSettings: { simulationSeed: 9521, simulationMode: 'fixedReturns', withdrawalStrategy: 'proportional' },",
      "simulationSettings: { simulationSeed: 9521, simulationMode: 'fixedReturns', acaOptimization: false, withdrawalStrategy: 'proportional' },"
    );
  }

  // Fix simulation-engine.test.ts
  if (path.includes('simulation-engine.test.ts')) {
    code = code.replace(
      "simulationSettings: overrides?.simulationSettings ?? { simulationSeed: 12345, simulationMode: 'fixedReturns', withdrawalStrategy: 'proportional' },",
      "simulationSettings: overrides?.simulationSettings ?? { simulationSeed: 12345, simulationMode: 'fixedReturns', acaOptimization: false, withdrawalStrategy: 'proportional' },"
    );
  }

  // Fix drawer
  if (path.includes('simulation-settings-drawer.tsx')) {
    code = code.replace(
      "withdrawalStrategy: 'proportional' }) as const",
      "withdrawalStrategy: 'proportional', acaOptimization: false }) as const"
    );
    
    if (!code.includes('Controller')) {
        code = "import { Controller } from 'react-hook-form';\n" + code;
    }
  }

  fs.writeFileSync(path, code);
}
