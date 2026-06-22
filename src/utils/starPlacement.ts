import type { Star } from '../types/tuVi';
import { dichCung } from './palaceCalc';

// An 14 chính tinh theo logic lasotuvi
export function placeChinhTinh(viTriTuVi: number): Record<number, Star[]> {
  const result: Record<number, Star[]> = {};
  for (let i = 0; i < 12; i++) result[i] = [];

  const viTriLiemTrinh = dichCung(viTriTuVi, 4);
  const viTriThienDong = dichCung(viTriTuVi, 7);
  const viTriVuKhuc = dichCung(viTriTuVi, 8);
  const viTriThaiDuong = dichCung(viTriTuVi, 9);
  const viTriThienCo = dichCung(viTriTuVi, 11);

  // Thiên phủ: dichCung(3, 3 - viTriTuVi) trong Python 1-based
  // Chuyển sang 0-based: dichCung(2, 2 - viTriTuVi)
  const viTriThienPhu = dichCung(2, 2 - viTriTuVi);
  const viTriThaiAm = dichCung(viTriThienPhu, 1);
  const viTriThamLang = dichCung(viTriThienPhu, 2);
  const viTriCuMon = dichCung(viTriThienPhu, 3);
  const viTriThienTuong = dichCung(viTriThienPhu, 4);
  const viTriThienLuong = dichCung(viTriThienPhu, 5);
  const viTriThatSat = dichCung(viTriThienPhu, 6);
  const viTriPhaQuan = dichCung(viTriThienPhu, 10);

  const stars: [number, string][] = [
    [viTriTuVi, 'Tử Vi'],
    [viTriLiemTrinh, 'Liêm Trinh'],
    [viTriThienDong, 'Thiên Đồng'],
    [viTriVuKhuc, 'Vũ Khúc'],
    [viTriThaiDuong, 'Thái Dương'],
    [viTriThienCo, 'Thiên Cơ'],
    [viTriThienPhu, 'Thiên Phủ'],
    [viTriThaiAm, 'Thái Âm'],
    [viTriThamLang, 'Tham Lang'],
    [viTriCuMon, 'Cự Môn'],
    [viTriThienTuong, 'Thiên Tướng'],
    [viTriThienLuong, 'Thiên Lương'],
    [viTriThatSat, 'Thất Sát'],
    [viTriPhaQuan, 'Phá Quân'],
  ];

  for (const [idx, name] of stars) {
    result[idx].push({ name, type: 'chinh' });
  }

  return result;
}

// Chỉ giữ các sao phụ theo yêu cầu: Lộc Tồn, Văn Xương, Văn Khúc
export function placePhuTinh(
  canNam0: number,
  _chiNam0: number,
  _lunarMonth: number,
  _lunarDay: number,
  hourChiIndex: number
): Record<number, Star[]> {
  const result: Record<number, Star[]> = {};
  for (let i = 0; i < 12; i++) result[i] = [];

  const canNam1 = canNam0 + 1;

  // Vòng Lộc Tồn: vị trí theo Can năm trên địa bàn
  const locTonVitri1 = [null, 3, 4, 6, 7, 6, 7, 9, 10, 12, 1][canNam1];
  if (locTonVitri1) {
    result[locTonVitri1 - 1].push({ name: 'Lộc Tồn', type: 'phu' });
  }

  // Văn Khúc: dichCung(5, gioSinh - 1) Python 1-based -> JS dichCung(4, hourChiIndex)
  const viTriVanKhuc = dichCung(4, hourChiIndex);
  result[viTriVanKhuc].push({ name: 'Văn Khúc', type: 'phu' });

  // Văn Xương: dichCung(2, 2 - viTriVanKhuc) Python 1-based -> JS dichCung(1, 1 - viTriVanKhuc)
  const viTriVanXuong = dichCung(1, 1 - viTriVanKhuc);
  result[viTriVanXuong].push({ name: 'Văn Xương', type: 'phu' });

  return result;
}
