/**
 * Core Logic for Israeli Tax Calculation 
 * Historically accurate mappings for 2019-2025
 */

const CREDIT_POINT_VALUES: Record<number, number> = {
  2026: 242,
  2025: 242,
  2024: 235,
  2023: 235,
  2022: 223,
  2021: 218,
  2020: 219,
  2019: 218,
};

// Approximated historical tax brackets
function getBracketsForYear(year: number) {
  if (year >= 2024) {
    return [
      { limit: 84000, rate: 0.10 },
      { limit: 120000, rate: 0.14 },
      { limit: 192000, rate: 0.20 },
      { limit: 264000, rate: 0.31 },
      { limit: 552000, rate: 0.35 },
      { limit: Infinity, rate: 0.47 },
    ];
  } else if (year >= 2022) {
    return [
      { limit: 81480, rate: 0.10 },
      { limit: 116760, rate: 0.14 },
      { limit: 187440, rate: 0.20 },
      { limit: 260520, rate: 0.31 },
      { limit: 542160, rate: 0.35 },
      { limit: Infinity, rate: 0.47 },
    ];
  } else {
    // 2019-2021
    return [
      { limit: 75960, rate: 0.10 },
      { limit: 108960, rate: 0.14 },
      { limit: 173880, rate: 0.20 },
      { limit: 241680, rate: 0.31 },
      { limit: 501960, rate: 0.35 },
      { limit: Infinity, rate: 0.47 },
    ];
  }
}

export function calculateChildPoints(childrenBirthYears: number[], selectedYear: number, gender: "male" | "female"): number {
  let totalChildPoints = 0;

  for (const birthYear of childrenBirthYears) {
    const age = selectedYear - birthYear;
    
    // Ignore children not born yet in the selected tax year
    if (age < 0) continue;
    // Standard cutoff age for points
    if (age > 18) continue; 

    if (selectedYear >= 2024) {
       if (age === 0) totalChildPoints += (gender === "female") ? 2.5 : 1.0;
       else if (age === 1 || age === 2) totalChildPoints += (gender === "female") ? 4.5 : 2.0;
       else if (age === 3) totalChildPoints += (gender === "female") ? 3.5 : 2.0;
       else if (age === 4 || age === 5) totalChildPoints += (gender === "female") ? 2.5 : 1.0;
       else if (age >= 6 && age <= 17) {
         totalChildPoints += (gender === "female") ? 2 : 1;
       } else if (age === 18) {
         totalChildPoints += (gender === "female") ? 0.5 : 0;
       }
    } else if (selectedYear === 2022 || selectedYear === 2023) {
       if (age === 0) totalChildPoints += (gender === "female") ? 1.5 : 0;
       else if (age >= 1 && age <= 5) totalChildPoints += (gender === "female") ? 2.5 : 1.0;
       else if (age >= 6 && age <= 12) {
         totalChildPoints += (gender === "female") ? 2 : 1; 
       } else if (age >= 13 && age <= 17) {
         totalChildPoints += (gender === "female") ? 1 : 0;
       } else if (age === 18) {
         totalChildPoints += (gender === "female") ? 0.5 : 0;
       }
    } else {
       if (age === 0) totalChildPoints += (gender === "female") ? 1.5 : 0;
       else if (age >= 1 && age <= 5) totalChildPoints += (gender === "female") ? 2.5 : 0;
       else if (age >= 6 && age <= 17) {
         totalChildPoints += (gender === "female") ? 1 : 0;
       } else if (age === 18) {
         totalChildPoints += (gender === "female") ? 0.5 : 0;
       }
    }
  }

  return totalChildPoints;
}

interface TaxOptions {
  donations: number;
  lifeInsurance: number;
  peripheryPercent: number;
  peripheryCeiling: number;
  maternityAllowance?: number;
  deferredPoint?: boolean;
}

