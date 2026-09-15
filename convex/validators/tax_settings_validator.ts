import { v } from 'convex/values';

export const taxSettingsValidator = v.object({
  filingStatus: v.union(v.literal('single'), v.literal('marriedFilingJointly'), v.literal('headOfHousehold')),
  state: v.optional(v.string()),
  householdSize: v.optional(v.number()),
});
