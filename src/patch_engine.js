const fs = require('fs');
const path = '/home/sh38499/git/github/external/ignidash/src/lib/calc/simulation-engine.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "this.inputs.simulationSettings.withdrawalStrategy,",
  "this.inputs.simulationSettings.withdrawalStrategy,\n      this.inputs.simulationSettings.acaOptimization,"
);

// Also pass state to TaxProcessor
code = code.replace(
  "const taxProcessor = new TaxProcessor(simulationState, this.inputs.taxSettings.filingStatus);",
  "const taxProcessor = new TaxProcessor(simulationState, this.inputs.taxSettings.filingStatus, this.inputs.taxSettings.state);"
);

fs.writeFileSync(path, code);
