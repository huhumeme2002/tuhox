import type { Can, Star } from '../types/tuVi';
import { TU_HOA_TABLE } from '../data/constants';

// An Tứ Hóa vào cung có sao chủ
export function applyTuHoa(can: Can, starsByPalace: Record<number, Star[]>): Record<number, Star[]> {
  const [hoaLoc, hoaQuyen, hoaKhoa, hoaKy] = TU_HOA_TABLE[can];
  const mapping: Record<string, string> = {
    [hoaLoc]: 'Hóa Lộc',
    [hoaQuyen]: 'Hóa Quyền',
    [hoaKhoa]: 'Hóa Khoa',
    [hoaKy]: 'Hóa Kỵ',
  };

  const result: Record<number, Star[]> = {};
  for (let i = 0; i < 12; i++) {
    result[i] = starsByPalace[i].map((s) => ({ ...s }));
    for (const star of result[i]) {
      if (mapping[star.name]) {
        star.tuHoa = mapping[star.name] as 'Hóa Lộc' | 'Hóa Quyền' | 'Hóa Khoa' | 'Hóa Kỵ';
      }
    }
  }
  return result;
}
