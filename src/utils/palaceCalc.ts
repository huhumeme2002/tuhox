import type { Can, Chi, CungName } from '../types/tuVi';
import { CAN, CHI, CUNG_NAMES, NAP_AM } from '../data/constants';

// Tương đương dichCung trong repo Python (1-based), chuyển sang 0-based
// Python: dichCung(cung, *steps) = (cung + sum(steps)) % 12, nếu 0 thì 12
// JS 0-based: (cung0 + sum(steps)) % 12
export function dichCung(cung0: number, ...steps: number[]): number {
  return steps.reduce((acc, s) => (acc + s + 12) % 12, cung0);
}

// Tính cung Mệnh theo tháng âm và giờ sinh (chi)
// Python: cungMenh = dichCung(3, thangSinhAmLich - 1, -gioSinhAmLich + 1)
export function calculateMenhCungIndex(lunarMonth: number, hourChiIndex: number): number {
  // Trong Python repo, gioSinhAmLich là 1-based (Tý=1). Trong JS hourChiIndex là 0-based.
  // Python: dichCung(3, lunarMonth - 1, -(gioSinhAmLich) + 1)
  // Chuyển sang 0-based: bắt đầu từ Dần (index 2), + (lunarMonth - 1), - hourChiIndex
  return dichCung(2, lunarMonth - 1, -hourChiIndex);
}

export function calculateMenhCung(lunarMonth: number, hourChi: Chi): CungName {
  return CUNG_NAMES[calculateMenhCungIndex(lunarMonth, CHI.indexOf(hourChi))];
}

// Tính cung Thân
// Python: cungThan = dichCung(3, thangSinhAmLich - 1, gioSinhAmLich - 1)
export function calculateThanCungIndex(lunarMonth: number, hourChiIndex: number): number {
  return dichCung(2, lunarMonth - 1, hourChiIndex);
}

export function calculateThanCung(lunarMonth: number, hourChi: Chi): CungName {
  return CUNG_NAMES[calculateThanCungIndex(lunarMonth, CHI.indexOf(hourChi))];
}

// Tìm cục theo logic repo
// Python:
//   canThangGieng = (canNam * 2 + 1) % 10
//   canThangMenh = ((viTriCungMenh - 3) % 12 + canThangGieng) % 10
//   if canThangMenh == 0: canThangMenh = 10
//   return nguHanhNapAm(viTriCungMenh, canThangMenh)
// Trong đó canNam và viTriCungMenh đều 1-based
export function timCuc(viTriCungMenh0: number, canNam0: number): string {
  const viTriCungMenh1 = viTriCungMenh0 + 1;
  const canNam1 = canNam0 + 1;

  const canThangGieng = (canNam1 * 2 + 1) % 10;
  // JS % với số âm khác Python, cần normalize về dương
  let canThangMenh = ((((viTriCungMenh1 - 3) % 12) + 12) % 12 + canThangGieng) % 10;
  if (canThangMenh === 0) canThangMenh = 10;

  // nguHanhNapAm Python trả về K/M/T/H/O
  const key = `${CAN[canThangMenh - 1]} ${CHI[viTriCungMenh1 - 1]}`;
  const napAm = NAP_AM[key] || '';
  if (napAm.includes('Kim')) return 'Kim';
  if (napAm.includes('Mộc')) return 'Mộc';
  if (napAm.includes('Thủy')) return 'Thủy';
  if (napAm.includes('Hỏa')) return 'Hỏa';
  if (napAm.includes('Thổ')) return 'Thổ';
  return '';
}

export function getMenhCuc(viTriCungMenh0: number, canNam0: number): string {
  const element = timCuc(viTriCungMenh0, canNam0);
  const map: Record<string, string> = {
    'Kim': 'Kim Tứ Cục',
    'Mộc': 'Mộc Tam Cục',
    'Thủy': 'Thủy Nhị Cục',
    'Hỏa': 'Hỏa Lục Cục',
    'Thổ': 'Thổ Ngũ Cục',
  };
  return map[element] || '';
}

export function getMenhCucNumber(viTriCungMenh0: number, canNam0: number): number {
  const cuc = getMenhCuc(viTriCungMenh0, canNam0);
  const map: Record<string, number> = {
    'Thủy Nhị Cục': 2,
    'Mộc Tam Cục': 3,
    'Kim Tứ Cục': 4,
    'Thổ Ngũ Cục': 5,
    'Hỏa Lục Cục': 6,
  };
  return map[cuc] || 4;
}