export function calculateTaxRefund(
  income: number, 
  taxPaid: number, 
  monthsWorked: number = 12, 
  userPoints: number = 2.25, 
  year: number = new Date().getFullYear(),
  options: TaxOptions = { donations: 0, lifeInsurance: 0, peripheryPercent: 0, peripheryCeiling: 0, maternityAllowance: 0, deferredPoint: false }
) {
  let effectiveIncome = income + (options.maternityAllowance || 0);
  let effectivePoints = userPoints - (options.deferredPoint ? 1 : 0);

  let taxOwed = 0;
  let remainingIncome = effectiveIncome;
  let previousLimit = 0;
  let breakdown: string[] = [];
  
  const brackets = getBracketsForYear(year);
  const pointValueAnnual = (CREDIT_POINT_VALUES[year] || 242) * 12;

  if (options.maternityAllowance && options.maternityAllowance > 0) {
    breakdown.push(`הכנסה ברוטו ממדרגות שכר: ₪${income.toLocaleString()}`);
    breakdown.push(`הכנסה מדמי לידה (ביטוח לאומי): ₪${options.maternityAllowance.toLocaleString()}`);
    breakdown.push(`סה"כ הכנסה שנתית לחישוב: ₪${effectiveIncome.toLocaleString()}`);
  } else {
    breakdown.push(`הכנסה שנתית ברוטו: ₪${income.toLocaleString()}`);
  }
  
  breakdown.push(`שנת מס מחושבת: ${year}`);
  if (options.deferredPoint) {
    breakdown.push(`דחיית נקודת זיכוי אחת לשנת המס הבאה (לפי טופס 116ד'): הופחתה נקודה אחת מהחישוב הנוכחי.`);
  }

  for (const bracket of brackets) {
    const bracketSize = bracket.limit - previousLimit;
    if (remainingIncome > bracketSize) {
      const taxForBracket = bracketSize * bracket.rate;
      taxOwed += taxForBracket;
      breakdown.push(`מדרגה ${bracket.rate * 100}% (עד ₪${bracket.limit.toLocaleString()}): ₪${Math.floor(taxForBracket).toLocaleString()}`);
      remainingIncome -= bracketSize;
    } else {
      if (remainingIncome > 0) {
        const taxForBracket = remainingIncome * bracket.rate;
        taxOwed += taxForBracket;
        breakdown.push(`מדרגה ${bracket.rate * 100}% (על היתרה ₪${Math.floor(remainingIncome).toLocaleString()}): ₪${Math.floor(taxForBracket).toLocaleString()}`);
      }
      break;
    }
    previousLimit = bracket.limit;
  }

  breakdown.push(`סה"כ מס תיאורטי לפני הנחות: ₪${Math.floor(taxOwed).toLocaleString()}`);

  const pointsCredit = effectivePoints * pointValueAnnual * (monthsWorked / 12);
  breakdown.push(`קיזוז נקודות זיכוי אישיות (${effectivePoints.toFixed(2)}): -₪${Math.floor(pointsCredit).toLocaleString()}`);
  taxOwed = Math.max(0, taxOwed - pointsCredit);

  if (options.peripheryPercent > 0 && options.peripheryCeiling > 0) {
    const peripheryIncomeEligible = Math.min(effectiveIncome, options.peripheryCeiling);
    const peripheryDiscountAmount = peripheryIncomeEligible * (options.peripheryPercent / 100);
    breakdown.push(`הטבת יישוב פריפריה מוטב (${options.peripheryPercent}% עד ₪${options.peripheryCeiling.toLocaleString()}): -₪${Math.floor(peripheryDiscountAmount).toLocaleString()}`);
    taxOwed = Math.max(0, taxOwed - peripheryDiscountAmount);
  }

  if (options.donations > 0) {
    const donationsCredit = options.donations * 0.35;
    breakdown.push(`זיכוי סעיף 46 על תרומות (35% מ-₪${options.donations}): -₪${Math.floor(donationsCredit).toLocaleString()}`);
    taxOwed = Math.max(0, taxOwed - donationsCredit);
  }

  if (options.lifeInsurance > 0) {
    const lifeInsuranceCredit = options.lifeInsurance * 0.25;
    breakdown.push(`זיכוי פנסיון/ביטוח חיים עצמאי (25% מ-₪${options.lifeInsurance}): -₪${Math.floor(lifeInsuranceCredit).toLocaleString()}`);
    taxOwed = Math.max(0, taxOwed - lifeInsuranceCredit);
  }

  breakdown.push(`מס מחויב סופי לתשלום: ₪${Math.floor(taxOwed).toLocaleString()}`);
  breakdown.push(`מס ששולם בפועל ע"י המעסיק: ₪${taxPaid.toLocaleString()}`);

  const anticipatedRefund = taxPaid - taxOwed;
  breakdown.push(`תחשיב שורת תחתית: שולם (₪${taxPaid.toLocaleString()}) פחות חובה (₪${Math.floor(taxOwed).toLocaleString()})`);

  return {
    grossIncome: income,
    taxPaid: taxPaid,
    taxOwed: taxOwed,
    anticipatedRefund: Math.max(0, anticipatedRefund),
    breakdown,
  };
}
