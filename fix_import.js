const fs = require('fs');
const path = '/home/sh38499/git/github/external/ignidash/src/app/dashboard/simulator/[planId]/components/outputs/drawers/simulation-settings-drawer.tsx';
let code = fs.readFileSync(path, 'utf8');

if (code.startsWith("import { Controller }")) {
  code = code.replace("import { Controller } from 'react-hook-form';\n", "");
}
if (!code.includes('import { useForm, Controller }')) {
  code = code.replace("import { useForm, useWatch } from 'react-hook-form';", "import { useForm, useWatch, Controller } from 'react-hook-form';");
}

fs.writeFileSync(path, code);
