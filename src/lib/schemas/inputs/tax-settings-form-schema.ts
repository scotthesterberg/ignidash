import { z } from 'zod';

const filingStatus = z.enum(['single', 'marriedFilingJointly', 'headOfHousehold']);

export type FilingStatus = z.infer<typeof filingStatus>;

export const taxSettingsFormSchema = z.object({
  filingStatus,
  state: z.string().optional(),
  householdSize: z.preprocess(
    (val) => (val === '' || val === null ? undefined : Number(val)),
    z.number().int().positive().optional()
  ),
});

export type TaxSettingsInputs = z.infer<typeof taxSettingsFormSchema>;
