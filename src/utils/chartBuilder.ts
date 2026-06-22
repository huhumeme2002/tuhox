import type { BirthInput, Palace, TuViChart } from '../types/tuVi';
import { CAN, CHI, CUNG_NAMES } from '../data/constants';
import { convertSolarToLunar } from './calendar';
import { getDayCanChi, getHourCanChi, getMonthCanChi, getYearCanChi, hourToChi } from './canChi';
import {
  calculateDaiVan,
  calculateMenhCungIndex,
  calculateThanCungIndex,
  getAmDuongNamNu,
  getMenhCuc,
  getMenhCucNumber,
  timTuVi,
} from './palaceCalc';
import { placeChinhTinh, placePhuTinh } from './starPlacement';
import { applyTuHoa } from './tuHoa';

export function buildChart(input: BirthInput): TuViChart {
  const { name, birthDate, birthTime, gender } = input;

  const lunarDate = convertSolarToLunar(birthDate);
  const [hourStr, minuteStr] = birthTime.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  const yearCanChi = getYearCanChi(lunarDate.year);
  const monthCanChi = getMonthCanChi(lunarDate.year, Math.abs(lunarDate.month));
  const dayCanChi = getDayCanChi(birthDate);
  const hourChi = hourToChi(hour, minute);
  const hourCanChi2 = getHourCanChi(dayCanChi.can, hourChi);

  const canNam0 = CAN.indexOf(yearCanChi.can);
  const chiNam0 = CHI.indexOf(yearCanChi.chi);
  const hourChiIndex = CHI.indexOf(hourChi);

  const menhCungIndex = calculateMenhCungIndex(Math.abs(lunarDate.month), hourChiIndex);
  const thanCungIndex = calculateThanCungIndex(Math.abs(lunarDate.month), hourChiIndex);

  const menhCuc = getMenhCuc(menhCungIndex, canNam0);
  const menhCucNumber = getMenhCucNumber(menhCungIndex, canNam0);

  const viTriTuVi = timTuVi(menhCucNumber, lunarDate.day);
  let starsByPalace = placeChinhTinh(viTriTuVi);
  const phuTinh = placePhuTinh(
    canNam0,
    chiNam0,
    Math.abs(lunarDate.month),
    lunarDate.day,
    hourChiIndex
  );

  // Gộp sao phụ vào
  for (let i = 0; i < 12; i++) {
    starsByPalace[i] = [...starsByPalace[i], ...phuTinh[i]];
  }

  // Áp Tứ Hóa
  starsByPalace = applyTuHoa(yearCanChi.can, starsByPalace);

  // Xây dựng 12 cung
  // An Thiên Can địa bàn theo quy tắc: cung Dần = Giáp, đếm thuận theo chiều kim đồng hồ
  const daiVan = calculateDaiVan(menhCungIndex, menhCucNumber, chiNam0, gender);

  const palaces: Palace[] = CHI.map((chi, index) => {
    const cungIndex = (index - menhCungIndex + 12) % 12;
    const cungName = CUNG_NAMES[cungIndex];
    const canCung0 = ((index - 2 + 12) % 12) % 10;
    return {
      index,
      name: cungName,
      can: CAN[canCung0],
      chi,
      isMenh: index === menhCungIndex,
      isThan: index === thanCungIndex,
      daiVan: daiVan[index],
      stars: starsByPalace[index] || [],
    };
  });

  return {
    name,
    birthDate,
    lunarDate,
    canChi: {
      year: `${yearCanChi.can} ${yearCanChi.chi}`,
      month: `${monthCanChi.can} ${monthCanChi.chi}`,
      day: `${dayCanChi.can} ${dayCanChi.chi}`,
      hour: `${hourCanChi2.can} ${hourCanChi2.chi}`,
    },
    menhCung: { label: 'Mệnh', chi: CHI[menhCungIndex], position: `Mệnh tại ${CHI[menhCungIndex]}` },
    thanCung: { label: 'Thân', chi: CHI[thanCungIndex], position: `Thân tại ${CHI[thanCungIndex]}` },
    amDuong: getAmDuongNamNu(yearCanChi.can, gender),
    menhCuc,
    palaces,
  };
}
