import { BankInfo } from '@/types/profile';

// Common bank mappings for QR code generation
const BANK_CODE_MAP: Record<string, string> = {
  'Vietcombank': '970436',
  'VietinBank': '970415', 
  'BIDV': '970418',
  'Agribank': '970405',
  'Techcombank': '970407',
  'MB Bank': '970422',
  'VPBank': '970432',
  'TPBank': '970423',
  'ACB': '970416',
  'Sacombank': '970403',
  'Eximbank': '970431',
  'HDBank': '970437',
  'OCB': '970448',
  'MSB': '970426',
  'VIB': '970441',
  'SHB': '970443',
  'NCB': '970419',
  'SCB': '970429',
  'DongA Bank': '970406',
  'ABBank': '970425',
  'PGBank': '970430',
  'Nam A Bank': '970428',
  'VietABank': '970427',
  'Bac A Bank': '970409',
  'Kienlongbank': '970452',
  'PVcomBank': '970412',
  'PublicBank': '970439',
  'VietBank': '970433',
  'BanVietBank': '970454',
  'SeABank': '970440',
  'VietCapitalBank': '970436',
  'LienVietPostBank': '970449',
  'TienPhongBank': '970423',
  'SaigonBank': '970400',
  'BaoVietBank': '970438',
  'AnBinhBank': '970425',
  'HongLeongBank': '970442',
  'ShinhanBank': '970424',
  'WooriBank': '970457',
  'UOB': '970458',
  'StandardChartered': '970410',
  'Citibank': '970414',
  'HSBC': '970421',
  'ANZ': '970403',
  'DeutscheBank': '970406',
  'BankofChina': '970407',
  'ICBC': '970408',
  'MizuhoBank': '970409',
  'SumitomoBank': '970410',
  'MUFG': '970411',
  'SMBC': '970412',
  'ResonaBank': '970413',
  'SaitamaBank': '970414',
  'YokohamaBank': '970415',
  'ChibaBank': '970416',
  'HokurikuBank': '970417',
  'ShizuokaBank': '970418',
  'GunmaBank': '970419',
  'IyoBank': '970420',
  'FukuokaBank': '970421',
  'NishiNipponBank': '970422',
  'BankofOkinawa': '970423',
  'BankofKyoto': '970424',
  'BankofHiroshima': '970425',
  'BankofShikoku': '970426',
  'BankofNagoya': '970427',
  'BankofYokohama': '970428',
  'BankofTokyo': '970429',
  'BankofOsaka': '970430',
  'BankofKobe': '970431',
  'BankofSaitama': '970432',
  'BankofChiba': '970433',
  'BankofKanagawa': '970434',
  'BankofIbaraki': '970435',
  'BankofTochigi': '970436',
  'BankofGunma': '970437',
  'BankofNiigata': '970438',
  'BankofToyama': '970439',
  'BankofIshikawa': '970440',
  'BankofFukui': '970441',
  'BankofYamanashi': '970442',
  'BankofNagano': '970443',
  'BankofGifu': '970444',
  'BankofShizuoka': '970445',
  'BankofAichi': '970446',
  'BankofMie': '970447',
  'BankofShiga': '970448',
  'BankofKyoto': '970449',
  'BankofOsaka': '970450',
  'BankofHyogo': '970451',
  'BankofNara': '970452',
  'BankofWakayama': '970453',
  'BankofTottori': '970454',
  'BankofShimane': '970455',
  'BankofOkayama': '970456',
  'BankofHiroshima': '970457',
  'BankofYamaguchi': '970458',
  'BankofTokushima': '970459',
  'BankofKagawa': '970460',
  'BankofEhime': '970461',
  'BankofKochi': '970462',
  'BankofFukuoka': '970463',
  'BankofSaga': '970464',
  'BankofNagasaki': '970465',
  'BankofKumamoto': '970466',
  'BankofOita': '970467',
  'BankofMiyazaki': '970468',
  'BankofKagoshima': '970469',
  'BankofOkinawa': '970470',
};

export function getBankCode(bankName: string): string | null {
  // Try exact match first
  if (BANK_CODE_MAP[bankName]) {
    return BANK_CODE_MAP[bankName];
  }

  // Try partial match (case insensitive)
  const lowerBankName = bankName.toLowerCase();
  for (const [key, code] of Object.entries(BANK_CODE_MAP)) {
    if (key.toLowerCase().includes(lowerBankName) || lowerBankName.includes(key.toLowerCase())) {
      return code;
    }
  }

  return null;
}

export function hasBankInfo(profile: any): boolean {
  return !!(profile?.bank_name && profile?.bank_number && profile?.account_name);
}

export function canUseBankTransfer(profile: any): boolean {
  return hasBankInfo(profile) && getBankCode(profile.bank_name) !== null;
}
