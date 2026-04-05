/**
 * Core Logic for Israeli Tax Calculation 
 * Historically accurate mappings for 2019-2025
 * Sources: Israel Tax Authority (gov.il), Kol-Zchut, Deloitte, PwC
 */

// Monthly credit point values (verified against official ITA publications)
const CREDIT_POINT_VALUES: Record<number, number> = {
  2026: 242,
  2025: 242,
  2024: 235,
  2023: 235,
  2022: 223,
  2021: 218,
  2020: 218,  // Fixed: was 219, official value is 218
  2019: 218,
};

// Official annual tax brackets per year (from gov.il / Kol-Zchut)
function getBracketsForYear(year: number) {
  if (year >= 2025) {
    // 2025-2026 brackets (updated per ITA)
    return [
      { limit: 84120, rate: 0.10 },
      { limit: 120720, rate: 0.14 },
      { limit: 193800, rate: 0.20 },
      { limit: 269280, rate: 0.31 },
      { limit: 560280, rate: 0.35 },
      { limit: 721560, rate: 0.47 },
      { limit: Infinity, rate: 0.50 },
    ];
  } else if (year === 2024) {
    return [
      { limit: 79560, rate: 0.10 },
      { limit: 114120, rate: 0.14 },
      { limit: 177360, rate: 0.20 },
      { limit: 247440, rate: 0.31 },
      { limit: 514920, rate: 0.35 },
      { limit: 663240, rate: 0.47 },
      { limit: Infinity, rate: 0.50 },
    ];
  } else if (year === 2023) {
    return [
      { limit: 76440, rate: 0.10 },
      { limit: 109680, rate: 0.14 },
      { limit: 170520, rate: 0.20 },
      { limit: 237840, rate: 0.31 },
      { limit: 495000, rate: 0.35 },
      { limit: 647640, rate: 0.47 },
      { limit: Infinity, rate: 0.50 },
    ];
  } else if (year === 2022) {
    return [
      { limit: 76440, rate: 0.10 },
      { limit: 109680, rate: 0.14 },
      { limit: 170520, rate: 0.20 },
      { limit: 237840, rate: 0.31 },
      { limit: 495000, rate: 0.35 },
      { limit: 647640, rate: 0.47 },
      { limit: Infinity, rate: 0.50 },
    ];
  } else if (year === 2021) {
    return [
      { limit: 75720, rate: 0.10 },
      { limit: 108600, rate: 0.14 },
      { limit: 168840, rate: 0.20 },
      { limit: 235560, rate: 0.31 },
      { limit: 490320, rate: 0.35 },
      { limit: 641280, rate: 0.47 },
      { limit: Infinity, rate: 0.50 },
    ];
  } else if (year === 2020) {
    return [
      { limit: 75480, rate: 0.10 },
      { limit: 108360, rate: 0.14 },
      { limit: 168480, rate: 0.20 },
      { limit: 234960, rate: 0.31 },
      { limit: 489120, rate: 0.35 },
      { limit: 640080, rate: 0.47 },
      { limit: Infinity, rate: 0.50 },
    ];
  } else {
    // 2019
    return [
      { limit: 74640, rate: 0.10 },
      { limit: 107040, rate: 0.14 },
      { limit: 166440, rate: 0.20 },
      { limit: 232080, rate: 0.31 },
      { limit: 482880, rate: 0.35 },
      { limit: 631680, rate: 0.47 },
      { limit: Infinity, rate: 0.50 },
    ];
  }
}

/**
 * Child credit points — fully differentiated by year range, gender, and child's age.
 * Sources: Kol-Zchut, gov.il, BDO, OC-CPA
 */
export function calculateChildPoints(childrenBirthYears: number[], selectedYear: number, gender: "male" | "female"): number {
  let totalChildPoints = 0;

  for (const birthYear of childrenBirthYears) {
    const age = selectedYear - birthYear;
    
    // Ignore children not born yet in the selected tax year
    if (age < 0) continue;
    // Standard cutoff age for points
    if (age > 18) continue; 

    if (selectedYear >= 2024) {
      // Post-2024 reform: expanded points for both parents
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
      // 2022-2023: Hora'at Sha'a expanded 6-12 points to fathers
      if (age === 0) totalChildPoints += (gender === "female") ? 1.5 : 1.0;
      else if (age >= 1 && age <= 5) totalChildPoints += (gender === "female") ? 2.5 : 1.0;
      else if (age >= 6 && age <= 12) {
        totalChildPoints += (gender === "female") ? 2 : 1; 
      } else if (age >= 13 && age <= 17) {
        totalChildPoints += (gender === "female") ? 1 : 0;
      } else if (age === 18) {
        totalChildPoints += (gender === "female") ? 0.5 : 0;
      }
    } else {
      // 2017-2021: fathers get 1 point for children 0-5 (since 2017 amendment)
      if (age === 0) totalChildPoints += (gender === "female") ? 1.5 : 1.0;
      else if (age >= 1 && age <= 5) totalChildPoints += (gender === "female") ? 2.5 : 1.0;
      else if (age >= 6 && age <= 17) {
        totalChildPoints += (gender === "female") ? 1 : 0;
      } else if (age === 18) {
        totalChildPoints += (gender === "female") ? 0.5 : 0;
      }
    }
  }

  return totalChildPoints;
}

