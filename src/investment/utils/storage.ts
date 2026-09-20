import { InvestmentDayData, InvestmentItemType, DailyHistoryRecord } from '../types';
import { loadBills as loadWholesaleBills } from '../../utils/storage';
import { loadBills as loadRetailBills } from '../../retail/utils/storage';
import { isOlderThan31Days } from '../../utils/retention';
import { saveToPhoneDB } from '../../utils/idbPhoneStorage';

const STORAGE_KEY_PREFIX = 'apex_investment_daily_';

export function getTodayDateKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDefaultInvestmentData(dateStr: string): InvestmentDayData {
  return {
    date: dateStr,
    itemType: 'chicken',
    chickenLoad: {
      wastagePercent: 0,
      totalIncomeKg: 0,
      ratePerKg: 0,
    },
    eggLoad: {
      totalTareIncome: 0,
      pricePerTare: 0,
      wastagePercent: 0,
      totalIncomeCount: 0,
      ratePerUnit: 0,
    },
    sales: {
      loadPriceSpend: 0,
      totalIncomeKg: 0,
      wholesalePrice: 0,
      wholesaleAmount: 0,
      wholesaleKg: 0,
      retailPrice: 0,
      retailAmount: 0,
      retailKg: 0,
      eggPrice: 0,
      eggAmount: 0,
      eggQty: 0,
      expenses: 0,
      expenseItems: [],
    },
    isCustomOverridden: false,
  };
}

