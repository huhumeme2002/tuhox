import { Lunar, Solar } from 'lunar-javascript';

export interface LunarDate {
  day: number;
  month: number;
  year: number;
  leap: boolean;
}

export function convertSolarToLunar(dateStr: string): LunarDate {
  const [year, month, day] = dateStr.split('-').map(Number);
  const solar = Solar.fromYmd(year, month, day);
  const lunar = Lunar.fromSolar(solar);
  return {
    day: lunar.getDay(),
    month: Math.abs(lunar.getMonth()),
    year: lunar.getYear(),
    leap: lunar.getMonth() < 0,
  };
}

export function getLunarDateObject(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const solar = Solar.fromYmd(year, month, day);
  return Lunar.fromSolar(solar);
}

export function getCurrentLunarYear(date = new Date()): number {
  return Solar.fromDate(date).getLunar().getYear();
}
