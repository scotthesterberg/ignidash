const fs = require('fs');
const path = '/home/sh38499/git/github/external/ignidash/src/app/dashboard/simulator/[planId]/components/inputs/drawers/tax-settings-drawer.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add STATE_TAX_DATA import
if (!code.includes('STATE_TAX_DATA')) {
  code = code.replace(
    "import { Select } from '@/components/catalyst/select';",
    "import { Select } from '@/components/catalyst/select';\nimport { STATE_TAX_DATA } from '@/lib/calc/tax-data/state-tax-brackets';"
  );
}

// 2. Add NumberInput import
if (!code.includes('NumberInput')) {
  code = code.replace(
    "import { Divider } from '@/components/catalyst/divider';",
    "import { Divider } from '@/components/catalyst/divider';\nimport NumberInput from '@/components/ui/number-input';"
  );
}

// 3. Add to the form
if (!code.includes('id="state"')) {
  code = code.replace(
    '<Divider />',
    `<Divider />
                <Field>
                  <Label htmlFor="state">State of Residence</Label>
                  <Select {...register('state')} id="state" name="state">
                    <option value="">None (Federal Only)</option>
                    {Object.keys(STATE_TAX_DATA).map((stateCode) => (
                      <option key={stateCode} value={stateCode}>
                        {stateCode}
                      </option>
                    ))}
                  </Select>
                  {errors.state && <ErrorMessage>{errors.state?.message}</ErrorMessage>}
                  <Description>Used to estimate state income and capital gains taxes.</Description>
                </Field>
                <Divider />
                <Field>
                  <Label htmlFor="householdSize">Household Size</Label>
                  <NumberInput
                    name="householdSize"
                    control={control}
                    id="householdSize"
                    inputMode="numeric"
                    placeholder="1"
                    decimalScale={0}
                    step={1}
                    min={1}
                    max={15}
                    disableThousandsSeparator
                  />
                  {errors.householdSize && <ErrorMessage>{errors.householdSize?.message}</ErrorMessage>}
                  <Description>Used for ACA Premium Tax Credit (subsidy) calculations.</Description>
                </Field>
                <Divider />`
  );
}

// 4. Update useForm to include control
if (!code.includes('control,')) {
  code = code.replace(
    'register,',
    'register,\n    control,'
  );
}

fs.writeFileSync(path, code);