// Minimum donation amount to qualify for Section 46 credit (updated per year)
const DONATION_MINIMUM: Record<number, number> = {
  2026: 207, 2025: 207, 2024: 207, 2023: 207, 2022: 207, 2021: 190, 2020: 190, 2019: 190,
};

// Maximum annual life insurance premium eligible for 25% credit
const LIFE_INSURANCE_CEILING = 7000;

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
      breakdown.push(`מדרגה ${bracket.rate * 100}% (עד ₪${bracket.limit === Infinity ? '∞' : bracket.limit.toLocaleString()}): ₪${Math.floor(taxForBracket).toLocaleString()}`);
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

  // Credit points are NOT pro-rata — they apply for the full year regardless of months worked
  const pointsCredit = effectivePoints * pointValueAnnual;
  breakdown.push(`קיזוז נקודות זיכוי אישיות (${effectivePoints.toFixed(2)} × ₪${pointValueAnnual.toLocaleString()}): -₪${Math.floor(pointsCredit).toLocaleString()}`);
  taxOwed = Math.max(0, taxOwed - pointsCredit);

  if (options.peripheryPercent > 0 && options.peripheryCeiling > 0) {
    const peripheryIncomeEligible = Math.min(effectiveIncome, options.peripheryCeiling);
    const peripheryDiscountAmount = peripheryIncomeEligible * (options.peripheryPercent / 100);
    breakdown.push(`הטבת יישוב פריפריה מוטב (${options.peripheryPercent}% עד ₪${options.peripheryCeiling.toLocaleString()}): -₪${Math.floor(peripheryDiscountAmount).toLocaleString()}`);
    taxOwed = Math.max(0, taxOwed - peripheryDiscountAmount);
  }

  if (options.donations > 0) {
    const minDonation = DONATION_MINIMUM[year] || 207;
    if (options.donations >= minDonation) {
      // Cap at 30% of income or ~10.3M (whichever is lower)
      const maxEligible = Math.min(options.donations, effectiveIncome * 0.30, 10354816);
      const donationsCredit = maxEligible * 0.35;
      breakdown.push(`זיכוי סעיף 46 על תרומות (35% מ-₪${Math.floor(maxEligible).toLocaleString()}, מינימום ₪${minDonation}): -₪${Math.floor(donationsCredit).toLocaleString()}`);
      taxOwed = Math.max(0, taxOwed - donationsCredit);
    } else {
      breakdown.push(`תרומות (₪${options.donations}) מתחת למינימום ₪${minDonation} — אינן מזכות בזיכוי.`);
    }
  }

  if (options.lifeInsurance > 0) {
    const cappedInsurance = Math.min(options.lifeInsurance, LIFE_INSURANCE_CEILING);
    const lifeInsuranceCredit = cappedInsurance * 0.25;
    breakdown.push(`זיכוי ביטוח חיים עצמאי (25% מ-₪${cappedInsurance.toLocaleString()}, תקרה ₪${LIFE_INSURANCE_CEILING.toLocaleString()}): -₪${Math.floor(lifeInsuranceCredit).toLocaleString()}`);
    taxOwed = Math.max(0, taxOwed - lifeInsuranceCredit);
  }

  breakdown.push(`מס מחויב סופי לתשלום: ₪${Math.floor(taxOwed).toLocaleString()}`);
  breakdown.push(`מס ששולם בפועל ע"י המעסיק: ₪${taxPaid.toLocaleString()}`);

  const anticipatedRefund = taxPaid - taxOwed;
  
  if (anticipatedRefund >= 0) {
    breakdown.push(`תחשיב שורת תחתית: שולם (₪${taxPaid.toLocaleString()}) פחות חובה (₪${Math.floor(taxOwed).toLocaleString()}) = החזר ₪${Math.floor(anticipatedRefund).toLocaleString()}`);
  } else {
    breakdown.push(`⚠️ שימו לב: שולם (₪${taxPaid.toLocaleString()}) פחות חובה (₪${Math.floor(taxOwed).toLocaleString()}) = חוב של ₪${Math.floor(Math.abs(anticipatedRefund)).toLocaleString()}. ייתכן שתידרשו לתשלום נוסף.`);
  }

  return {
    grossIncome: income,
    taxPaid: taxPaid,
    taxOwed: taxOwed,
    anticipatedRefund: anticipatedRefund, // Can now be negative to indicate underpayment
    breakdown,
  };
}
