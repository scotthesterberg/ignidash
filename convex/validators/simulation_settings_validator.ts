import { v } from 'convex/values';

export const simulationSettingsValidator = v.object({
  simulationSeed: v.number(),
  simulationMode: v.union(
    v.literal('fixedReturns'),
    v.literal('stochasticReturns'),
    v.literal('historicalReturns'),
    v.literal('monteCarloStochasticReturns'),
    v.literal('monteCarloHistoricalReturns')
  ),
  acaOptimization: v.optional(v.boolean()),
  withdrawalStrategy: v.optional(v.union(v.literal('proportional'), v.literal('taxEfficient'))),
  historicalStartYearOverride: v.optional(v.number()),
  historicalRetirementStartYearOverride: v.optional(v.number()),
});
