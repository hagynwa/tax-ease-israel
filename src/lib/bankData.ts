import fullData from "./banks_full.json";

/**
 * Israeli Banks & Branches Data
 * Source: Bank of Israel (boi.org.il)
 * Contains the comprehensive list of banks and their branches.
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

export const BANKS: Bank[] = fullData.banks;
export const BRANCHES: Branch[] = fullData.branches;

export function getBankName(code: string): string {
  return BANKS.find(b => b.code === code)?.name || code;
}

export function getBranchesForBank(bankCode: string): Branch[] {
  return BRANCHES.filter(b => b.bankCode === bankCode);
}
