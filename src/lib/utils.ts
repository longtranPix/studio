import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrencyVND = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return '0đ';
  }

  if (value >= 1_000_000_000) {
    const formattedValue = (value / 1_000_000_000).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
    return `${formattedValue} tỷ`;
  }
  if (value >= 1_000_000) {
    const formattedValue = (value / 1_000_000).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
    return `${formattedValue} tr`;
  }
  if (value >= 1_000) {
    const formattedValue = (value / 1_000).toFixed(0);
    return `${formattedValue}k`;
  }
  return `${value.toLocaleString('vi-VN')}đ`;
};
