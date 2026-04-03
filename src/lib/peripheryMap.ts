export interface PeripheryBenefit {
  percent: number;
  ceiling: number;
}

/**
 * A core baseline dictionary of Israeli Favored Settlements (יישובי חוק עזר / פריפריה)
 * for 2024 approximated percentages and ceilings.
 * 
 * Ceilings mapped linearly to average Section 11 benefits.
 */
const SETTLEMENTS: Record<string, PeripheryBenefit> = {
  "עכו": { percent: 12, ceiling: 241080 },
  "נהריה": { percent: 12, ceiling: 241080 },
  "כרמיאל": { percent: 7, ceiling: 180000 },
  "קרית שמונה": { percent: 20, ceiling: 282480 },
  "קריית שמונה": { percent: 20, ceiling: 282480 },
  "שדרות": { percent: 20, ceiling: 282480 },
  "נתיבות": { percent: 16, ceiling: 241080 },
  "אילת": { percent: 10, ceiling: 282480 },
  "חצור הגלילית": { percent: 20, ceiling: 282480 },
  "צפת": { percent: 12, ceiling: 241080 },
  "קצרין": { percent: 11, ceiling: 190000 },
  "שלומי": { percent: 20, ceiling: 282480 },
  "אופקים": { percent: 18, ceiling: 250000 },
  "בית שאן": { percent: 12, ceiling: 241080 },
  "דימונה": { percent: 16, ceiling: 241080 },
  "ירוחם": { percent: 18, ceiling: 250000 },
  "מצפה רמון": { percent: 20, ceiling: 282480 },
  "ערד": { percent: 16, ceiling: 241080 },
  "מעלות משיחא": { percent: 11, ceiling: 200000 },
  "מעלות תרשיחא": { percent: 11, ceiling: 200000 },
  "מגדל העמק": { percent: 12, ceiling: 241080 },
  "טבריה": { percent: 12, ceiling: 241080 },
  "כפר ורדים": { percent: 11, ceiling: 200000 },
  "נחף": { percent: 12, ceiling: 241080 },
  "ראמה": { percent: 12, ceiling: 241080 },
  "רמת הגולן": { percent: 11, ceiling: 190000 }
};

export function getPeripheryBenefitByCity(cityName: string): PeripheryBenefit | null {
  if (!cityName) return null;
  const cleanName = cityName.trim().replace(/"/g, "").replace(/'/g, "");
  
  // Direct match
  if (SETTLEMENTS[cleanName]) {
    return SETTLEMENTS[cleanName];
  }

  // Partial match fallback (e.g. if city name was "קרית-שמונה")
  for (const [key, benefit] of Object.entries(SETTLEMENTS)) {
    if (cleanName.includes(key) || key.includes(cleanName)) {
      return benefit;
    }
  }

  return null;
}
