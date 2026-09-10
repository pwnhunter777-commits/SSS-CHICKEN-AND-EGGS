/**
 * 31-Day Data Retention Engine & Local Phone Storage Manager
 * 
 * Rules:
 * 1. All data is saved exclusively inside the user's phone browser storage (localStorage / offline).
 * 2. Any records (bills, sales receipts, hotel payments, daily prices, investment loads)
 *    older than 31 days are automatically pruned/deleted to protect phone storage, privacy, and speed.
 */

export const RETENTION_DAYS = 31;
const STORAGE_KEYS = {
  SETTINGS: 'chicken_app_settings',
  PRODUCTS: 'chicken_app_products',
  DAILY_PRICES: 'chicken_app_daily_prices',
  BILLS: 'chicken_app_bills',
  HOTELS: 'chicken_app_hotels',
  HOTEL_PAYMENTS: 'chicken_app_hotel_payments',
  RETAIL_BILLS: 'retail_chicken_shop_bills_v1',
  RETAIL_DAILY_PRICES: 'retail_chicken_shop_daily_prices_v1',
  INVESTMENT_PREFIX: 'apex_investment_daily_',
  LAST_CLEANUP: 'chicken_app_last_cleanup_timestamp',
};

/**
 * Returns whether a date or timestamp is older than 31 days from current reference time.
 */
export function isOlderThan31Days(
  dateInput?: string | number | null,
  referenceNow: Date = new Date()
): boolean {
  if (!dateInput) return false;

  let itemTimestamp: number;

  if (typeof dateInput === 'number') {
    itemTimestamp = dateInput;
  } else if (typeof dateInput === 'string') {
    // If it's a date string like "2026-08-10"
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      const [year, month, day] = dateInput.split('-').map(Number);
      // End of that day (23:59:59.999)
      itemTimestamp = new Date(year, month - 1, day, 23, 59, 59, 999).getTime();
    } else {
      itemTimestamp = new Date(dateInput).getTime();
    }
  } else {
    return false;
  }

  if (isNaN(itemTimestamp)) return false;

  // 31 days in milliseconds: 31 * 24 * 60 * 60 * 1000
  const maxAgeMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const cutoffTime = referenceNow.getTime() - maxAgeMs;

  return itemTimestamp < cutoffTime;
}

/**
 * Returns the exact cutoff date string (YYYY-MM-DD) for 31 days ago.
 */
