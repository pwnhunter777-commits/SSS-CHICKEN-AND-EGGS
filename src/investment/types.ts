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

export interface ExpenseItem {
  id: string;
  title: string;
  amount: number;
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
  expenses?: number; // Daily expense total in ₹
  expenseCategory?: string; // Optional category (e.g. Shop, Transport, Salary, Tea, Misc)
  expenseNotes?: string; // Optional note
  expenseItems?: ExpenseItem[]; // List of itemized expenses
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

export interface DailyHistoryRecord {
  date: string;
  isToday: boolean;
  // Everyday Profit
  profit: number; // Net profit (Sales - Load Spend - Expenses)
  grossProfit: number;
  totalCollected: number;
  loadCostSpend: number;
  expenses: number;

  // Total Chicken Sale
  chickenSaleKg: number;
  chickenSaleAmount: number;
  wholesaleKg: number;
  wholesaleAmount: number;
  retailKg: number;
  retailAmount: number;

  // Under: Total Egg Sales
  eggSaleQty: number;
  eggSaleTares: number;
  eggSaleRem: number;
  eggSaleAmount: number;

  // Everyday Remind Me Chicken and Egg (Closing / Remaining Stock)
  chickenRemainingKg: number;
  eggRemainingNos: number;
  eggRemainingTares: number;
  eggRemainingRem: number;

  // Inward & Opening Details
  chickenIncomingKg: number;
  eggInwardTares: number;
  openingChickenKg: number;
  openingEggNos: number;
  hasActivity: boolean;
}

export type InvestmentBottomTab = 'load' | 'sales' | 'summary';
export type SummarySubTab = 'summary' | 'wholesale-total' | 'retail-total' | 'hotel-dues' | 'daily-history'; // 17, 21, 22, 26, 27
