import { InvestmentDayData, InvestmentItemType } from '../types';
import { loadBills as loadWholesaleBills } from '../../utils/storage';
import { loadBills as loadRetailBills } from '../../retail/utils/storage';
import { isOlderThan31Days } from '../../utils/retention';

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
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${data.date}`, JSON.stringify(data));
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
