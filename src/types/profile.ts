export interface BankInfo {
    id: number;
    name: string;
    code: string;
    bin: string;
    shortName: string;
    logo: string;
    transferSupported: number;
    lookupSupported: number;
}

export interface UpdateProfilePayload {
    business_name?: string;
    tax_code?: string;
    bank_name?: string;
    bank_number?: string;
    account_name?: string;
    password?: string;
  }
