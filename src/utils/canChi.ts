import type { Can, Chi } from '../types/tuVi';
import { CAN, CHI } from '../data/constants';
import { getLunarDateObject } from './calendar';

export function getYearCanChi(lunarYear: number): { can: Can; chi: Chi } {
  const canIndex = (lunarYear - 4) % 10;
  const chiIndex = (lunarYear - 4) % 12;
  return {
    can: CAN[canIndex],
    chi: CHI[chiIndex],
  };
}

const NGU_HO_DON_FIRST_MONTH_CAN: Record<Can, Can> = {
  'Giáp': 'Bính',
  'Kỷ': 'Bính',
  'Ất': 'Mậu',
  'Canh': 'Mậu',
  'Bính': 'Canh',
  'Tân': 'Canh',
  'Đinh': 'Nhâm',
  'Nhâm': 'Nhâm',
  'Mậu': 'Giáp',
  'Quý': 'Giáp',
};

export function getNguHoDonCanMap(yearCan: Can): Record<number, Can> {
  const canDau = NGU_HO_DON_FIRST_MONTH_CAN[yearCan];
  const canIndex = CAN.indexOf(canDau);
  const map: Record<number, Can> = {};

  for (let i = 0; i < 12; i++) {
    // Dần (index 2) là can khởi; sau đó đếm thuận theo 12 địa chi.
    map[i] = CAN[(canIndex + (i - 2 + 12) % 12) % 10];
  }

  return map;
}

export function getMonthCanChi(lunarYear: number, lunarMonth: number): { can: Can; chi: Chi } {
  const yearCanIndex = (lunarYear - 4) % 10;
  // Tháng Giêng (tháng 1 âm) của năm Giáp/Kỷ là Giáp Dần
  // Can của tháng 1: năm Giáp/Kỷ -> Giáp; Bính/Đinh -> Bính; Mậu/Kỷ -> Mậu; Canh/Tân -> Canh; Nhâm/Quý -> Nhâm
  // Quy tắc: 甲己之年丙作首 (Giáp/Kỷ -> Bính)
  // 乙庚之岁戊为头 (Ất/Canh -> Mậu)
  // 丙辛之年寻庚上 (Bính/Tân -> Canh)
  // 丁壬壬位顺行流 (Đinh/Nhâm -> Nhâm)
  // 戊癸甲寅好追求 (Mậu/Quý -> Giáp)
  const firstMonthCan = CAN.indexOf(NGU_HO_DON_FIRST_MONTH_CAN[CAN[yearCanIndex]]);
  const canIndex = (firstMonthCan + (lunarMonth - 1)) % 10;
  const chiIndex = ((lunarMonth + 1) % 12); // tháng 1 -> Dần (index 2)
  return {
    can: CAN[canIndex],
    chi: CHI[chiIndex],
  };
}

const HAN_TO_CAN: Record<string, Can> = {
  '甲': 'Giáp',
  '乙': 'Ất',
  '丙': 'Bính',
  '丁': 'Đinh',
  '戊': 'Mậu',
  '己': 'Kỷ',
  '庚': 'Canh',
  '辛': 'Tân',
  '壬': 'Nhâm',
  '癸': 'Quý',
};

const HAN_TO_CHI: Record<string, Chi> = {
  '子': 'Tý',
  '丑': 'Sửu',
  '寅': 'Dần',
  '卯': 'Mão',
  '辰': 'Thìn',
  '巳': 'Tỵ',
  '午': 'Ngọ',
  '未': 'Mùi',
  '申': 'Thân',
  '酉': 'Dậu',
  '戌': 'Tuất',
  '亥': 'Hợi',
};

export function getDayCanChi(dateStr: string): { can: Can; chi: Chi } {
  const lunar = getLunarDateObject(dateStr);
  const ganZhi = lunar.getDayInGanZhi();
  return {
    can: HAN_TO_CAN[ganZhi[0]],
    chi: HAN_TO_CHI[ganZhi[1]],
  };
}

export function hourToChi(hour: number, minute: number): Chi {
  // Giờ Tý bắt đầu từ 23h ngày hôm trước đến 1h sáng
  const totalMinutes = hour * 60 + minute;
  // Tý: 23:00 - 00:59 (tức 1380 - 59 phút của ngày)
  // Chuyển về giờ theo cách tính 2 tiếng 1 giờ, bắt đầu từ 0:00
  // 23:00-00:59 -> Tý
  // 1:00-2:59 -> Sửu
  // ...
  if (totalMinutes >= 23 * 60) {
    return 'Tý';
  }
  const chiIndex = Math.floor((totalMinutes + 60) / 120) % 12;
  return CHI[chiIndex];
}

export function getHourCanChi(dayCan: Can, hourChi: Chi): { can: Can; chi: Chi } {
  const dayCanIndex = CAN.indexOf(dayCan);
  // Giờ Tý của ngày Giáp/Kỷ là Giáp Tý
  // Giáp/Kỷ -> Giáp; Bính/Đinh -> Bính; Mậu/Kỷ -> Mậu? wait
  // Rule: 甲己还加甲 -> Giáp/Kỷ day, Tý hour is Giáp
  // 乙庚丙作初 -> Ất/Canh day, Tý hour is Bính
  // 丙辛从戊起 -> Bính/Tân day, Tý hour is Mậu
  // 丁壬庚子居 -> Đinh/Nhâm day, Tý hour is Canh
  // 戊癸何方发 壬子是真途 -> Mậu/Quý day, Tý hour is Nhâm
  const tyCanMap: Record<number, number> = {
    0: 0, // Giáp -> Giáp
    5: 0, // Kỷ -> Giáp
    1: 2, // Ất -> Bính
    6: 2, // Canh -> Bính
    2: 4, // Bính -> Mậu
    7: 4, // Tân -> Mậu
    3: 6, // Đinh -> Canh
    8: 6, // Nhâm -> Canh
    4: 8, // Mậu -> Nhâm
    9: 8, // Quý -> Nhâm
  };
  const tyCan = tyCanMap[dayCanIndex];
  const hourChiIndex = CHI.indexOf(hourChi);
  const canIndex = (tyCan + hourChiIndex) % 10;
  return {
    can: CAN[canIndex],
    chi: hourChi,
  };
}
