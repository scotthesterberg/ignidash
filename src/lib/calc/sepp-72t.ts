export function calculate72tDistribution(
  accountBalance: number,
  age: number,
  interestRate: number
): number {
  // IRS Single Life Expectancy (simplified snippet for ages 45-60)
  const singleLifeExpectancy: Record<number, number> = {
    45: 41.0, 46: 40.0, 47: 39.0, 48: 38.1, 49: 37.1,
    50: 36.2, 51: 35.3, 52: 34.3, 53: 33.4, 54: 32.5,
    55: 31.6, 56: 30.6, 57: 29.8, 58: 28.9, 59: 28.0, 60: 27.1
  };
  
  // fallback to age 60 if not found
  const lifeExpectancy = singleLifeExpectancy[Math.floor(age)] || 27.1;
  
  // Amortization method formula
  const numerator = accountBalance * interestRate;
  const denominator = 1 - Math.pow(1 + interestRate, -lifeExpectancy);
  
  return numerator / denominator;
}