export function getNapAm(lunarYear: number): string {
  const canIndex = (lunarYear - 4) % 10;
  const chiIndex = (lunarYear - 4) % 12;
  return NAP_AM[`${CAN[canIndex]} ${CHI[chiIndex]}`] || '';
}

export function getAmDuong(can: Can): 'Dương' | 'Âm' {
  const yangIndex = [0, 2, 4, 6, 8]; // Giáp, Bính, Mậu, Canh, Nhâm
  return yangIndex.includes(CAN.indexOf(can)) ? 'Dương' : 'Âm';
}

export function getAmDuongNamNu(can: Can, gender: 'Nam' | 'Nữ'): string {
  const amDuong = getAmDuong(can);
  const isThuan = (amDuong === 'Dương' && gender === 'Nam') || (amDuong === 'Âm' && gender === 'Nữ');
  return `${amDuong} ${gender} ${isThuan ? 'Thuận Lý' : 'Nghịch Lý'}`;
}

// Tìm vị trí Tử Vi theo logic repo
// Python:
//   cungDan = 3
//   cucBanDau = cuc
//   while cuc < ngaySinhAmLich: cuc += cucBanDau; cungDan += 1
//   saiLech = cuc - ngaySinhAmLich
//   if saiLech % 2 == 1: saiLech = -saiLech
//   return dichCung(cungDan, saiLech)
export function timTuVi(cucSo: number, ngaySinhAmLich: number): number {
  let cungDan1 = 3; // Dần 1-based
  let cuc = cucSo;
  const cucBanDau = cucSo;

  while (cuc < ngaySinhAmLich) {
    cuc += cucBanDau;
    cungDan1 += 1;
  }

  let saiLech = cuc - ngaySinhAmLich;
  if (saiLech % 2 === 1) {
    saiLech = -saiLech;
  }

  // Chuyển sang 0-based
  return dichCung(cungDan1 - 1, saiLech);
}

// Khoảng cách giữa 2 cung theo chiều
// Python: chieu=1 (thuận), chieu=-1 (nghịch)
// 1-based -> 0-based vẫn giữ nguyên công thức
export function khoangCachCung(cung10: number, cung20: number, chieu: number): number {
  if (chieu === 1) {
    return (cung10 - cung20 + 12) % 12;
  }
  return (cung20 - cung10 + 12) % 12;
}

// Tính đại vận cho 12 cung
// Python: diaBan.nhapDaiHan(cucSo, gioiTinh * amDuongChiNamSinh)
export function calculateDaiVan(
  menhCungIndex: number,
  cucSo: number,
  chiNam0: number,
  gender: 'Nam' | 'Nữ'
): number[] {
  const gioiTinh = gender === 'Nam' ? 1 : -1;
  const amDuongChiNamSinh = chiNam0 % 2 === 0 ? 1 : -1; // Tý=0 dương, Sửu=1 âm, ...
  const chieu = gioiTinh * amDuongChiNamSinh;

  const result: number[] = [];
  for (let i = 0; i < 12; i++) {
    const khoangCach = khoangCachCung(i, menhCungIndex, chieu);
    result.push(cucSo + khoangCach * 10);
  }
  return result;
}

// Tính tiểu hạn cho 12 cung
// Python:
//   khoiHan = dichCung(11, -3 * (chiNam - 1))
//   viTriCungTy1 = dichCung(khoiTieuHan, -gioiTinh * (chiNam - 1))
export function calculateTieuHan(
  chiNam0: number,
  gender: 'Nam' | 'Nữ'
): number[] {
  const gioiTinh = gender === 'Nam' ? 1 : -1;

  // 0-based: Tuất = 10, chiNam0 = chiNam1 - 1
  const khoiTieuHan = dichCung(10, -3 * chiNam0);
  const viTriCungTy = dichCung(khoiTieuHan, -gioiTinh * chiNam0);

  const result: number[] = [];
  for (let i = 0; i < 12; i++) {
    const khoangCach = khoangCachCung(i, viTriCungTy, gioiTinh);
    result.push(khoangCach);
  }
  return result;
}
