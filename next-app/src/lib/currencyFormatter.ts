const indianCurrencyFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0
});

const parseNumericCurrency = (value: any): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const normalizedValue = value.replace(/₹|INR|Rs\.?|,/gi, '').trim();
  if (!normalizedValue || !/^[-+]?\d+(\.\d+)?$/.test(normalizedValue)) {
    return null;
  }

  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

export const formatCurrencyValue = (value: any, fallback = 'Not specified'): string => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const numericValue = parseNumericCurrency(value);
  if (numericValue !== null) {
    return `₹${indianCurrencyFormatter.format(numericValue)}`;
  }

  return String(value)
    .replace(/\bUSD\b/gi, '')
    .replace(/\bUS Dollars?\b/gi, '')
    .replace(/\$/g, '')
    .replace(/₹/g, '')
    .replace(/\bRs\.?\s*/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
};
