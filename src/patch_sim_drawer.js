const fs = require('fs');
const path = '/home/sh38499/git/github/external/ignidash/src/app/dashboard/simulator/[planId]/components/outputs/drawers/simulation-settings-drawer.tsx';
let code = fs.readFileSync(path, 'utf8');

// Add Switch/Checkbox import if needed
if (!code.includes('import { Switch }')) {
  code = code.replace(
    "import { Select } from '@/components/catalyst/select';",
    "import { Select } from '@/components/catalyst/select';\nimport { Switch } from '@/components/catalyst/switch';"
  );
}

// Add Controller from react-hook-form
if (!code.includes('import { Controller }')) {
  code = code.replace(
    "import { useForm } from 'react-hook-form';",
    "import { useForm, Controller } from 'react-hook-form';"
  );
}

// Add the field
if (!code.includes('acaOptimization')) {
  code = code.replace(
    '<Label htmlFor="withdrawalStrategy">Withdrawal Strategy</Label>',
    `<Label htmlFor="acaOptimization" className="flex items-center gap-3">
                      <Controller
                        name="acaOptimization"
                        control={control}
                        render={({ field }) => (
                          <Switch
                            checked={field.value}
                            onChange={field.onChange}
                            color="rose"
                          />
                        )}
                      />
                      Enable ACA & MAGI Optimization
                    </Label>
                    <Description className="mb-4">
                      When enabled, the withdrawal strategy will actively manage your Modified Adjusted Gross Income (MAGI) 
                      to maximize Affordable Care Act (ACA) Premium Tax Credits and minimize lifetime costs.
                      May trigger 72(t) SEPP distributions if under 59.5.
                    </Description>
                    <Label htmlFor="withdrawalStrategy">Withdrawal Strategy</Label>`
  );
}

fs.writeFileSync(path, code);