export function loadInvestmentData(dateStr: string = getTodayDateKey()): InvestmentDayData {
  try {
    if (isOlderThan31Days(dateStr)) {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${dateStr}`);
      return getDefaultInvestmentData(dateStr);
    }
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${dateStr}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...getDefaultInvestmentData(dateStr),
        ...parsed,
      };
    }
  } catch (err) {
    console.error('Error reading investment data', err);
  }
  return getDefaultInvestmentData(dateStr);
}

export function saveInvestmentData(data: InvestmentDayData): void {
  try {
    const key = `${STORAGE_KEY_PREFIX}${data.date}`;
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
    // Also save permanently to on-device IndexedDB
    saveToPhoneDB(key, data);
  } catch (err) {
    console.error('Error saving investment data', err);
  }
}

// Fetch today's actual sales figures from Wholesale and Retail bills
export function fetchDailyBillsSummary(dateStr: string = getTodayDateKey()) {
  // Wholesale bills
  let wholesaleAmount = 0;
  let wholesaleKg = 0;
  try {
    const wBills = loadWholesaleBills();
    const todayWBills = wBills.filter((b) => b.date === dateStr);
    wholesaleAmount = todayWBills.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
    wholesaleKg = todayWBills.reduce((sum, b) => sum + (Number(b.totalKg) || 0), 0);
  } catch (err) {
    console.error('Error loading wholesale bills summary', err);
  }

  // Retail bills - separate chicken and egg
  let retailAmount = 0;
  let retailKg = 0;
  let eggAmount = 0;
  let eggQty = 0;

  const isEggItem = (item: any) => {
    if (!item) return false;
    const v = String(item.variant || '').toLowerCase();
    const pid = String(item.productId || '').toLowerCase();
    const name = String(item.productName || '').toLowerCase();
    const nameEn = String(item.productNameEn || '').toLowerCase();
    const nameTa = String(item.productNameTa || item.productName || '');
    return (
      v === 'egg' ||
      pid === 'p_egg' ||
      name.includes('egg') ||
      name.includes('முட்டை') ||
      nameEn.includes('egg') ||
      nameTa.includes('முட்டை')
    );
  };

  try {
    const rBills = loadRetailBills();
    const todayRBills = rBills.filter((b) => {
      if (!b) return false;
      if (b.date === dateStr) return true;
      if (b.timestamp) {
        const d = new Date(b.timestamp);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        if (`${y}-${m}-${day}` === dateStr) return true;
      }
      return false;
    });

    todayRBills.forEach((b) => {
      if (Array.isArray(b.items) && b.items.length > 0) {
        b.items.forEach((item) => {
          if (isEggItem(item)) {
            eggAmount += Number(item.amount) || 0;
            eggQty += Number(item.kg) || 0;
          } else {
            retailAmount += Number(item.amount) || 0;
            retailKg += Number(item.kg) || 0;
          }
        });
      } else {
        retailAmount += Number(b.totalAmount) || 0;
        retailKg += Number(b.totalKg) || 0;
      }
    });
  } catch (err) {
    console.error('Error loading retail bills summary', err);
  }

  const finalWAmt = Math.round(wholesaleAmount * 100) / 100;
  const finalWKg = Math.round(wholesaleKg * 1000) / 1000;
  const finalWPrice = finalWKg > 0 ? Math.round((finalWAmt / finalWKg) * 100) / 100 : 0;

  const finalRAmt = Math.round(retailAmount * 100) / 100;
  const finalRKg = Math.round(retailKg * 1000) / 1000;
  const finalRPrice = finalRKg > 0 ? Math.round((finalRAmt / finalRKg) * 100) / 100 : 0;

  const finalEggAmt = Math.round(eggAmount * 100) / 100;
  const finalEggQty = Math.round(eggQty * 10) / 10;
  const finalEggPrice = finalEggQty > 0 ? Math.round((finalEggAmt / finalEggQty) * 100) / 100 : 0;

  return {
    wholesalePrice: finalWPrice,
    wholesaleAmount: finalWAmt,
    wholesaleKg: finalWKg,
    retailPrice: finalRPrice,
    retailAmount: finalRAmt,
    retailKg: finalRKg,
    eggPrice: finalEggPrice,
    eggAmount: finalEggAmt,
    eggQty: finalEggQty,
  };
}

export interface PreviousDayStock {
  date: string;
  daysAgo: number;
  chickenRemainingKg: number;
  chickenIncomingKg: number;
  chickenSoldKg: number;
  eggRemainingNos: number;
  eggRemainingTares: number;
  eggRemainingRem: number;
  eggInwardNos: number;
  eggSoldNos: number;
  hasActivity: boolean;
}

export function getPreviousDateKey(dateStr: string, offsetDays: number = 1): string {
  const parts = dateStr.split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const dt = new Date(y, m, d);
  dt.setDate(dt.getDate() - offsetDays);
  const year = dt.getFullYear();
  const month = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateDayStockRemaining(dateStr: string): {
  chickenRemainingKg: number;
  chickenIncomingKg: number;
  chickenSoldKg: number;
  eggRemainingNos: number;
  eggRemainingTares: number;
  eggRemainingRem: number;
  eggInwardNos: number;
  eggSoldNos: number;
  hasActivity: boolean;
} {
  const dayData = loadInvestmentData(dateStr);
  const billSummary = fetchDailyBillsSummary(dateStr);

  // Chicken incoming
  const chickenGross = Number(dayData.chickenLoad?.totalIncomeKg || 0);
  const chickenWastage = Number(dayData.chickenLoad?.wastagePercent || 0);
  const chickenNet = chickenWastage > 0
    ? Math.max(0, Math.round((chickenGross * (1 - chickenWastage / 100)) * 100) / 100)
    : chickenGross;
  const chickenIncomingKg = chickenNet > 0 ? chickenNet : Number(dayData.sales?.totalIncomeKg || 0);

  // Chicken sold
  const wholesaleKg = billSummary.wholesaleKg > 0 ? billSummary.wholesaleKg : Number(dayData.sales?.wholesaleKg || 0);
  const retailKg = billSummary.retailKg > 0 ? billSummary.retailKg : Number(dayData.sales?.retailKg || 0);
  const chickenSoldKg = Math.round((wholesaleKg + retailKg) * 1000) / 1000;

  // Opening chicken if applied
  const openingChicken = dayData.openingStock?.appliedToLoad ? (Number(dayData.openingStock.chickenKg) || 0) : 0;
  const totalAvailableChicken = chickenIncomingKg + openingChicken;

  const chickenRemainingKg = Math.round((totalAvailableChicken - chickenSoldKg) * 1000) / 1000;

  // Egg incoming
  const eggInwardTares = Number(dayData.eggLoad?.totalTareIncome || (dayData.eggLoad?.totalIncomeCount ? dayData.eggLoad.totalIncomeCount / 30 : 0));
  const eggInwardNos = Math.round(eggInwardTares * 30);

  // Egg sold
  const eggSoldNos = billSummary.eggQty > 0 ? billSummary.eggQty : Number(dayData.sales?.eggQty || 0);

  const openingEggNos = dayData.openingStock?.appliedToLoad ? (Number(dayData.openingStock.eggNos) || 0) : 0;
  const totalAvailableEggs = eggInwardNos + openingEggNos;

  const eggRemainingNos = totalAvailableEggs - eggSoldNos;
  const eggRemainingTares = Math.floor(eggRemainingNos / 30);
  const eggRemainingRem = Math.abs(eggRemainingNos) % 30;

  const hasActivity = chickenIncomingKg > 0 || chickenSoldKg > 0 || eggInwardNos > 0 || eggSoldNos > 0;

  return {
    chickenRemainingKg,
    chickenIncomingKg,
    chickenSoldKg,
    eggRemainingNos,
    eggRemainingTares,
    eggRemainingRem,
    eggInwardNos,
    eggSoldNos,
    hasActivity,
  };
}

export function getPreviousDayStock(currentDateStr: string): PreviousDayStock | null {
  // Always get the immediate previous calendar day (D-1 / yesterday)
  const prevDateKey = getPreviousDateKey(currentDateStr, 1);
  const yesterdayStock = calculateDayStockRemaining(prevDateKey);

  // If yesterday had direct activity recorded, return yesterday's calculated remaining stock
  if (yesterdayStock.hasActivity) {
    return {
      date: prevDateKey,
      daysAgo: 1,
      ...yesterdayStock,
    };
  }

  // If yesterday had no entries recorded (e.g. shop closed or not logged),
  // carry forward the latest known stock balance as yesterday's closing stock
  for (let i = 2; i <= 30; i++) {
    const pastKey = getPreviousDateKey(currentDateStr, i);
    const pastStock = calculateDayStockRemaining(pastKey);
    if (pastStock.hasActivity) {
      return {
        date: prevDateKey, // Represents the stock as of yesterday
        daysAgo: 1,
        chickenRemainingKg: pastStock.chickenRemainingKg,
        chickenIncomingKg: pastStock.chickenIncomingKg,
        chickenSoldKg: pastStock.chickenSoldKg,
        eggRemainingNos: pastStock.eggRemainingNos,
        eggRemainingTares: pastStock.eggRemainingTares,
        eggRemainingRem: pastStock.eggRemainingRem,
        eggInwardNos: pastStock.eggInwardNos,
        eggSoldNos: pastStock.eggSoldNos,
        hasActivity: true,
      };
    }
  }

  // Fallback if no prior data exists
  return {
    date: prevDateKey,
    daysAgo: 1,
    ...yesterdayStock,
  };
}

export function getDailyHistoryRecords(currentDateStr: string = getTodayDateKey(), maxDays: number = 30): DailyHistoryRecord[] {
  const datesSet = new Set<string>();
  datesSet.add(currentDateStr);

  // 1. Discover dates from wholesale bills
  try {
    const wBills = loadWholesaleBills();
    wBills.forEach((b) => {
      if (b.date && /^\d{4}-\d{2}-\d{2}$/.test(b.date)) {
        datesSet.add(b.date);
      }
    });
  } catch {
    // ignore
  }

  // 2. Discover dates from retail bills
  try {
    const rBills = loadRetailBills();
    rBills.forEach((b) => {
      if (b.date && /^\d{4}-\d{2}-\d{2}$/.test(b.date)) {
        datesSet.add(b.date);
      } else if (b.timestamp) {
        const d = new Date(b.timestamp);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        datesSet.add(`${y}-${m}-${day}`);
      }
    });
  } catch {
    // ignore
  }

  // 3. Discover dates from localStorage investment keys
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(STORAGE_KEY_PREFIX)) {
        const d = k.replace(STORAGE_KEY_PREFIX, '');
        if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
          datesSet.add(d);
        }
      }
    }
  } catch {
    // ignore
  }

  // 4. Add the immediate past few days (e.g. yesterday, 2 days ago) so they can be viewed
  for (let i = 1; i <= 7; i++) {
    datesSet.add(getPreviousDateKey(currentDateStr, i));
  }

  // Sort dates descending (newest date first)
  const sortedDates = Array.from(datesSet).sort((a, b) => b.localeCompare(a));
  const todayKey = getTodayDateKey();

  const allRecords: DailyHistoryRecord[] = sortedDates.map((dStr) => {
    const dayData = loadInvestmentData(dStr);
    const billSummary = fetchDailyBillsSummary(dStr);

    // Chicken Load Inward calculations
    const chickenGross = Number(dayData.chickenLoad?.totalIncomeKg || 0);
    const chickenWastage = Number(dayData.chickenLoad?.wastagePercent || 0);
    const chickenRate = Number(dayData.chickenLoad?.ratePerKg || 0);
    const chickenNet = chickenWastage > 0
      ? Math.max(0, Math.round((chickenGross * (1 - chickenWastage / 100)) * 100) / 100)
      : chickenGross;
    const chickenCost = Number(dayData.chickenLoad?.totalAmount || 0) > 0
      ? Number(dayData.chickenLoad.totalAmount)
      : Math.round(chickenNet * chickenRate * 100) / 100;

    // Egg Load Inward calculations
    const eggTares = Number(dayData.eggLoad?.totalTareIncome || (dayData.eggLoad?.totalIncomeCount ? dayData.eggLoad.totalIncomeCount / 30 : 0));
    const eggPrice = Number(dayData.eggLoad?.pricePerTare || (dayData.eggLoad?.ratePerUnit ? dayData.eggLoad.ratePerUnit * 30 : 0));
    const eggCost = Math.round(eggTares * eggPrice * 100) / 100;
    const eggInwardNos = Math.round(eggTares * 30);

    const combinedLoadCost = Math.round((chickenCost + eggCost) * 100) / 100;
    const loadCostSpend = combinedLoadCost > 0 ? combinedLoadCost : Number(dayData.sales?.loadPriceSpend || 0);

    // Sales calculations
    const wholesaleKg = billSummary.wholesaleKg > 0 ? billSummary.wholesaleKg : Number(dayData.sales?.wholesaleKg || 0);
    const wholesaleAmount = billSummary.wholesaleAmount > 0 ? billSummary.wholesaleAmount : Number(dayData.sales?.wholesaleAmount || 0);
    const retailKg = billSummary.retailKg > 0 ? billSummary.retailKg : Number(dayData.sales?.retailKg || 0);
    const retailAmount = billSummary.retailAmount > 0 ? billSummary.retailAmount : Number(dayData.sales?.retailAmount || 0);

    const chickenSaleKg = Math.round((wholesaleKg + retailKg) * 1000) / 1000;
    const chickenSaleAmount = Math.round((wholesaleAmount + retailAmount) * 100) / 100;

    const eggSaleAmount = billSummary.eggAmount > 0 ? billSummary.eggAmount : Number(dayData.sales?.eggAmount || 0);
    const eggSaleQty = billSummary.eggQty > 0 ? billSummary.eggQty : Number(dayData.sales?.eggQty || 0);
    const eggSaleTares = Math.floor(eggSaleQty / 30);
    const eggSaleRem = eggSaleQty % 30;

    const expenses = Number(dayData.sales?.expenses || 0);

    const totalCollected = Math.round((chickenSaleAmount + eggSaleAmount) * 100) / 100;
    const grossProfit = Math.round((totalCollected - loadCostSpend) * 100) / 100;
    const profit = Math.round((grossProfit - expenses) * 100) / 100;

    // Opening Stock
    const isOpeningApplied = Boolean(dayData.openingStock?.appliedToLoad);
    const openingChickenKg = isOpeningApplied ? Number(dayData.openingStock?.chickenKg || 0) : 0;
    const openingEggNos = isOpeningApplied ? Number(dayData.openingStock?.eggNos || 0) : 0;

    // Remaining Stock ("Everyday Remind Me Chicken and Egg")
    const incomingChickenKg = chickenNet > 0 ? chickenNet : Number(dayData.sales?.totalIncomeKg || 0);
    const totalAvailableChicken = incomingChickenKg + openingChickenKg;
    const chickenRemainingKg = Math.round((totalAvailableChicken - chickenSaleKg) * 1000) / 1000;

    const totalAvailableEggs = eggInwardNos + openingEggNos;
    const eggRemainingNos = totalAvailableEggs - eggSaleQty;
    const eggRemainingTares = Math.floor(eggRemainingNos / 30);
    const eggRemainingRem = Math.abs(eggRemainingNos) % 30;

    const hasActivity =
      chickenSaleKg > 0 ||
      chickenSaleAmount > 0 ||
      eggSaleQty > 0 ||
      eggSaleAmount > 0 ||
      incomingChickenKg > 0 ||
      eggInwardNos > 0 ||
      loadCostSpend > 0 ||
      expenses > 0 ||
      openingChickenKg > 0 ||
      openingEggNos > 0;

    return {
      date: dStr,
      isToday: dStr === todayKey,
      profit,
      grossProfit,
      totalCollected,
      loadCostSpend,
      expenses,
      chickenSaleKg,
      chickenSaleAmount,
      wholesaleKg,
      wholesaleAmount,
      retailKg,
      retailAmount,
      eggSaleQty,
      eggSaleTares,
      eggSaleRem,
      eggSaleAmount,
      chickenRemainingKg,
      eggRemainingNos,
      eggRemainingTares,
      eggRemainingRem,
      chickenIncomingKg: incomingChickenKg,
      eggInwardTares: eggTares,
      openingChickenKg,
      openingEggNos,
      hasActivity,
    };
  });

  // Filter: Always keep Today, plus any days that have real activity / entries
  const filtered = allRecords.filter((r) => r.isToday || r.hasActivity);

  return filtered.slice(0, maxDays);
}

