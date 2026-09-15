export function calculateAcaPremiumTaxCredit(
  magi: number,
  householdSize: number,
  benchmarkPlanCost: number
): number {
  const ACA_FPL_BASE = 15060;
  const ACA_FPL_PER_PERSON = 5380;
  const povertyLevel = ACA_FPL_BASE + ACA_FPL_PER_PERSON * (householdSize - 1);
  const fplPercentage = (magi / povertyLevel) * 100;

  let expectedContributionPercentage = 0;
  if (fplPercentage < 150) {
    expectedContributionPercentage = 0;
  } else if (fplPercentage <= 200) {
    expectedContributionPercentage = 0 + (fplPercentage - 150) * (0.02 / 50);
  } else if (fplPercentage <= 250) {
    expectedContributionPercentage = 0.02 + (fplPercentage - 200) * (0.02 / 50);
  } else if (fplPercentage <= 300) {
    expectedContributionPercentage = 0.04 + (fplPercentage - 250) * (0.02 / 50);
  } else if (fplPercentage <= 400) {
    expectedContributionPercentage = 0.06 + (fplPercentage - 300) * (0.025 / 100);
  } else {
    expectedContributionPercentage = 0.085;
  }

  const maxOutOfPocket = magi * expectedContributionPercentage;
  return Math.max(0, benchmarkPlanCost - maxOutOfPocket);
}
