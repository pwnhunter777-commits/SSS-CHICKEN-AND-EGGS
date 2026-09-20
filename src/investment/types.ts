export type InvestmentItemType = 'chicken' | 'egg'; // 1, 2

export interface ChickenLoadRecord {
  wastagePercent: number; // 3: percentage of wastage
  totalIncomeKg: number; // 4: total kg income in the store
  ratePerKg: number; // 5: rate of per kg
  totalAmount?: number; // total load amount in ₹
  costBasis?: 'gross' | 'net'; // calculation basis: gross (800 kg) or net (after wastage)
}

export interface EggLoadRecord {
  totalTareIncome: number; // total tare income (e.g. 50 tares)
  pricePerTare: number; // price of a single tare (e.g. ₹180)
  wastagePercent?: number;
  totalIncomeCount?: number;
  ratePerUnit?: number;
}

export interface DaySalesRecord {
  loadPriceSpend: number; // 9: total price spend for get the income
  totalIncomeKg: number; // 10: kg of total income
  wholesalePrice?: number; // wholesale price per kg / unit
  wholesaleAmount: number; // 11: wholesale amount collected full day
  wholesaleKg: number; // 12: wholesale kg sold one day
  retailPrice?: number; // retail price per kg / unit
  retailAmount: number; // 13: retail amount collector full day
  retailKg: number; // 14: kg sold full day in retail
  eggPrice?: number; // egg price per unit
  eggAmount?: number; // egg amount collected full day
  eggQty?: number; // egg count sold full day
}

export interface DayOpeningStock {
  fromPreviousDate?: string;
  chickenKg: number;
  eggNos: number;
  eggTares?: number;
  eggRem?: number;
  appliedToLoad?: boolean; // whether added to today's available stock
}

export interface InvestmentDayData {
  date: string; // YYYY-MM-DD
  itemType: InvestmentItemType; // chicken | egg
  chickenLoad: ChickenLoadRecord;
  eggLoad: EggLoadRecord;
  sales: DaySalesRecord;
  openingStock?: DayOpeningStock;
  isCustomOverridden?: boolean;
}

export type InvestmentBottomTab = 'load' | 'sales' | 'summary' | 'settings';
export type SummarySubTab = 'summary' | 'wholesale-total' | 'retail-total' | 'hotel-dues'; // 17, 21, 22, 26
