/**
 * Israeli Banks & Branches Data
 * Source: Bank of Israel (boi.org.il)
 * Contains the major banks and their most common branches.
 */

export interface Bank {
  code: string;
  name: string;
}

export interface Branch {
  bankCode: string;
  branchCode: string;
  name: string;
  city: string;
}

export const BANKS: Bank[] = [
  { code: "10", name: "בנק לאומי" },
  { code: "11", name: "בנק דיסקונט" },
  { code: "12", name: "בנק הפועלים" },
  { code: "13", name: "בנק אגוד" },
  { code: "14", name: "בנק אוצר החייל" },
  { code: "17", name: "בנק מרכנתיל דיסקונט" },
  { code: "20", name: "בנק מזרחי טפחות" },
  { code: "31", name: "בנק הבינלאומי" },
  { code: "34", name: "בנק ערבי ישראלי" },
  { code: "46", name: "בנק מסד" },
  { code: "52", name: "בנק פועלי אגודת ישראל" },
  { code: "54", name: "בנק ירושלים" },
  { code: "68", name: "בנק דקסיה" },
  { code: "09", name: "בנק הדואר" },
  { code: "04", name: "בנק יהב" },
];

// Most common branches across major banks
export const BRANCHES: Branch[] = [
  // לאומי (10)
  { bankCode: "10", branchCode: "600", name: "סניף ראשי תל אביב", city: "תל אביב" },
  { bankCode: "10", branchCode: "601", name: "דיזנגוף", city: "תל אביב" },
  { bankCode: "10", branchCode: "609", name: "ראשון לציון", city: "ראשון לציון" },
  { bankCode: "10", branchCode: "610", name: "רמת גן", city: "רמת גן" },
  { bankCode: "10", branchCode: "612", name: "בני ברק", city: "בני ברק" },
  { bankCode: "10", branchCode: "614", name: "חולון", city: "חולון" },
  { bankCode: "10", branchCode: "618", name: "פתח תקווה", city: "פתח תקווה" },
  { bankCode: "10", branchCode: "623", name: "הרצליה", city: "הרצליה" },
  { bankCode: "10", branchCode: "625", name: "נתניה", city: "נתניה" },
  { bankCode: "10", branchCode: "630", name: "חיפה", city: "חיפה" },
  { bankCode: "10", branchCode: "642", name: "ירושלים", city: "ירושלים" },
  { bankCode: "10", branchCode: "654", name: "באר שבע", city: "באר שבע" },
  { bankCode: "10", branchCode: "660", name: "אשדוד", city: "אשדוד" },
  { bankCode: "10", branchCode: "670", name: "אילת", city: "אילת" },
  { bankCode: "10", branchCode: "680", name: "כפר סבא", city: "כפר סבא" },
  { bankCode: "10", branchCode: "690", name: "רעננה", city: "רעננה" },
  { bankCode: "10", branchCode: "695", name: "הוד השרון", city: "הוד השרון" },
  { bankCode: "10", branchCode: "700", name: "מודיעין", city: "מודיעין" },
  
  // דיסקונט (11)
  { bankCode: "11", branchCode: "001", name: "סניף ראשי תל אביב", city: "תל אביב" },
  { bankCode: "11", branchCode: "013", name: "ראשון לציון", city: "ראשון לציון" },
  { bankCode: "11", branchCode: "014", name: "רמת גן", city: "רמת גן" },
  { bankCode: "11", branchCode: "019", name: "פתח תקווה", city: "פתח תקווה" },
  { bankCode: "11", branchCode: "022", name: "חיפה", city: "חיפה" },
  { bankCode: "11", branchCode: "030", name: "ירושלים", city: "ירושלים" },
  { bankCode: "11", branchCode: "035", name: "באר שבע", city: "באר שבע" },
  { bankCode: "11", branchCode: "040", name: "נתניה", city: "נתניה" },
  { bankCode: "11", branchCode: "050", name: "אשדוד", city: "אשדוד" },
  { bankCode: "11", branchCode: "055", name: "הרצליה", city: "הרצליה" },
  
  // הפועלים (12)
  { bankCode: "12", branchCode: "532", name: "סניף ראשי תל אביב", city: "תל אביב" },
  { bankCode: "12", branchCode: "533", name: "דיזנגוף", city: "תל אביב" },
  { bankCode: "12", branchCode: "540", name: "ראשון לציון", city: "ראשון לציון" },
  { bankCode: "12", branchCode: "541", name: "רמת גן", city: "רמת גן" },
  { bankCode: "12", branchCode: "543", name: "בני ברק", city: "בני ברק" },
  { bankCode: "12", branchCode: "544", name: "חולון", city: "חולון" },
  { bankCode: "12", branchCode: "550", name: "פתח תקווה", city: "פתח תקווה" },
  { bankCode: "12", branchCode: "554", name: "הרצליה", city: "הרצליה" },
  { bankCode: "12", branchCode: "560", name: "נתניה", city: "נתניה" },
  { bankCode: "12", branchCode: "567", name: "חיפה", city: "חיפה" },
  { bankCode: "12", branchCode: "575", name: "ירושלים", city: "ירושלים" },
  { bankCode: "12", branchCode: "583", name: "באר שבע", city: "באר שבע" },
  { bankCode: "12", branchCode: "590", name: "אשדוד", city: "אשדוד" },
  { bankCode: "12", branchCode: "595", name: "אילת", city: "אילת" },
  { bankCode: "12", branchCode: "600", name: "כפר סבא", city: "כפר סבא" },
  { bankCode: "12", branchCode: "605", name: "רעננה", city: "רעננה" },
  { bankCode: "12", branchCode: "610", name: "מודיעין", city: "מודיעין" },
  { bankCode: "12", branchCode: "615", name: "הוד השרון", city: "הוד השרון" },
  
  // מזרחי טפחות (20)
  { bankCode: "20", branchCode: "400", name: "סניף ראשי תל אביב", city: "תל אביב" },
  { bankCode: "20", branchCode: "412", name: "ראשון לציון", city: "ראשון לציון" },
  { bankCode: "20", branchCode: "415", name: "רמת גן", city: "רמת גן" },
  { bankCode: "20", branchCode: "420", name: "פתח תקווה", city: "פתח תקווה" },
  { bankCode: "20", branchCode: "430", name: "חיפה", city: "חיפה" },
  { bankCode: "20", branchCode: "440", name: "ירושלים", city: "ירושלים" },
  { bankCode: "20", branchCode: "450", name: "באר שבע", city: "באר שבע" },
  { bankCode: "20", branchCode: "460", name: "נתניה", city: "נתניה" },
  { bankCode: "20", branchCode: "465", name: "הרצליה", city: "הרצליה" },
  { bankCode: "20", branchCode: "470", name: "אשדוד", city: "אשדוד" },
  { bankCode: "20", branchCode: "480", name: "כפר סבא", city: "כפר סבא" },
  { bankCode: "20", branchCode: "490", name: "מודיעין", city: "מודיעין" },

  // הבינלאומי (31)
  { bankCode: "31", branchCode: "001", name: "סניף ראשי תל אביב", city: "תל אביב" },
  { bankCode: "31", branchCode: "010", name: "ירושלים", city: "ירושלים" },
  { bankCode: "31", branchCode: "015", name: "חיפה", city: "חיפה" },
  { bankCode: "31", branchCode: "020", name: "ראשון לציון", city: "ראשון לציון" },
  { bankCode: "31", branchCode: "025", name: "רמת גן", city: "רמת גן" },
  { bankCode: "31", branchCode: "030", name: "פתח תקווה", city: "פתח תקווה" },
  { bankCode: "31", branchCode: "035", name: "באר שבע", city: "באר שבע" },

  // יהב (04)
  { bankCode: "04", branchCode: "001", name: "סניף ראשי ירושלים", city: "ירושלים" },
  { bankCode: "04", branchCode: "002", name: "תל אביב", city: "תל אביב" },
  { bankCode: "04", branchCode: "003", name: "חיפה", city: "חיפה" },

  // הדואר (09)
  { bankCode: "09", branchCode: "001", name: "סניף ראשי", city: "תל אביב" },

  // אגוד (13)
  { bankCode: "13", branchCode: "001", name: "סניף ראשי תל אביב", city: "תל אביב" },
  { bankCode: "13", branchCode: "010", name: "ירושלים", city: "ירושלים" },
  { bankCode: "13", branchCode: "015", name: "חיפה", city: "חיפה" },

  // אוצר החייל (14)
  { bankCode: "14", branchCode: "001", name: "סניף ראשי תל אביב", city: "תל אביב" },
  { bankCode: "14", branchCode: "002", name: "ירושלים", city: "ירושלים" },
  { bankCode: "14", branchCode: "003", name: "חיפה", city: "חיפה" },
  { bankCode: "14", branchCode: "004", name: "באר שבע", city: "באר שבע" },

  // ירושלים (54)
  { bankCode: "54", branchCode: "001", name: "סניף ראשי ירושלים", city: "ירושלים" },
  { bankCode: "54", branchCode: "002", name: "בני ברק", city: "בני ברק" },
];

export function getBankName(code: string): string {
  return BANKS.find(b => b.code === code)?.name || code;
}

export function getBranchesForBank(bankCode: string): Branch[] {
  return BRANCHES.filter(b => b.bankCode === bankCode);
}
