'use client';

import { ConvexError } from 'convex/values';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useController } from 'react-hook-form';
import { useEffect, useMemo, useState, useRef } from 'react';
import posthog from 'posthog-js';

import { taxSettingsToConvex } from '@/lib/utils/data-transformers';
import { type TaxSettingsInputs, taxSettingsFormSchema } from '@/lib/schemas/inputs/tax-settings-form-schema';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import Card from '@/components/ui/card';
import { Field, FieldGroup, Fieldset, Label, Description, ErrorMessage } from '@/components/catalyst/fieldset';
import ErrorMessageCard from '@/components/ui/error-message-card';
import { Select } from '@/components/catalyst/select';
import { Input } from '@/components/catalyst/input';
import { STATE_TAX_DATA, STATE_NAMES } from '@/lib/calc/tax-data/state-tax-brackets';
import { Divider } from '@/components/catalyst/divider';
import NumberInput from '@/components/ui/number-input';
import { Button } from '@/components/catalyst/button';
import { DialogActions } from '@/components/catalyst/dialog';
import { useSelectedPlanId } from '@/hooks/use-selected-plan-id';

interface TaxSettingsDrawerProps {
  setOpen: (open: boolean) => void;
  taxSettings: TaxSettingsInputs | null;
}

/** All state options sorted alphabetically by name, with DC included */
const STATE_OPTIONS = [
  { code: '', label: 'None (Federal Only)' },
  ...Object.keys(STATE_TAX_DATA)
    .sort((a, b) => (STATE_NAMES[a] ?? a).localeCompare(STATE_NAMES[b] ?? b))
    .map((code) => ({ code, label: `${STATE_NAMES[code] ?? code} (${code})` })),
];

/** Inline searchable state combobox — native inputs only, no extra deps */
function StateCombobox({
  value,
  onChange,
  error,
}: {
  value: string | undefined;
  onChange: (v: string) => void;
  error?: string;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered =
    query.trim() === ''
      ? STATE_OPTIONS
      : STATE_OPTIONS.filter((s) => s.label.toLowerCase().includes(query.toLowerCase()));

  const currentLabel = STATE_OPTIONS.find((s) => s.code === (value ?? ''))?.label ?? 'None (Federal Only)';

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {open ? (
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type to filter states…"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false);
              setQuery('');
            }
            if (e.key === 'Enter' && filtered.length > 0) {
              onChange(filtered[0].code);
              setOpen(false);
              setQuery('');
            }
          }}
          aria-invalid={!!error}
          invalid={!!error}
        />
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full text-left rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 shadow-sm hover:border-zinc-400 dark:hover:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
          aria-haspopup="listbox"
        >
          {currentLabel}
        </button>
      )}

      {open && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg text-sm"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-zinc-400">No states match</li>
          ) : (
            filtered.map((opt) => (
              <li
                key={opt.code}
                role="option"
                aria-selected={opt.code === (value ?? '')}
                className={`cursor-pointer px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                  opt.code === (value ?? '') ? 'font-semibold text-rose-600 dark:text-rose-400' : ''
                }`}
                onMouseDown={() => {
                  onChange(opt.code);
                  setOpen(false);
                  setQuery('');
                }}
              >
                {opt.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export default function TaxSettingsDrawer({ setOpen, taxSettings }: TaxSettingsDrawerProps) {
  const planId = useSelectedPlanId();

  const taxSettingsDefaultValues = useMemo(() => ({ filingStatus: 'single' }) as const satisfies TaxSettingsInputs, []);
  const defaultValues = taxSettings || taxSettingsDefaultValues;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(taxSettingsFormSchema),
    defaultValues,
  });

  const {
    field: { value: stateValue, onChange: stateOnChange },
  } = useController({ name: 'state', control });

  useEffect(() => {
    if (taxSettings) reset(taxSettings);
  }, [taxSettings, reset]);

  const m = useMutation(api.tax_settings.update);
  const [saveError, setSaveError] = useState<string | null>(null);

  const onSubmit = async (data: TaxSettingsInputs) => {
    try {
      setSaveError(null);
      posthog.capture('save_tax_settings', { plan_id: planId });
      await m({ taxSettings: taxSettingsToConvex(data), planId });
      setOpen(false);
    } catch (error) {
      setSaveError(error instanceof ConvexError ? error.message : 'Failed to save tax settings.');
      console.error('Error saving tax settings: ', error);
    }
  };

  return (
    <>
      <SectionContainer showBottomBorder={false} location="drawer">
        <SectionHeader title="Tax Settings" desc="Manage settings that affect your tax calculations." />
        <Card>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Fieldset aria-label="Tax settings details">
              <FieldGroup>
                {saveError && <ErrorMessageCard errorMessage={saveError} />}
                <Field>
                  <Label htmlFor="filingStatus">Filing Status</Label>
                  <Select {...register('filingStatus')} id="filingStatus" name="filingStatus">
                    <option value="single">Single</option>
                    <option value="marriedFilingJointly">Married Filing Jointly</option>
                    <option value="headOfHousehold">Head of Household</option>
                  </Select>
                  {errors.filingStatus && <ErrorMessage>{errors.filingStatus?.message}</ErrorMessage>}
                  <Description>Your filing status determines your tax rates and standard deduction.</Description>
                </Field>
                <Divider />
                <Field>
                  <Label htmlFor="state">State of Residence</Label>
                  <StateCombobox
                    value={stateValue}
                    onChange={stateOnChange}
                    error={errors.state?.message}
                  />
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
                <Divider />
              </FieldGroup>
            </Fieldset>
            <DialogActions>
              <Button outline onClick={() => reset()}>
                Reset
              </Button>
              <Button color="rose" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </DialogActions>
          </form>
        </Card>
      </SectionContainer>
    </>
  );
}