export function getCutoffDateString(referenceNow: Date = new Date()): string {
  const cutoff = new Date(referenceNow.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const year = cutoff.getFullYear();
  const month = String(cutoff.getMonth() + 1).padStart(2, '0');
  const day = String(cutoff.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface CleanupResult {
  wholesaleBillsRemoved: number;
  wholesalePaymentsRemoved: number;
  wholesalePricesRemoved: number;
  retailBillsRemoved: number;
  retailPricesRemoved: number;
  investmentRecordsRemoved: number;
  totalRemoved: number;
  cutoffDate: string;
  timestamp: string;
}

/**
 * Executes a full 31-day data cleanup across all sectors stored on this phone.
 * Removes all bills, payments, daily price history, and investment records older than 31 days.
 */
export function execute31DayDataCleanup(now: Date = new Date()): CleanupResult {
  let wholesaleBillsRemoved = 0;
  let wholesalePaymentsRemoved = 0;
  let wholesalePricesRemoved = 0;
  let retailBillsRemoved = 0;
  let retailPricesRemoved = 0;
  let investmentRecordsRemoved = 0;

  const cutoffDate = getCutoffDateString(now);

  try {
    // 1. Wholesale Bills
    const rawWholesaleBills = localStorage.getItem(STORAGE_KEYS.BILLS);
    if (rawWholesaleBills) {
      const parsed = JSON.parse(rawWholesaleBills);
      if (Array.isArray(parsed)) {
        const retained = parsed.filter((bill) => {
          const isOld = isOlderThan31Days(bill.date || bill.createdAt, now);
          if (isOld) wholesaleBillsRemoved++;
          return !isOld;
        });
        if (wholesaleBillsRemoved > 0) {
          localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(retained));
        }
      }
    }

    // 2. Wholesale Hotel Payments
    const rawPayments = localStorage.getItem(STORAGE_KEYS.HOTEL_PAYMENTS);
    if (rawPayments) {
      const parsed = JSON.parse(rawPayments);
      if (Array.isArray(parsed)) {
        const retained = parsed.filter((payment) => {
          const isOld = isOlderThan31Days(payment.date || payment.createdAt, now);
          if (isOld) wholesalePaymentsRemoved++;
          return !isOld;
        });
        if (wholesalePaymentsRemoved > 0) {
          localStorage.setItem(STORAGE_KEYS.HOTEL_PAYMENTS, JSON.stringify(retained));
        }
      }
    }

    // 3. Wholesale Daily Prices
    const rawWholesalePrices = localStorage.getItem(STORAGE_KEYS.DAILY_PRICES);
    if (rawWholesalePrices) {
      const parsed = JSON.parse(rawWholesalePrices);
      if (parsed && typeof parsed === 'object') {
        let changed = false;
        const cleanedPrices: Record<string, any> = {};
        for (const [dateKey, val] of Object.entries(parsed)) {
          if (isOlderThan31Days(dateKey, now)) {
            wholesalePricesRemoved++;
            changed = true;
          } else {
            cleanedPrices[dateKey] = val;
          }
        }
        if (changed) {
          localStorage.setItem(STORAGE_KEYS.DAILY_PRICES, JSON.stringify(cleanedPrices));
        }
      }
    }

    // 4. Retail Bills
    const rawRetailBills = localStorage.getItem(STORAGE_KEYS.RETAIL_BILLS);
    if (rawRetailBills) {
      const parsed = JSON.parse(rawRetailBills);
      if (Array.isArray(parsed)) {
        const retained = parsed.filter((bill) => {
          const isOld = isOlderThan31Days(bill.timestamp || bill.date, now);
          if (isOld) retailBillsRemoved++;
          return !isOld;
        });
        if (retailBillsRemoved > 0) {
          localStorage.setItem(STORAGE_KEYS.RETAIL_BILLS, JSON.stringify(retained));
        }
      }
    }

    // 5. Retail Daily Prices
    const rawRetailPrices = localStorage.getItem(STORAGE_KEYS.RETAIL_DAILY_PRICES);
    if (rawRetailPrices) {
      const parsed = JSON.parse(rawRetailPrices);
      if (parsed && typeof parsed === 'object') {
        let changed = false;
        const cleanedPrices: Record<string, any> = {};
        for (const [dateKey, val] of Object.entries(parsed)) {
          if (isOlderThan31Days(dateKey, now)) {
            retailPricesRemoved++;
            changed = true;
          } else {
            cleanedPrices[dateKey] = val;
          }
        }
        if (changed) {
          localStorage.setItem(STORAGE_KEYS.RETAIL_DAILY_PRICES, JSON.stringify(cleanedPrices));
        }
      }
    }

    // 6. Investment Daily Records (apex_investment_daily_YYYY-MM-DD)
    const allKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEYS.INVESTMENT_PREFIX)) {
        allKeys.push(key);
      }
    }

    for (const key of allKeys) {
      const datePart = key.replace(STORAGE_KEYS.INVESTMENT_PREFIX, '');
      if (isOlderThan31Days(datePart, now)) {
        localStorage.removeItem(key);
        investmentRecordsRemoved++;
      }
    }

    // Record last cleanup timestamp
    localStorage.setItem(STORAGE_KEYS.LAST_CLEANUP, now.toISOString());
  } catch (error) {
    console.error('Error during 31-day data cleanup:', error);
  }

  const totalRemoved =
    wholesaleBillsRemoved +
    wholesalePaymentsRemoved +
    wholesalePricesRemoved +
    retailBillsRemoved +
    retailPricesRemoved +
    investmentRecordsRemoved;

  return {
    wholesaleBillsRemoved,
    wholesalePaymentsRemoved,
    wholesalePricesRemoved,
    retailBillsRemoved,
    retailPricesRemoved,
    investmentRecordsRemoved,
    totalRemoved,
    cutoffDate,
    timestamp: now.toISOString(),
  };
}

/**
 * Returns statistics about local phone storage and active records within 31-day window.
 */
export function getStorageStats() {
  let wholesaleBillsCount = 0;
  let wholesalePaymentsCount = 0;
  let retailBillsCount = 0;
  let investmentDaysCount = 0;
  let totalStorageBytes = 0;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const val = localStorage.getItem(key) || '';
        totalStorageBytes += key.length + val.length;

        if (key === STORAGE_KEYS.BILLS) {
          const arr = JSON.parse(val);
          if (Array.isArray(arr)) wholesaleBillsCount = arr.length;
        } else if (key === STORAGE_KEYS.HOTEL_PAYMENTS) {
          const arr = JSON.parse(val);
          if (Array.isArray(arr)) wholesalePaymentsCount = arr.length;
        } else if (key === STORAGE_KEYS.RETAIL_BILLS) {
          const arr = JSON.parse(val);
          if (Array.isArray(arr)) retailBillsCount = arr.length;
        } else if (key.startsWith(STORAGE_KEYS.INVESTMENT_PREFIX)) {
          investmentDaysCount++;
        }
      }
    }
  } catch {
    // Ignore error
  }

  const lastCleanup = localStorage.getItem(STORAGE_KEYS.LAST_CLEANUP) || null;

  return {
    retentionDays: RETENTION_DAYS,
    cutoffDate: getCutoffDateString(),
    wholesaleBillsCount,
    wholesalePaymentsCount,
    retailBillsCount,
    investmentDaysCount,
    totalStorageKb: Math.round((totalStorageBytes / 1024) * 10) / 10,
    lastCleanup,
  };
}
