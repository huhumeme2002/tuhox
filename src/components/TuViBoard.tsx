import { useMemo, useState } from 'react';
import type { TuViChart, Palace, Can, CungName } from '../types/tuVi';
import { TU_HOA_TABLE, CUNG_NAMES, CAN, CHI } from '../data/constants';
import { Palace as PalaceComponent } from './Palace';

const NGU_HO_DON: Record<string, Can> = {
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

function getYearCanChi(year: number): { can: Can; chi: string; chiIndex: number } {
  const canIndex = ((year - 4) % 10 + 10) % 10;
  const chiIndex = ((year - 4) % 12 + 12) % 12;
  return { can: CAN[canIndex], chi: CHI[chiIndex], chiIndex };
}

function getYearCanMap(yearCan: Can): Record<number, Can> {
  const canDau = NGU_HO_DON[yearCan];
  const canIndex = CAN.indexOf(canDau);
  const map: Record<number, Can> = {};
  for (let i = 0; i < 12; i++) {
    // Dần (index 2) là canDau; dịch theo 12 cung rồi mới quay vòng 10 can.
    map[i] = CAN[(canIndex + (i - 2 + 12) % 12) % 10];
  }
  return map;
}

function getGocCan(chart: TuViChart): Can {
  return (chart.canChi.year.split(' ')[0] as Can) ?? CAN[0];
}

interface Props {
  chart: TuViChart;
}

function calculateLocKy(can: Can, palaces: Palace[]) {
  const [hoaLoc, , , hoaKy] = TU_HOA_TABLE[can];
  const loc1 = palaces.findIndex((p) => p.stars.some((s) => s.name === hoaLoc));
  const ky1 = palaces.findIndex((p) => p.stars.some((s) => s.name === hoaKy));
  if (loc1 === -1 || ky1 === -1) return null;
  return {
    loc: [loc1, (loc1 + 6) % 12, (loc1 + 11) % 12] as const,
    ky: [ky1, (ky1 + 6) % 12, (ky1 + 11) % 12] as const,
  };
}

function calculateExtendedLocKy(
  startCan: Can,
  palaces: Palace[],
  gocLocPalaces: Set<number>,
  gocKyPalaces: Set<number>,
  getCan: (index: number) => Can,
  maxDepth = 10
) {
  const locResult: number[] = [];
  const kyResult: number[] = [];
  let locInfinite = false;
  let kyInfinite = false;

  const [hoaLoc, , , hoaKy] = TU_HOA_TABLE[startCan];
  const l1 = palaces.findIndex((p) => p.stars.some((s) => s.name === hoaLoc));
  const k1 = palaces.findIndex((p) => p.stars.some((s) => s.name === hoaKy));
  if (l1 === -1 || k1 === -1) return { loc: locResult, ky: kyResult, locInfinite, kyInfinite, isInfinite: false };

  // Lộc mở rộng
  let lTriggers = [l1, (l1 + 6) % 12, (l1 + 11) % 12];
  for (let depth = 0; depth < maxDepth; depth++) {
    const trigger = lTriggers.find((idx) => gocLocPalaces.has(idx));
    if (trigger === undefined) break;
    const triggerCan = getCan(trigger);
    const [, , , nextKyStar] = TU_HOA_TABLE[triggerCan];
    const lNext = palaces.findIndex((p) => p.stars.some((s) => s.name === nextKyStar));
    if (lNext === -1) break;
    const lNext5 = (lNext + 6) % 12;
    const lNext6 = (lNext + 11) % 12;
    locResult.push(lNext, lNext5, lNext6);
    if (gocLocPalaces.has(lNext)) {
      locInfinite = true;
      break;
    }
    lTriggers = [lNext, lNext5, lNext6];
  }

  // Kỵ mở rộng
  let kTriggers = [k1, (k1 + 6) % 12, (k1 + 11) % 12];
  for (let depth = 0; depth < maxDepth; depth++) {
    const trigger = kTriggers.find((idx) => gocKyPalaces.has(idx));
    if (trigger === undefined) break;
    const triggerCan = getCan(trigger);
    const [, , , nextKyStar] = TU_HOA_TABLE[triggerCan];
    const kNext = palaces.findIndex((p) => p.stars.some((s) => s.name === nextKyStar));
    if (kNext === -1) break;
    const kNext5 = (kNext + 6) % 12;
    const kNext6 = (kNext + 11) % 12;
    kyResult.push(kNext, kNext5, kNext6);
    if (gocKyPalaces.has(kNext)) {
      kyInfinite = true;
      break;
    }
    kTriggers = [kNext, kNext5, kNext6];
  }

  return { loc: locResult, ky: kyResult, locInfinite, kyInfinite, isInfinite: locInfinite || kyInfinite };
}

function getStrengthLabel(level: number, distance: number, type: 'Lộc' | 'Kỵ', isMenh: boolean) {
  const raw = level - distance + (isMenh ? 0.5 : 0);
  let rank = 0;
  if (raw >= 3.5) rank = 4;
  else if (raw >= 2.5) rank = 3;
  else if (raw >= 1.5) rank = 2;
  else if (raw >= 0.5) rank = 1;

  if (distance === 1) rank = Math.min(rank, 3);
  if (distance >= 2) rank = Math.min(rank, 1);

  if (rank >= 4) return type === 'Lộc' ? 'Cực mạnh' : 'Cực nặng';
  if (rank >= 3) return type === 'Lộc' ? 'Rất mạnh' : 'Rất nặng';
  if (rank >= 2) return type === 'Lộc' ? 'Mạnh' : 'Nặng';
  if (rank >= 1) return 'Vừa';
  return 'Nhẹ';
}

export interface AffectedDaiVan {
  loc: { daiVan: number; label: string; target: string; cungName: string }[];
  ky: { daiVan: number; label: string; target: string; cungName: string }[];
}

export function TuViBoard({ chart }: Props) {
  const { palaces } = chart;
  const getPalace = (index: number) => palaces[index];

  const daiVanOptions = useMemo(
    () => palaces.map((p) => p.daiVan).filter((dv): dv is number => dv !== undefined).sort((a, b) => a - b),
    [palaces]
  );

  type ViewMode = 'tienThien' | 'daiVan' | 'nam';
  const [viewMode, setViewMode] = useState<ViewMode>('tienThien');
  const [selectedDaiVan, setSelectedDaiVan] = useState<number | null>(null);
  const [selectedCungIndex, setSelectedCungIndex] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [currentAge, setCurrentAge] = useState<number | null>(null);
  const [showYearRanking, setShowYearRanking] = useState(false);

  const yearInfo = useMemo(() => {
    if (selectedYear === null) return null;
    const { can, chi, chiIndex } = getYearCanChi(selectedYear);
    const yearCanMap = getYearCanMap(can);
    return { can, chi, chiIndex, yearCanMap };
  }, [selectedYear]);

  // Tuổi âm hiện tại (mặc định tính từ năm đang xem và năm sinh âm lịch)
  const effectiveCurrentAge = useMemo(() => {
    if (selectedYear === null) return null;
    if (currentAge !== null) return currentAge;
    return selectedYear - chart.lunarDate.year + 1;
  }, [selectedYear, currentAge, chart.lunarDate.year]);

  // Đại Vận hiện tại tương ứng với tuổi âm
  const currentDaiVan = useMemo(() => {
    if (effectiveCurrentAge === null) return null;
    const sorted = [...daiVanOptions].sort((a, b) => a - b);
    let result: number | null = null;
    for (const dv of sorted) {
      if (dv <= effectiveCurrentAge) result = dv;
      else break;
    }
    return result;
  }, [effectiveCurrentAge, daiVanOptions]);

  const selectedDaiVanCungIndex = useMemo(
    () => (selectedDaiVan !== null ? palaces.findIndex((p) => p.daiVan === selectedDaiVan) : null),
    [selectedDaiVan, palaces]
  );

  const currentDaiVanCungIndex = useMemo(
    () => (currentDaiVan !== null ? palaces.findIndex((p) => p.daiVan === currentDaiVan) : null),
    [currentDaiVan, palaces]
  );

  const activeDaiVanCungIndex = selectedDaiVanCungIndex ?? currentDaiVanCungIndex;

  // Mệnh và Can đang active (gốc, Đại Vận, hoặc Năm)
  const gocMenhIndex = useMemo(() => palaces.findIndex((p) => p.isMenh), [palaces]);

  const activeMenhIndex = useMemo(() => {
    if (selectedYear !== null && yearInfo) return yearInfo.chiIndex;
    return gocMenhIndex;
  }, [selectedYear, yearInfo, gocMenhIndex]);

  const getActiveCan = useMemo(() => {
    if (selectedYear !== null && yearInfo) {
      return (index: number) => yearInfo.yearCanMap[index];
    }
    return (index: number) => palaces[index].can;
  }, [selectedYear, yearInfo, palaces]);

  // Vai trò chung của cung đang click (ưu tiên năm, sau đó Đại Vận, cuối cùng gốc)
  const clickRoleIndex = useMemo(() => {
    if (selectedCungIndex === null) return null;
    if (selectedYear !== null) return (selectedCungIndex - activeMenhIndex + 12) % 12;
    if (activeDaiVanCungIndex !== null) return (selectedCungIndex - activeDaiVanCungIndex + 12) % 12;
    return (selectedCungIndex - gocMenhIndex + 12) % 12;
  }, [selectedCungIndex, selectedYear, activeMenhIndex, activeDaiVanCungIndex, gocMenhIndex]);

  // Cung đóng vai trò chung trong từng tầng
  const gocRoleCungIndex = useMemo(() => {
    if (clickRoleIndex === null) return null;
    return (gocMenhIndex + clickRoleIndex) % 12;
  }, [clickRoleIndex, gocMenhIndex]);

  const daiVanRoleCungIndex = useMemo(() => {
    if (clickRoleIndex === null || activeDaiVanCungIndex === null) return null;
    return (activeDaiVanCungIndex + clickRoleIndex) % 12;
  }, [clickRoleIndex, activeDaiVanCungIndex]);

  const namRoleCungIndex = useMemo(() => {
    if (clickRoleIndex === null) return null;
    return (activeMenhIndex + clickRoleIndex) % 12;
  }, [clickRoleIndex, activeMenhIndex]);

  // Lộc/Kỵ của vai trò chung trong từng tầng
  const gocLocKy = useMemo(() => {
    if (gocRoleCungIndex === null) return null;
    return calculateLocKy(palaces[gocRoleCungIndex].can, palaces);
  }, [gocRoleCungIndex, palaces]);

  const daiVanLocKy = useMemo(() => {
    if (daiVanRoleCungIndex === null) return null;
    // Đại Vận luôn tính theo Can gốc của cung đang xem trong Đại Vận
    return calculateLocKy(palaces[daiVanRoleCungIndex].can, palaces);
  }, [daiVanRoleCungIndex, palaces]);

  const namLocKy = useMemo(() => {
    if (namRoleCungIndex === null) return null;
    return calculateLocKy(getActiveCan(namRoleCungIndex), palaces);
  }, [namRoleCungIndex, getActiveCan, palaces]);

  // Lộc/Kỵ của layer đang active (dùng để highlight và panel chính)
  const activeLocKy = selectedYear !== null ? namLocKy : gocLocKy;

  // Lộc/Kỵ của chính cung Đại Vận đang click (khi đang chọn Đại Vận)
  const daiVanClickLocKy = useMemo(() => {
    if (selectedCungIndex === null || selectedDaiVan === null) return null;
    return calculateLocKy(palaces[selectedCungIndex].can, palaces);
  }, [selectedCungIndex, selectedDaiVan, palaces]);

  // Lộc/Kỵ dùng cho panel chi tiết đầu tiên: ưu tiên năm, sau đó Đại Vận click, cuối cùng active layer
  const detailLocKy = selectedYear !== null ? namLocKy : selectedDaiVan !== null ? daiVanClickLocKy : activeLocKy;

  // Các cung có Hóa Lộc / Hóa Kỵ gốc theo Can năm sinh (dùng để trigger Lộc/Kỵ mở rộng)
  const gocTuHoaPalaces = useMemo(() => {
    const loc = new Set<number>();
    const ky = new Set<number>();
    const gocCan = getGocCan(chart);
    const [hoaLoc, , , hoaKy] = TU_HOA_TABLE[gocCan];
    for (const p of palaces) {
      for (const s of p.stars) {
        if (s.name === hoaLoc) loc.add(p.index);
        if (s.name === hoaKy) ky.add(p.index);
      }
    }
    return { loc, ky };
  }, [chart, palaces]);

  // Tên vai trò của một cung trong Đại Vận đang chọn
  const getDaiVanRoleName = useMemo(() => {
    if (activeDaiVanCungIndex === null) return null;
    return (index: number) => CUNG_NAMES[(index - activeDaiVanCungIndex + 12) % 12];
  }, [activeDaiVanCungIndex]);

  // Tên vai trò của một cung trong năm đang chọn
  const getYearRoleName = useMemo(() => {
    if (selectedYear === null) return null;
    return (index: number) => CUNG_NAMES[(index - activeMenhIndex + 12) % 12];
  }, [selectedYear, activeMenhIndex]);

  // Tên hiển thị cho một cung: ưu tiên Đại Vận, sau đó đến vai trò năm, cuối cùng là tên gốc
  const getCungDisplayName = (index: number) => {
    if (selectedDaiVan !== null && getDaiVanRoleName) return `${getDaiVanRoleName(index)} Vận`;
    if (selectedYear !== null && getYearRoleName) return getYearRoleName(index);
    return palaces[index].name;
  };

  // Lộc/Kỵ mở rộng của vai trò chung trong từng tầng
  const gocExtendedLocKy = useMemo(() => {
    if (gocRoleCungIndex === null) return null;
    return calculateExtendedLocKy(
      palaces[gocRoleCungIndex].can,
      palaces,
      gocTuHoaPalaces.loc,
      gocTuHoaPalaces.ky,
      (index: number) => palaces[index].can
    );
  }, [gocRoleCungIndex, palaces, gocTuHoaPalaces]);

  const daiVanExtendedLocKy = useMemo(() => {
    if (daiVanRoleCungIndex === null) return null;
    // Đại Vận tính theo Can gốc của cung đang xem trong Đại Vận
    return calculateExtendedLocKy(
      palaces[daiVanRoleCungIndex].can,
      palaces,
      gocTuHoaPalaces.loc,
      gocTuHoaPalaces.ky,
      (index: number) => palaces[index].can
    );
  }, [daiVanRoleCungIndex, palaces, gocTuHoaPalaces]);

  const namExtendedLocKy = useMemo(() => {
    if (namRoleCungIndex === null) return null;
    // K1-K3 đi theo lớp đang xem, nhưng can của cung trigger trong chuỗi mở rộng lấy theo lá số gốc.
    return calculateExtendedLocKy(
      getActiveCan(namRoleCungIndex),
      palaces,
      gocTuHoaPalaces.loc,
      gocTuHoaPalaces.ky,
      (index: number) => palaces[index].can
    );
  }, [namRoleCungIndex, getActiveCan, palaces, gocTuHoaPalaces]);

  // ===== KẾT LUẬN TỔNG HỢP =====
  const CUNG_INTERPRETATION: Record<CungName, string> = {
    'Mệnh': 'bản thân',
    'Phụ Mẫu': 'cha mẹ',
    'Phúc Đức': 'phúc đức, tổ tiên',
    'Điền Trạch': 'nhà cửa, đất đai',
    'Quan Lộc': 'sự nghiệp, công danh',
    'Nô Bộc': 'bạn bè, người giúp đỡ',
    'Thiên Di': 'di chuyển, xuất hành',
    'Tật Ách': 'bệnh tật, tai ương',
    'Tài Bạch': 'tiền bạc, tài sản',
    'Tử Tức': 'con cái',
    'Phu Thê': 'vợ chồng',
    'Huynh Đệ': 'anh chị em',
  };

  interface KetLuanItem {
    type: 'Lộc' | 'Kỵ';
    label: string;
    target: string;
    strengthLabel: string;
    isInfinite?: boolean;
    sourceRole: CungName;
  }

  const ketLuan = useMemo<{
    tienThien: KetLuanItem[];
    daiVan: KetLuanItem[];
    nam: KetLuanItem[];
  }>(() => {
    const result = {
      tienThien: [] as KetLuanItem[],
      daiVan: [] as KetLuanItem[],
      nam: [] as KetLuanItem[],
    };
    if (selectedCungIndex === null || clickRoleIndex === null) return result;

    const clickRoleName = CUNG_NAMES[clickRoleIndex];

    const addImpacts = (
      sourceLocKy: { loc: readonly number[]; ky: readonly number[]; isInfinite?: boolean; locInfinite?: boolean; kyInfinite?: boolean } | null,
      targetMenhIndex: number | null,
      targetRoleIndex: number | null,
      distance: number,
      targetLayerName: string,
      resultArray: KetLuanItem[],
      extended = false
    ) => {
      if (!sourceLocKy || targetMenhIndex === null || targetRoleIndex === null) return;
      const startLevel = extended ? 4 : 1;
      sourceLocKy.loc.forEach((idx, i) => {
        const level = i + startLevel;
        const isMenh = idx === targetMenhIndex;
        const isRole = idx === targetRoleIndex;
        if (!isMenh && !isRole) return;
        resultArray.push({
          type: 'Lộc',
          label: `L${level}`,
          target: isMenh ? `Mệnh ${targetLayerName}` : `${clickRoleName} ${targetLayerName}`,
          strengthLabel: getStrengthLabel(level, distance, 'Lộc', isMenh),
          isInfinite: extended ? sourceLocKy.locInfinite : undefined,
          sourceRole: clickRoleName,
        });
      });
      sourceLocKy.ky.forEach((idx, i) => {
        const level = i + startLevel;
        const isMenh = idx === targetMenhIndex;
        const isRole = idx === targetRoleIndex;
        if (!isMenh && !isRole) return;
        resultArray.push({
          type: 'Kỵ',
          label: `K${level}`,
          target: isMenh ? `Mệnh ${targetLayerName}` : `${clickRoleName} ${targetLayerName}`,
          strengthLabel: getStrengthLabel(level, distance, 'Kỵ', isMenh),
          isInfinite: extended ? sourceLocKy.kyInfinite : undefined,
          sourceRole: clickRoleName,
        });
      });
    };

    // Tiên thiên → các tầng
    addImpacts(gocLocKy, gocMenhIndex, gocRoleCungIndex, 0, 'tiên thiên', result.tienThien);
    addImpacts(gocLocKy, activeDaiVanCungIndex, daiVanRoleCungIndex, 1, 'Vận', result.tienThien);
    addImpacts(gocLocKy, activeMenhIndex, namRoleCungIndex, 2, 'năm', result.tienThien);
    addImpacts(gocExtendedLocKy, gocRoleCungIndex, gocRoleCungIndex, 0, 'tiên thiên', result.tienThien, true);
    addImpacts(gocExtendedLocKy, activeDaiVanCungIndex, daiVanRoleCungIndex, 1, 'Vận', result.tienThien, true);
    addImpacts(gocExtendedLocKy, activeMenhIndex, namRoleCungIndex, 2, 'năm', result.tienThien, true);

    // Đại Vận → các tầng
    addImpacts(daiVanLocKy, gocMenhIndex, gocRoleCungIndex, 1, 'tiên thiên', result.daiVan);
    addImpacts(daiVanLocKy, activeDaiVanCungIndex, daiVanRoleCungIndex, 0, 'Vận', result.daiVan);
    addImpacts(daiVanLocKy, activeMenhIndex, namRoleCungIndex, 1, 'năm', result.daiVan);
    addImpacts(daiVanExtendedLocKy, gocMenhIndex, gocRoleCungIndex, 1, 'tiên thiên', result.daiVan, true);
    addImpacts(daiVanExtendedLocKy, activeDaiVanCungIndex, daiVanRoleCungIndex, 0, 'Vận', result.daiVan, true);
    addImpacts(daiVanExtendedLocKy, activeMenhIndex, namRoleCungIndex, 1, 'năm', result.daiVan, true);

    // Năm → các tầng
    addImpacts(namLocKy, gocMenhIndex, gocRoleCungIndex, 2, 'tiên thiên', result.nam);
    addImpacts(namLocKy, activeDaiVanCungIndex, daiVanRoleCungIndex, 1, 'Vận', result.nam);
    addImpacts(namLocKy, activeMenhIndex, namRoleCungIndex, 0, 'năm', result.nam);
    addImpacts(namExtendedLocKy, gocMenhIndex, gocRoleCungIndex, 2, 'tiên thiên', result.nam, true);
    addImpacts(namExtendedLocKy, activeDaiVanCungIndex, daiVanRoleCungIndex, 1, 'Vận', result.nam, true);
    addImpacts(namExtendedLocKy, activeMenhIndex, namRoleCungIndex, 0, 'năm', result.nam, true);

    return result;
  }, [selectedCungIndex, clickRoleIndex, gocMenhIndex, activeDaiVanCungIndex, activeMenhIndex, gocRoleCungIndex, daiVanRoleCungIndex, namRoleCungIndex, gocLocKy, daiVanLocKy, namLocKy, gocExtendedLocKy, daiVanExtendedLocKy, namExtendedLocKy]);



  // Ảnh hưởng Đại Vận bởi Lộc/Kỵ tiên thiên (L1/L2/L3, K1/K2/K3)
  const affectedDaiVan = useMemo<AffectedDaiVan>(() => {
    const result: AffectedDaiVan = { loc: [], ky: [] };
    if (selectedCungIndex === null || !activeLocKy) return result;

    const distanceFromMenh = (selectedCungIndex - activeMenhIndex + 12) % 12;

    for (const p of palaces) {
      const dv = p.daiVan;
      if (dv === undefined) continue;
      const targetDaiVan = selectedDaiVan !== null ? selectedDaiVan : currentDaiVan;
      if (targetDaiVan !== null && dv !== targetDaiVan) continue;
      const menhVan = p.index;
      const tuongUngVan = (menhVan + distanceFromMenh) % 12;
      const gocName = palaces[selectedCungIndex].name;

      const menhTarget = selectedDaiVan !== null && getDaiVanRoleName
        ? 'Mệnh Vận'
        : `Mệnh Vận (${getCungDisplayName(menhVan)})`;
      const tuongUngTarget = selectedDaiVan !== null && getDaiVanRoleName
        ? `${gocName} Vận`
        : `${gocName} Vận (${getCungDisplayName(tuongUngVan)})`;

      activeLocKy.loc.forEach((idx, i) => {
        if (idx === menhVan) result.loc.push({ daiVan: dv, label: `L${i + 1}`, target: menhTarget, cungName: palaces[menhVan].name });
        if (idx === tuongUngVan) result.loc.push({ daiVan: dv, label: `L${i + 1}`, target: tuongUngTarget, cungName: palaces[tuongUngVan].name });
      });
      activeLocKy.ky.forEach((idx, i) => {
        if (idx === menhVan) result.ky.push({ daiVan: dv, label: `K${i + 1}`, target: menhTarget, cungName: palaces[menhVan].name });
        if (idx === tuongUngVan) result.ky.push({ daiVan: dv, label: `K${i + 1}`, target: tuongUngTarget, cungName: palaces[tuongUngVan].name });
      });
    }

    result.loc.sort((a, b) => a.daiVan - b.daiVan);
    result.ky.sort((a, b) => a.daiVan - b.daiVan);
    return result;
  }, [selectedCungIndex, selectedDaiVan, currentDaiVan, activeMenhIndex, getDaiVanRoleName, getYearRoleName, activeLocKy, palaces]);

  // Lộc/Kỵ tiên thiên của cung gốc có cùng vai trò với cung đang click trong Đại Vận
  const sameRoleTienThien = useMemo(() => {
    if (selectedCungIndex === null || selectedDaiVanCungIndex === null || selectedDaiVan === null) return null;
    const roleIndex = (selectedCungIndex - selectedDaiVanCungIndex + 12) % 12;
    const sameRoleGocIndex = (gocMenhIndex + roleIndex) % 12;
    const locKy = calculateLocKy(palaces[sameRoleGocIndex].can, palaces);
    if (!locKy) return null;

    const getRole = (idx: number) => CUNG_NAMES[(idx - selectedDaiVanCungIndex + 12) % 12];
    const roleName = CUNG_NAMES[roleIndex];

    const loc = locKy.loc.map((idx, i) => ({
      label: `L${i + 1}`,
      target: `${getRole(idx)} Vận`,
      isKey: idx === selectedDaiVanCungIndex || idx === selectedCungIndex,
    }));
    const ky = locKy.ky.map((idx, i) => ({
      label: `K${i + 1}`,
      target: `${getRole(idx)} Vận`,
      isKey: idx === selectedDaiVanCungIndex || idx === selectedCungIndex,
    }));

    return { roleName, loc, ky };
  }, [selectedCungIndex, selectedDaiVanCungIndex, selectedDaiVan, gocMenhIndex, palaces]);

  // Lộc/Kỵ của cung Đại Vận đang click ảnh hưởng đến Mệnh gốc và cùng vai trò gốc
  const daiVanToGoc = useMemo(() => {
    if (selectedCungIndex === null || selectedDaiVan === null || selectedDaiVanCungIndex === null || !activeLocKy) return null;
    const roleIndex = (selectedCungIndex - selectedDaiVanCungIndex + 12) % 12;
    const sameRoleGocIndex = (activeMenhIndex + roleIndex) % 12;
    const roleName = getYearRoleName?.(sameRoleGocIndex) ?? CUNG_NAMES[roleIndex];

    const loc = activeLocKy.loc
      .map((idx, i) => ({ idx, label: `L${i + 1}` }))
      .filter((item) => item.idx === activeMenhIndex || item.idx === sameRoleGocIndex)
      .map((item) => ({
        ...item,
        target: item.idx === activeMenhIndex ? 'Mệnh' : `${roleName}`,
      }));
    const ky = activeLocKy.ky
      .map((idx, i) => ({ idx, label: `K${i + 1}` }))
      .filter((item) => item.idx === activeMenhIndex || item.idx === sameRoleGocIndex)
      .map((item) => ({
        ...item,
        target: item.idx === activeMenhIndex ? 'Mệnh' : `${roleName}`,
      }));

    return { roleName, loc, ky };
  }, [selectedCungIndex, selectedDaiVan, selectedDaiVanCungIndex, activeMenhIndex, getYearRoleName, activeLocKy, palaces]);

  // Lộc/Kỵ mở rộng ảnh hưởng đến Mệnh gốc và cùng vai trò gốc
  const extendedToGoc = useMemo(() => {
    if (selectedCungIndex === null || !namExtendedLocKy || gocRoleCungIndex === null) return null;
    const sameRoleGocIndex = gocRoleCungIndex;
    const roleName = palaces[sameRoleGocIndex].name;

    const loc = namExtendedLocKy.loc
      .map((idx, i) => ({ idx, label: `L${i + 4}` }))
      .filter((item) => item.idx === activeMenhIndex || item.idx === sameRoleGocIndex)
      .map((item) => ({
        ...item,
        target: item.idx === activeMenhIndex ? 'Mệnh' : `${roleName}`,
      }));
    const ky = namExtendedLocKy.ky
      .map((idx, i) => ({ idx, label: `K${i + 4}` }))
      .filter((item) => item.idx === activeMenhIndex || item.idx === sameRoleGocIndex)
      .map((item) => ({
        ...item,
        target: item.idx === activeMenhIndex ? 'Mệnh' : `${roleName}`,
      }));

    return { roleName, loc, ky };
  }, [selectedCungIndex, gocRoleCungIndex, namExtendedLocKy, palaces]);

  // Kỵ bị hãm (xuất vào Mệnh hoặc chính cung đang click)
  const badKy = useMemo(() => {
    if (selectedCungIndex === null || !detailLocKy) return null;
    const badCungs = selectedYear !== null
      ? [activeMenhIndex, selectedCungIndex]
      : selectedDaiVan !== null && activeDaiVanCungIndex !== null
        ? [activeDaiVanCungIndex, selectedCungIndex]
        : [activeMenhIndex, selectedCungIndex];
    return detailLocKy.ky
      .map((idx, i) => ({ idx, label: `K${i + 1}` }))
      .filter((item) => badCungs.includes(item.idx));
  }, [selectedCungIndex, selectedDaiVan, activeDaiVanCungIndex, activeMenhIndex, detailLocKy]);

  // Xếp hạng năm đẹp/xấu trong Đại Vận cho cung đang chọn
  // Copy logic Kết luận tổng hợp ở tab năm, chỉ giữ lại Đại Vận và Năm (bỏ Tiên thiên).
  const daiVanYearRanking = useMemo(() => {
    const targetDaiVan = selectedDaiVan ?? currentDaiVan;
    if (selectedCungIndex === null || targetDaiVan === null || activeDaiVanCungIndex === null) return null;

    const clickRoleIndex = (selectedCungIndex - activeDaiVanCungIndex + 12) % 12;
    const selectedCungName = CUNG_NAMES[clickRoleIndex];

    const sortedDaiVan = [...daiVanOptions].sort((a, b) => a - b);
    const dvIndex = sortedDaiVan.indexOf(targetDaiVan);
    const nextDaiVan = sortedDaiVan[dvIndex + 1];
    const endAge = nextDaiVan !== undefined ? nextDaiVan - 1 : targetDaiVan + 9;

    // Lộc/Kỵ gốc theo Can năm sinh để trigger mở rộng
    const gocCan = (chart.canChi.year.split(' ')[0] as Can) ?? CAN[0];
    const [gocHoaLoc, , , gocHoaKy] = TU_HOA_TABLE[gocCan];
    const gocLocPalaces = new Set<number>();
    const gocKyPalaces = new Set<number>();
    for (const p of palaces) {
      for (const s of p.stars) {
        if (s.name === gocHoaLoc) gocLocPalaces.add(p.index);
        if (s.name === gocHoaKy) gocKyPalaces.add(p.index);
      }
    }

    type YearImpactDetail = {
      text: string;
      point: number;
      good: boolean;
      target: string;
    };

    const result: {
      year: number;
      age: number;
      can: string;
      chi: string;
      score: number;
      level: 'very-good' | 'good' | 'neutral' | 'bad' | 'very-bad';
      details: YearImpactDetail[];
    }[] = [];

    // Lộc/Kỵ của Quan Vận (Đại Vận) — tính theo Can gốc của cung đang click trong Đại Vận
    const dvRoleCan = palaces[selectedCungIndex].can;
    const dvRoleLocKy = calculateLocKy(dvRoleCan, palaces);
    if (!dvRoleLocKy) return null;
    const dvExtendedLocKy = calculateExtendedLocKy(
      dvRoleCan,
      palaces,
      gocLocPalaces,
      gocKyPalaces,
      (index: number) => palaces[index].can
    );
    const gocRoleIndex = (gocMenhIndex + clickRoleIndex) % 12;
    const gocRoleCan = palaces[gocRoleIndex].can;
    const gocRoleLocKy = calculateLocKy(gocRoleCan, palaces);
    if (!gocRoleLocKy) return null;
    const gocExtendedLocKy = calculateExtendedLocKy(
      gocRoleCan,
      palaces,
      gocLocPalaces,
      gocKyPalaces,
      (index: number) => palaces[index].can
    );

    for (let age = targetDaiVan; age <= endAge; age++) {
      const year = chart.lunarDate.year + age - 1;
      const { can, chi, chiIndex } = getYearCanChi(year);
      const yearCanMap = getYearCanMap(can);

      const namRoleIndex = (chiIndex + clickRoleIndex) % 12;
      const namRoleCan = yearCanMap[namRoleIndex];
      const namRoleLocKy = calculateLocKy(namRoleCan, palaces);
      if (!namRoleLocKy) continue;
      const namExtendedLocKy = calculateExtendedLocKy(
        namRoleCan,
        palaces,
        gocLocPalaces,
        gocKyPalaces,
        (index: number) => palaces[index].can
      );

      const details: YearImpactDetail[] = [];
      let score = 0;

      const addImpacts = (
        sourceLocKy: { loc: readonly number[]; ky: readonly number[]; isInfinite?: boolean; locInfinite?: boolean; kyInfinite?: boolean },
        targetMenhIndex: number | null,
        targetRoleIndex: number | null,
        distance: number,
        sourceLayerName: string,
        targetLayerName: string,
        extended = false
      ) => {
        if (targetMenhIndex === null || targetRoleIndex === null) return;
        const startLevel = extended ? 4 : 1;
        const maxExtendedItems = 6; // L4-L6 / K4-K6
        const sameTarget = targetMenhIndex === targetRoleIndex;
        const sourceLabel = `${selectedCungName} ${sourceLayerName}`;

        const locList = extended ? sourceLocKy.loc.slice(0, maxExtendedItems) : sourceLocKy.loc;
        const kyList = extended ? sourceLocKy.ky.slice(0, maxExtendedItems) : sourceLocKy.ky;
        const pushImpactSeries = (
          type: 'Lộc' | 'Kỵ',
          hits: readonly number[],
          infinite: boolean | undefined
        ) => {
          const isGood = type === 'Lộc';
          const symbol = isGood ? 'L' : 'K';
          const infiniteLevel = hits.length + startLevel;
          const infiniteMenh = Boolean(infinite && hits.some((idx) => idx === targetMenhIndex));
          const infiniteRole = Boolean(infinite && !sameTarget && hits.some((idx) => idx === targetRoleIndex));

          hits.forEach((idx, i) => {
            const level = i + startLevel;
            const isMenh = idx === targetMenhIndex;
            const isRole = idx === targetRoleIndex;
            if (!isMenh && !isRole) return;
            if (sameTarget && !isMenh) return;
            if ((isMenh && infiniteMenh) || (isRole && infiniteRole)) return;

            const target = isMenh ? `Mệnh ${targetLayerName}` : `${selectedCungName} ${targetLayerName}`;
            const strength = getStrengthLabel(level, distance, type, isMenh);
            const point = (level - distance + (isMenh ? 0.5 : 0)) * (isGood ? 1 : -1);
            score += point;
            details.push({ text: `${symbol}${level} ${sourceLabel} xung vào ${target} (${strength})`, point, good: isGood, target });
          });

          if (!infinite) return;

          const pushInfinite = (isMenh: boolean) => {
            const target = isMenh ? `Mệnh ${targetLayerName}` : `${selectedCungName} ${targetLayerName}`;
            const strength = getStrengthLabel(infiniteLevel, distance, type, isMenh);
            const point = (infiniteLevel - distance + (isMenh ? 0.5 : 0)) * (isGood ? 1 : -1);
            score += point;
            details.push({
              text: `${symbol}∞ ${sourceLabel} xung vào ${target} (${strength}, khởi từ ${symbol}${startLevel}) (Vô hạn)`,
              point,
              good: isGood,
              target,
            });
          };

          if (infiniteMenh) pushInfinite(true);
          if (infiniteRole) pushInfinite(false);
        };

        pushImpactSeries('Lộc', locList, extended ? sourceLocKy.locInfinite : false);
        pushImpactSeries('Kỵ', kyList, extended ? sourceLocKy.kyInfinite : false);
      };

      // Đại Vận → Đại Vận (tự xung): ảnh hưởng đến Mệnh Vận và Quan Vận
      addImpacts(dvRoleLocKy, activeDaiVanCungIndex, selectedCungIndex, 0, 'Vận', 'Vận');
      addImpacts(dvExtendedLocKy, activeDaiVanCungIndex, selectedCungIndex, 0, 'Vận', 'Vận', true);
      // Tiên thiên → Năm: ảnh hưởng đến Mệnh năm và cùng vai trò năm
      addImpacts(gocRoleLocKy, chiIndex, namRoleIndex, 2, 'tiên thiên', 'năm');
      addImpacts(gocExtendedLocKy, chiIndex, namRoleIndex, 2, 'tiên thiên', 'năm', true);
      // Đại Vận → Năm: ảnh hưởng đến Mệnh năm và Quan Lộc năm
      addImpacts(dvRoleLocKy, chiIndex, namRoleIndex, 1, 'Vận', 'năm');
      addImpacts(dvExtendedLocKy, chiIndex, namRoleIndex, 1, 'Vận', 'năm', true);
      // Năm → Tiên thiên: ảnh hưởng đến Mệnh gốc và cùng vai trò gốc
      addImpacts(namRoleLocKy, gocMenhIndex, gocRoleIndex, 2, 'năm', 'tiên thiên');
      addImpacts(namExtendedLocKy, gocMenhIndex, gocRoleIndex, 2, 'năm', 'tiên thiên', true);
      // Năm → Đại Vận: ảnh hưởng đến Mệnh Vận và Quan Vận
      addImpacts(namRoleLocKy, activeDaiVanCungIndex, selectedCungIndex, 1, 'năm', 'Vận');
      addImpacts(namExtendedLocKy, activeDaiVanCungIndex, selectedCungIndex, 1, 'năm', 'Vận', true);
      // Năm → Năm (tự xung): ảnh hưởng đến Mệnh năm và Quan Lộc năm
      addImpacts(namRoleLocKy, chiIndex, namRoleIndex, 0, 'năm', 'năm');
      addImpacts(namExtendedLocKy, chiIndex, namRoleIndex, 0, 'năm', 'năm', true);

      let level: typeof result[number]['level'] = 'neutral';
      if (score >= 5) level = 'very-good';
      else if (score >= 1) level = 'good';
      else if (score <= -5) level = 'very-bad';
      else if (score <= -1) level = 'bad';

      result.push({ year, age, can, chi, score, level, details });
    }

    return result.sort((a, b) => b.score - a.score);
  }, [selectedCungIndex, selectedDaiVan, currentDaiVan, activeDaiVanCungIndex, gocMenhIndex, palaces, daiVanOptions, chart.lunarDate.year, chart.canChi.year]);

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'very-good': return { text: 'Rất đẹp', color: 'text-emerald-700 bg-emerald-100 ring-emerald-300' };
      case 'good': return { text: 'Đẹp', color: 'text-blue-700 bg-blue-100 ring-blue-300' };
      case 'neutral': return { text: 'Bình thường', color: 'text-gray-700 bg-gray-100 ring-gray-300' };
      case 'bad': return { text: 'Xấu', color: 'text-orange-700 bg-orange-100 ring-orange-300' };
      case 'very-bad': return { text: 'Rất xấu', color: 'text-red-700 bg-red-100 ring-red-300' };
      default: return { text: '', color: '' };
    }
  };

  const getTargetLayerOrder = (target: string) => {
    if (target.includes('tiên thiên')) return 0;
    if (target.includes('Vận')) return 1;
    if (target.includes('năm')) return 2;
    return 3;
  };

  const renderYearImpactGroups = (
    details: { text: string; point: number; good: boolean; target: string }[],
    prefix: string
  ) => {
    const grouped = details.reduce<Array<{ target: string; items: typeof details; firstIndex: number }>>((acc, detail, index) => {
      const existing = acc.find((group) => group.target === detail.target);
      if (existing) {
        existing.items.push(detail);
      } else {
        acc.push({ target: detail.target, items: [detail], firstIndex: index });
      }
      return acc;
    }, []);

    grouped.sort((a, b) => {
      const layerDiff = getTargetLayerOrder(a.target) - getTargetLayerOrder(b.target);
      if (layerDiff !== 0) return layerDiff;
      const menhDiff = Number(!a.target.startsWith('Mệnh')) - Number(!b.target.startsWith('Mệnh'));
      if (menhDiff !== 0) return menhDiff;
      return a.firstIndex - b.firstIndex;
    });

    return grouped.map(({ target, items }, groupIndex) => (
      <div key={`${prefix}-${groupIndex}`} className="mt-1 first:mt-0">
        <p className="text-[11px] md:text-xs font-semibold text-gray-800">{target}</p>
        <ul className="mt-0.5 space-y-0.5">
          {items.map((detail, detailIndex) => (
            <li
              key={`${prefix}-${groupIndex}-${detailIndex}`}
              className={`text-[11px] md:text-xs ${detail.good ? 'text-blue-700' : 'text-red-700'}`}
            >
              {detail.text} ({detail.point > 0 ? '+' : ''}{detail.point})
            </li>
          ))}
        </ul>
      </div>
    ));
  };

  return (
    <div className="bg-white p-3 md:p-5 rounded-xl shadow-md border border-amber-100 mt-6">
      {/* Header info */}
      <div className="mb-4 text-center space-y-2">
        <h2 className="text-xl md:text-2xl font-bold text-amber-900 font-serif">Lá số Tử Vi</h2>
        <p className="text-sm text-gray-700">
          <span className="font-semibold">{chart.name || 'Vô danh'}</span>
          <span className="mx-1">·</span>
          Dương: {chart.birthDate.split('-').reverse().join('/')}
          <span className="mx-1">·</span>
          Âm: {chart.lunarDate.day}/{chart.lunarDate.month}/{chart.lunarDate.year}
          {chart.lunarDate.leap ? ' (nhuận)' : ''}
        </p>
        <div className="flex flex-wrap justify-center gap-1.5 text-xs">
          <span className="px-2 py-1 bg-amber-100 text-amber-900 rounded-md font-medium">Năm: {chart.canChi.year}</span>
          <span className="px-2 py-1 bg-amber-100 text-amber-900 rounded-md font-medium">Tháng: {chart.canChi.month}</span>
          <span className="px-2 py-1 bg-amber-100 text-amber-900 rounded-md font-medium">Ngày: {chart.canChi.day}</span>
          <span className="px-2 py-1 bg-amber-100 text-amber-900 rounded-md font-medium">Giờ: {chart.canChi.hour}</span>
        </div>
        <div className="flex flex-wrap justify-center gap-3 text-sm font-medium">
          <span className="text-red-600">{chart.menhCung.position}</span>
          <span className="text-blue-600">{chart.thanCung.position}</span>
          <span className="text-gray-700">{chart.amDuong}</span>
          <span className="text-amber-800 font-bold">{chart.menhCuc}</span>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-2 pt-1">
          {/* Segmented control: Tiên thien | Đại Vận | Năm */}
          <div className="inline-flex rounded-full border border-amber-300/80 overflow-hidden bg-amber-50/80 p-1 shadow-sm">
            {([
              { key: 'tienThien', label: 'Tiên thiên' },
              { key: 'daiVan', label: 'Đại Vận' },
              { key: 'nam', label: 'Năm' },
            ] as { key: ViewMode; label: string }[]).map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => {
                  setViewMode(m.key);
                  setSelectedCungIndex(null);
                  setShowYearRanking(false);
                  if (m.key === 'tienThien') {
                    setSelectedDaiVan(null);
                    setSelectedYear(null);
                    setCurrentAge(null);
                  } else if (m.key === 'daiVan') {
                    setSelectedYear(null);
                    setCurrentAge(null);
                    setSelectedDaiVan(daiVanOptions[0] ?? null);
                  } else {
                    setSelectedDaiVan(null);
                    setSelectedYear(new Date().getFullYear());
                    setCurrentAge(null);
                  }
                }}
                className={`px-5 py-2 text-xs md:text-sm font-bold rounded-full transition-all duration-300 ${
                  viewMode === m.key
                    ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md ring-1 ring-amber-400/50'
                    : 'text-amber-900 hover:bg-amber-100/80 hover:text-amber-700'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Control phụ theo mode */}
          <div className="flex flex-wrap justify-center gap-2 items-center">
            {viewMode === 'daiVan' && (
              <select
                value={selectedDaiVan ?? ''}
                onChange={(e) => setSelectedDaiVan(e.target.value ? Number(e.target.value) : null)}
                className="text-xs md:text-sm border border-amber-200 rounded-full px-4 py-2 bg-white/90 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all hover:border-amber-300 hover:shadow-sm"
              >
                {daiVanOptions.map((dv) => (
                  <option key={`dv-${dv}`} value={dv}>
                    Đại vận {dv}
                  </option>
                ))}
              </select>
            )}

            {viewMode === 'nam' && (
              <>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Nhập năm dương lịch"
                    value={selectedYear ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedYear(val ? Number(val) : null);
                    }}
                    className="text-xs md:text-sm border border-amber-200 rounded-full px-4 py-2 w-36 bg-white/90 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all hover:border-amber-300 hover:shadow-sm"
                  />
                  {selectedYear !== null && (
                    <button
                      onClick={() => setSelectedYear(null)}
                      className="text-xs md:text-sm px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-all hover:shadow-sm"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Tuổi âm"
                    value={currentAge ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCurrentAge(val ? Number(val) : null);
                    }}
                    className="text-xs md:text-sm border border-amber-200 rounded-full px-4 py-2 w-20 bg-white/90 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all hover:border-amber-300 hover:shadow-sm"
                  />
                  {currentAge !== null && (
                    <button
                      onClick={() => setCurrentAge(null)}
                      className="text-xs md:text-sm px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-all hover:shadow-sm"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </>
            )}

            {selectedCungIndex !== null && (
              <button
                onClick={() => setSelectedCungIndex(null)}
                className="text-xs md:text-sm px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-all hover:shadow-sm"
              >
                Bỏ chọn Lộc/Kỵ
              </button>
            )}
            {viewMode === 'daiVan' && (selectedDaiVan !== null || currentDaiVan !== null) && selectedCungIndex !== null && (
              <button
                onClick={() => setShowYearRanking((s) => !s)}
                className={`text-xs md:text-sm px-4 py-2 rounded-full transition-all hover:shadow-sm font-semibold ${
                  showYearRanking
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                }`}
              >
                {showYearRanking
                  ? 'Ẩn năm đẹp/xấu'
                  : `Năm đẹp/xấu cho ${getDaiVanRoleName?.(selectedCungIndex) ?? palaces[selectedCungIndex].name} Vận`}
              </button>
            )}
          </div>
        </div>

        {yearInfo && (
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            <span className="px-2 py-1 bg-amber-100 text-amber-900 rounded-md font-medium">
              Năm {selectedYear}: {yearInfo.can} {yearInfo.chi}
            </span>
            <span className="px-2 py-1 bg-red-100 text-red-900 rounded-md font-medium">
              Mệnh năm tại {palaces[yearInfo.chiIndex].name}
            </span>
            {currentDaiVan !== null && (
              <span className="px-2 py-1 bg-orange-100 text-orange-900 rounded-md font-medium">
                Đại Vận hiện tại: {currentDaiVan} tuổi ({palaces.find((p) => p.daiVan === currentDaiVan)?.name})
              </span>
            )}
          </div>
        )}

        {selectedCungIndex !== null && detailLocKy && (
          <p className="text-xs text-gray-600">
            Lộc/Kỵ {selectedYear !== null ? 'năm' : selectedDaiVan !== null ? 'Đại Vận' : 'tiên thiên'} của cung <span className="font-semibold">{getCungDisplayName(selectedCungIndex)}</span> ({getActiveCan(selectedCungIndex)}):
            <span className="text-blue-600 ml-1">L1 {selectedDaiVan !== null ? `${getDaiVanRoleName?.(detailLocKy.loc[0]) ?? palaces[detailLocKy.loc[0]].name} Vận` : palaces[detailLocKy.loc[0]].name}</span>,
            <span className="text-blue-500"> L2 {selectedDaiVan !== null ? `${getDaiVanRoleName?.(detailLocKy.loc[1]) ?? palaces[detailLocKy.loc[1]].name} Vận` : palaces[detailLocKy.loc[1]].name}</span>,
            <span className="text-blue-400"> L3 {selectedDaiVan !== null ? `${getDaiVanRoleName?.(detailLocKy.loc[2]) ?? palaces[detailLocKy.loc[2]].name} Vận` : palaces[detailLocKy.loc[2]].name}</span>
            <span className="text-gray-400 mx-1">·</span>
            <span className="text-gray-800">K1 {selectedDaiVan !== null ? `${getDaiVanRoleName?.(detailLocKy.ky[0]) ?? palaces[detailLocKy.ky[0]].name} Vận` : palaces[detailLocKy.ky[0]].name}</span>,
            <span className="text-gray-600"> K2 {selectedDaiVan !== null ? `${getDaiVanRoleName?.(detailLocKy.ky[1]) ?? palaces[detailLocKy.ky[1]].name} Vận` : palaces[detailLocKy.ky[1]].name}</span>,
            <span className="text-gray-500"> K3 {selectedDaiVan !== null ? `${getDaiVanRoleName?.(detailLocKy.ky[2]) ?? palaces[detailLocKy.ky[2]].name} Vận` : palaces[detailLocKy.ky[2]].name}</span>
          </p>
        )}

        {selectedDaiVanCungIndex !== null && daiVanLocKy && (
          <p className="text-xs text-gray-600">
            Lộc/Kỵ của Đại Vận <span className="font-semibold">{selectedDaiVan}</span> ({palaces[selectedDaiVanCungIndex].can} - Mệnh Vận {palaces[selectedDaiVanCungIndex].name}):
            <span className="text-blue-600 ml-1">LĐV1 {getDaiVanRoleName?.(daiVanLocKy.loc[0]) ?? palaces[daiVanLocKy.loc[0]].name} Vận</span>,
            <span className="text-blue-500"> LĐV2 {getDaiVanRoleName?.(daiVanLocKy.loc[1]) ?? palaces[daiVanLocKy.loc[1]].name} Vận</span>,
            <span className="text-blue-400"> LĐV3 {getDaiVanRoleName?.(daiVanLocKy.loc[2]) ?? palaces[daiVanLocKy.loc[2]].name} Vận</span>
            <span className="text-gray-400 mx-1">·</span>
            <span className="text-gray-800">KĐV1 {getDaiVanRoleName?.(daiVanLocKy.ky[0]) ?? palaces[daiVanLocKy.ky[0]].name} Vận</span>,
            <span className="text-gray-600"> KĐV2 {getDaiVanRoleName?.(daiVanLocKy.ky[1]) ?? palaces[daiVanLocKy.ky[1]].name} Vận</span>,
            <span className="text-gray-500"> KĐV3 {getDaiVanRoleName?.(daiVanLocKy.ky[2]) ?? palaces[daiVanLocKy.ky[2]].name} Vận</span>
          </p>
        )}
      </div>

      {/* 12-palace board - Tứ Hóa Phái layout */}
      <div className="grid grid-cols-4 gap-1.5 md:gap-3 max-w-4xl mx-auto">
        {/* Row 1: Tỵ -> Thân */}
        <PalaceComponent palace={getPalace(5)} daiVanCungIndex={selectedDaiVanCungIndex} locKyMap={activeLocKy} daiVanLocKyMap={daiVanLocKy} affectedDaiVan={affectedDaiVan} yearCanMap={yearInfo?.yearCanMap ?? null} activeMenhIndex={activeMenhIndex} yearRoleName={getYearRoleName?.(5)} onSelect={() => setSelectedCungIndex(5)} />
        <PalaceComponent palace={getPalace(6)} daiVanCungIndex={selectedDaiVanCungIndex} locKyMap={activeLocKy} daiVanLocKyMap={daiVanLocKy} affectedDaiVan={affectedDaiVan} yearCanMap={yearInfo?.yearCanMap ?? null} activeMenhIndex={activeMenhIndex} yearRoleName={getYearRoleName?.(6)} onSelect={() => setSelectedCungIndex(6)} />
        <PalaceComponent palace={getPalace(7)} daiVanCungIndex={selectedDaiVanCungIndex} locKyMap={activeLocKy} daiVanLocKyMap={daiVanLocKy} affectedDaiVan={affectedDaiVan} yearCanMap={yearInfo?.yearCanMap ?? null} activeMenhIndex={activeMenhIndex} yearRoleName={getYearRoleName?.(7)} onSelect={() => setSelectedCungIndex(7)} />
        <PalaceComponent palace={getPalace(8)} daiVanCungIndex={selectedDaiVanCungIndex} locKyMap={activeLocKy} daiVanLocKyMap={daiVanLocKy} affectedDaiVan={affectedDaiVan} yearCanMap={yearInfo?.yearCanMap ?? null} activeMenhIndex={activeMenhIndex} yearRoleName={getYearRoleName?.(8)} onSelect={() => setSelectedCungIndex(8)} />

        {/* Row 2: Thìn + center + Dậu */}
        <PalaceComponent palace={getPalace(4)} daiVanCungIndex={selectedDaiVanCungIndex} locKyMap={activeLocKy} daiVanLocKyMap={daiVanLocKy} affectedDaiVan={affectedDaiVan} yearCanMap={yearInfo?.yearCanMap ?? null} activeMenhIndex={activeMenhIndex} yearRoleName={getYearRoleName?.(4)} onSelect={() => setSelectedCungIndex(4)} />
        <div className="col-span-2 row-span-2 border-2 border-amber-700/50 bg-gradient-to-br from-amber-100/90 to-amber-50/90 p-2 md:p-3 flex flex-col justify-center items-center text-center rounded-2xl shadow-inner">
          <h3 className="text-sm md:text-base font-bold text-amber-900 mb-1 font-serif">Tứ Hóa Phái</h3>
          <p className="text-xs md:text-sm font-semibold text-gray-800 font-serif">{chart.name || 'Vô danh'}</p>
          <p className="text-[10px] md:text-xs text-gray-700">{chart.canChi.year} · {chart.amDuong}</p>
          <div className="mt-2 space-y-0.5 text-xs md:text-sm">
            <p><span className="text-red-600 font-semibold">{chart.menhCung.label}:</span> {chart.menhCung.chi}</p>
            <p><span className="text-blue-600 font-semibold">{chart.thanCung.label}:</span> {chart.thanCung.chi}</p>
            <p className="text-amber-900 font-bold font-serif text-base">{chart.menhCuc}</p>
          </div>
          {selectedDaiVan !== null && (
            <p className="mt-2 text-xs md:text-sm font-semibold text-amber-800 font-serif">
              Đang xem Đại Vận {selectedDaiVan}
            </p>
          )}
          {yearInfo && (
            <p className="mt-1 text-xs md:text-sm font-semibold text-rose-700 font-serif">
              Đang xem năm {selectedYear}: Mệnh năm {palaces[yearInfo.chiIndex].name}
            </p>
          )}
          {selectedCungIndex !== null && (
            <p className="mt-1 text-[10px] md:text-xs text-gray-600">
              Click cung để xem Lộc/Kỵ
            </p>
          )}
        </div>
        <PalaceComponent palace={getPalace(9)} daiVanCungIndex={selectedDaiVanCungIndex} locKyMap={activeLocKy} daiVanLocKyMap={daiVanLocKy} affectedDaiVan={affectedDaiVan} yearCanMap={yearInfo?.yearCanMap ?? null} activeMenhIndex={activeMenhIndex} yearRoleName={getYearRoleName?.(9)} onSelect={() => setSelectedCungIndex(9)} />

        {/* Row 3: Mão + center + Tuất */}
        <PalaceComponent palace={getPalace(3)} daiVanCungIndex={selectedDaiVanCungIndex} locKyMap={activeLocKy} daiVanLocKyMap={daiVanLocKy} affectedDaiVan={affectedDaiVan} yearCanMap={yearInfo?.yearCanMap ?? null} activeMenhIndex={activeMenhIndex} yearRoleName={getYearRoleName?.(3)} onSelect={() => setSelectedCungIndex(3)} />
        <PalaceComponent palace={getPalace(10)} daiVanCungIndex={selectedDaiVanCungIndex} locKyMap={activeLocKy} daiVanLocKyMap={daiVanLocKy} affectedDaiVan={affectedDaiVan} yearCanMap={yearInfo?.yearCanMap ?? null} activeMenhIndex={activeMenhIndex} yearRoleName={getYearRoleName?.(10)} onSelect={() => setSelectedCungIndex(10)} />

        {/* Row 4: Dần -> Hợi (Tý Sửu ở giữa dưới) */}
        <PalaceComponent palace={getPalace(2)} daiVanCungIndex={selectedDaiVanCungIndex} locKyMap={activeLocKy} daiVanLocKyMap={daiVanLocKy} affectedDaiVan={affectedDaiVan} yearCanMap={yearInfo?.yearCanMap ?? null} activeMenhIndex={activeMenhIndex} yearRoleName={getYearRoleName?.(2)} onSelect={() => setSelectedCungIndex(2)} />
        <PalaceComponent palace={getPalace(1)} daiVanCungIndex={selectedDaiVanCungIndex} locKyMap={activeLocKy} daiVanLocKyMap={daiVanLocKy} affectedDaiVan={affectedDaiVan} yearCanMap={yearInfo?.yearCanMap ?? null} activeMenhIndex={activeMenhIndex} yearRoleName={getYearRoleName?.(1)} onSelect={() => setSelectedCungIndex(1)} />
        <PalaceComponent palace={getPalace(0)} daiVanCungIndex={selectedDaiVanCungIndex} locKyMap={activeLocKy} daiVanLocKyMap={daiVanLocKy} affectedDaiVan={affectedDaiVan} yearCanMap={yearInfo?.yearCanMap ?? null} activeMenhIndex={activeMenhIndex} yearRoleName={getYearRoleName?.(0)} onSelect={() => setSelectedCungIndex(0)} />
        <PalaceComponent palace={getPalace(11)} daiVanCungIndex={selectedDaiVanCungIndex} locKyMap={activeLocKy} daiVanLocKyMap={daiVanLocKy} affectedDaiVan={affectedDaiVan} yearCanMap={yearInfo?.yearCanMap ?? null} activeMenhIndex={activeMenhIndex} yearRoleName={getYearRoleName?.(11)} onSelect={() => setSelectedCungIndex(11)} />
      </div>

      {/* Panel ảnh hưởng tiên thiên / Đại Vận (ẩn khi đã có Kết luận tổng hợp ở tầng năm) */}
      {selectedCungIndex !== null && selectedYear === null && detailLocKy && (
        <div className="max-w-4xl mx-auto mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs md:text-sm">
          <h4 className="font-bold text-blue-900 mb-2">
            {selectedDaiVan !== null && getDaiVanRoleName
              ? `Lộc/Kỵ của ${getDaiVanRoleName(selectedCungIndex)} Vận trong Đại Vận ${selectedDaiVan}`
              : `Lộc/Kỵ tiên thiên từ cung ${getCungDisplayName(selectedCungIndex)}`}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-semibold text-blue-600">Lộc:</span>
              <ul className="list-disc list-inside ml-1 text-gray-700 space-y-0.5">
                {detailLocKy.loc.map((idx, i) => (
                  <li key={`loc-tt-${i}`}>
                    L{i + 1} {getCungDisplayName(idx)}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <span className="font-semibold text-gray-800">Kỵ:</span>
              <ul className="list-disc list-inside ml-1 text-gray-700 space-y-0.5">
                {detailLocKy.ky.map((idx, i) => (
                  <li key={`ky-tt-${i}`}>
                    K{i + 1} {getCungDisplayName(idx)}
                    {badKy?.some((b) => b.label === `K${i + 1}`) && <span className="text-red-600 font-medium ml-1">(hãm)</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {selectedDaiVan === null && (() => {
            const sameRoleGocIndex = (selectedCungIndex - gocMenhIndex + 12) % 12 + gocMenhIndex;
            const sameRoleGocName = palaces[(sameRoleGocIndex) % 12].name;
            const menhLabel = 'Mệnh gốc';
            const sameRoleLabel = `${sameRoleGocName} gốc`;
            const locHits = detailLocKy.loc
              .map((idx, i) => ({ idx, label: `L${i + 1}` }))
              .filter((item) => item.idx === activeMenhIndex || item.idx === sameRoleGocIndex % 12)
              .map((item) => ({ ...item, target: item.idx === activeMenhIndex ? menhLabel : sameRoleLabel }));
            const kyHits = detailLocKy.ky
              .map((idx, i) => ({ idx, label: `K${i + 1}` }))
              .filter((item) => item.idx === activeMenhIndex || item.idx === sameRoleGocIndex % 12)
              .map((item) => ({ ...item, target: item.idx === activeMenhIndex ? menhLabel : sameRoleLabel }));
            return (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="font-semibold text-gray-800">Kết luận:</p>
                {locHits.length === 0 && kyHits.length === 0 ? (
                  <p className="text-gray-600">Lộc/Kỵ không xuất hiện ở {menhLabel} hoặc {sameRoleLabel}.</p>
                ) : (
                  <>
                    {locHits.length > 0 && (
                      <p className="text-blue-700">
                        <span className="font-medium">Lộc có xuất hiện:</span>{' '}
                        {locHits.map((h) => `${h.label} ${h.target}`).join(', ')}.
                      </p>
                    )}
                    {kyHits.length > 0 && (
                      <p className="text-gray-800">
                        <span className="font-medium">Kỵ có xuất hiện:</span>{' '}
                        {kyHits.map((h) => `${h.label} ${h.target}`).join(', ')}.
                      </p>
                    )}
                  </>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Panel ảnh hưởng Đại Vận (ẩn khi đã có Kết luận tổng hợp ở tầng năm) */}
      {selectedCungIndex !== null && selectedYear === null && (selectedDaiVan !== null || affectedDaiVan.loc.length > 0 || affectedDaiVan.ky.length > 0) && (
        <div className="max-w-4xl mx-auto mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs md:text-sm">
          <h4 className="font-bold text-gray-800 mb-2">
            {selectedDaiVan !== null
              ? `Ảnh hưởng của ${getDaiVanRoleName?.(selectedCungIndex)} Vận đến Đại Vận ${selectedDaiVan}`
              : selectedYear !== null && currentDaiVan !== null
                ? `Lộc/Kỵ năm ảnh hưởng đến Đại Vận hiện tại (${currentDaiVan}) từ cung ${getCungDisplayName(selectedCungIndex)}`
                : selectedYear !== null
                  ? `Lộc/Kỵ năm ảnh hưởng đến Đại Vận từ cung ${getCungDisplayName(selectedCungIndex)}`
                  : `Lộc/Kỵ tiên thiên ảnh hưởng đến Đại Vận từ cung ${getCungDisplayName(selectedCungIndex)}`}
          </h4>

          {affectedDaiVan.loc.length === 0 && affectedDaiVan.ky.length === 0 ? (
            <p className="text-gray-600">
              Không có Lộc/Kỵ nào chiếu vào {selectedDaiVan !== null ? 'Mệnh Vận hoặc ' + getDaiVanRoleName?.(selectedCungIndex) + ' Vận' : 'các Đại Vận'}.
            </p>
          ) : (
            <>
              {affectedDaiVan.loc.length > 0 && (
                <div className="mb-2">
                  <span className="font-semibold text-blue-600">Lộc (tốt):</span>
                  <ul className="list-disc list-inside ml-1 text-gray-700 space-y-0.5">
                    {affectedDaiVan.loc.map((item, idx) => (
                      <li key={`loc-${idx}`}>
                        <span className="font-medium">{item.label}</span> rơi vào <span className="font-medium">{item.target}</span>
                        {selectedDaiVan === null && <> của Đại Vận <span className="font-medium">{item.daiVan}</span></>}.
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {affectedDaiVan.ky.length > 0 && (
                <div>
                  <span className="font-semibold text-gray-800">Kỵ (xấu):</span>
                  <ul className="list-disc list-inside ml-1 text-gray-700 space-y-0.5">
                    {affectedDaiVan.ky.map((item, idx) => (
                      <li key={`ky-${idx}`}>
                        <span className="font-medium">{item.label}</span> rơi vào <span className="font-medium">{item.target}</span>
                        {selectedDaiVan === null && <> của Đại Vận <span className="font-medium">{item.daiVan}</span></>}.
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Panel Lộc/Kỵ mở rộng */}
      {namExtendedLocKy && (namExtendedLocKy.loc.length > 0 || namExtendedLocKy.ky.length > 0 || namExtendedLocKy.isInfinite) && (
        <div className="max-w-4xl mx-auto mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs md:text-sm">
          <h4 className="font-bold text-purple-900 mb-2">
            {selectedDaiVan !== null && getDaiVanRoleName && selectedCungIndex !== null
              ? `Lộc/Kỵ mở rộng của ${getDaiVanRoleName(selectedCungIndex)} Vận trong Đại Vận ${selectedDaiVan}`
              : selectedYear !== null
                ? `Lộc/Kỵ mở rộng năm từ cung ${selectedCungIndex !== null ? getCungDisplayName(selectedCungIndex) : ''}`
                : `Lộc/Kỵ mở rộng từ cung ${selectedCungIndex !== null ? getCungDisplayName(selectedCungIndex) : ''}`}
            {namExtendedLocKy.isInfinite && <span className="text-red-600 ml-2">(Vô hạn)</span>}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-semibold text-blue-600">Lộc mở rộng:</span>
              {namExtendedLocKy.loc.length > 0 ? (
                <ul className="list-disc list-inside ml-1 text-gray-700 space-y-0.5">
                  {namExtendedLocKy.loc.map((idx, i) => (
                    <li key={`ext-loc-${i}`}>
                      L{i + 4} {getCungDisplayName(idx)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 ml-1">Không có.</p>
              )}
            </div>
            <div>
              <span className="font-semibold text-gray-800">Kỵ mở rộng:</span>
              {namExtendedLocKy.ky.length > 0 ? (
                <ul className="list-disc list-inside ml-1 text-gray-700 space-y-0.5">
                  {namExtendedLocKy.ky.map((idx, i) => (
                    <li key={`ext-ky-${i}`}>
                      K{i + 4} {getCungDisplayName(idx)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 ml-1">Không có.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Panel Lộc/Kỵ mở rộng ảnh hưởng đến lá số gốc (ẩn khi đã có Kết luận tổng hợp ở tầng năm) */}
      {selectedYear === null && extendedToGoc && (extendedToGoc.loc.length > 0 || extendedToGoc.ky.length > 0) && (
        <div className="max-w-4xl mx-auto mt-4 p-3 bg-fuchsia-50 border border-fuchsia-200 rounded-lg text-xs md:text-sm">
          <h4 className="font-bold text-fuchsia-900 mb-2">
            Lộc/Kỵ mở rộng ảnh hưởng đến {selectedYear !== null ? 'Mệnh năm' : 'lá số gốc'}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-semibold text-blue-600">Lộc (tốt):</span>
              {extendedToGoc.loc.length > 0 ? (
                <ul className="list-disc list-inside ml-1 text-gray-700 space-y-0.5">
                  {extendedToGoc.loc.map((item, idx) => (
                    <li key={`ext-goc-loc-${idx}`}>
                      <span className="font-medium">{item.label}</span> rơi vào <span className="font-medium">{item.target}</span>.
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 ml-1">Không có.</p>
              )}
            </div>
            <div>
              <span className="font-semibold text-gray-800">Kỵ (xấu):</span>
              {extendedToGoc.ky.length > 0 ? (
                <ul className="list-disc list-inside ml-1 text-gray-700 space-y-0.5">
                  {extendedToGoc.ky.map((item, idx) => (
                    <li key={`ext-goc-ky-${idx}`}>
                      <span className="font-medium">{item.label}</span> rơi vào <span className="font-medium">{item.target}</span>.
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 ml-1">Không có.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Panel Lộc/Kỵ tiên thiên của cung gốc cùng vai trò ảnh hưởng đến Đại Vận (ẩn khi đã có Kết luận tổng hợp ở tầng năm) */}
      {selectedYear === null && sameRoleTienThien && (
        <div className="max-w-4xl mx-auto mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs md:text-sm">
          <h4 className="font-bold text-indigo-900 mb-2">
            Lộc/Kỵ tiên thiên của {sameRoleTienThien.roleName} {selectedYear !== null ? 'năm' : 'gốc'} ảnh hưởng đến Đại Vận {selectedDaiVan}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-semibold text-blue-600">Lộc (tốt):</span>
              <ul className="list-disc list-inside ml-1 text-gray-700 space-y-0.5">
                {sameRoleTienThien.loc.map((item, idx) => (
                  <li key={`same-loc-${idx}`}>
                    <span className="font-medium">{item.label}</span> rơi vào <span className="font-medium">{item.target}</span>.
                    {item.isKey && <span className="text-blue-700 ml-1">(ảnh hưởng trọng yếu)</span>}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <span className="font-semibold text-gray-800">Kỵ (xấu):</span>
              <ul className="list-disc list-inside ml-1 text-gray-700 space-y-0.5">
                {sameRoleTienThien.ky.map((item, idx) => (
                  <li key={`same-ky-${idx}`}>
                    <span className="font-medium">{item.label}</span> rơi vào <span className="font-medium">{item.target}</span>.
                    {item.isKey && <span className="text-red-700 ml-1">(ảnh hưởng trọng yếu)</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Panel Lộc/Kỵ của cung Đại Vận ảnh hưởng đến lá số gốc (ẩn khi đã có Kết luận tổng hợp ở tầng năm) */}
      {selectedYear === null && daiVanToGoc && (daiVanToGoc.loc.length > 0 || daiVanToGoc.ky.length > 0) && (
        <div className="max-w-4xl mx-auto mt-4 p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs md:text-sm">
          <h4 className="font-bold text-teal-900 mb-2">
            Lộc/Kỵ của {daiVanToGoc.roleName} Vận trong Đại Vận {selectedDaiVan} ảnh hưởng đến {selectedYear !== null ? 'Mệnh năm' : 'lá số gốc'}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-semibold text-blue-600">Lộc (tốt):</span>
              {daiVanToGoc.loc.length > 0 ? (
                <ul className="list-disc list-inside ml-1 text-gray-700 space-y-0.5">
                  {daiVanToGoc.loc.map((item, idx) => (
                    <li key={`dv-goc-loc-${idx}`}>
                      <span className="font-medium">{item.label}</span> rơi vào <span className="font-medium">{item.target}</span>.
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 ml-1">Không có.</p>
              )}
            </div>
            <div>
              <span className="font-semibold text-gray-800">Kỵ (xấu):</span>
              {daiVanToGoc.ky.length > 0 ? (
                <ul className="list-disc list-inside ml-1 text-gray-700 space-y-0.5">
                  {daiVanToGoc.ky.map((item, idx) => (
                    <li key={`dv-goc-ky-${idx}`}>
                      <span className="font-medium">{item.label}</span> rơi vào <span className="font-medium">{item.target}</span>.
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 ml-1">Không có.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Panel Kết luận tổng hợp */}
      {selectedCungIndex !== null && (
        <div className="max-w-4xl mx-auto mt-4 p-4 md:p-5 bg-emerald-50 border-2 border-emerald-300 rounded-xl text-sm md:text-base shadow-sm">
          <h4 className="font-bold text-emerald-900 mb-3 text-base md:text-lg font-serif">
            Kết luận tổng hợp
          </h4>
          <p className="text-xs md:text-sm text-gray-600 mb-3 leading-relaxed">
            Lộc = tốt, Kỵ = xấu. Mỗi tầng tự ảnh hưởng đến chính mình: Tiên thiên → tiên thiên, Đại Vận → Đại Vận, Năm → Năm.
            Nếu xuất hiện cả Lộc và Kỵ thì cung/Đại Vận/năm đó có cả mặt tốt lẫn xấu.
          </p>

          {(() => {
            const getInterpretation = (item: KetLuanItem) => {
              const meaning = CUNG_INTERPRETATION[item.sourceRole] ?? item.sourceRole;
              const quality = item.type === 'Lộc' ? 'tốt' : 'xấu';
              const layer = item.target.includes('Vận') ? 'Đại Vận đó' : item.target.includes('năm') ? 'Năm đó' : 'Lá số gốc';
              // Nếu xung vào chính cung đang xem (cùng vai trò) hoặc vào Mệnh thì diễn giải gắn vào toàn bộ tầng
              if (item.target.startsWith('Mệnh') || item.target.startsWith(item.sourceRole)) {
                return `${layer} ${meaning} ${quality}`;
              }
              return `${layer} ${meaning} ${quality} ở ${item.target}`;
            };

            const renderItems = (items: KetLuanItem[]) => {
              const getLabelLevel = (label: string) => {
                const match = label.match(/\d+/);
                return match ? Number.parseInt(match[0], 10) : Number.MAX_SAFE_INTEGER;
              };

              const sortedItems = [...items].sort((a, b) => {
                const layerDiff = getTargetLayerOrder(a.target) - getTargetLayerOrder(b.target);
                if (layerDiff !== 0) return layerDiff;

                const menhDiff = Number(!a.target.startsWith('Mệnh')) - Number(!b.target.startsWith('Mệnh'));
                if (menhDiff !== 0) return menhDiff;

                const labelDiff = getLabelLevel(a.label) - getLabelLevel(b.label);
                if (labelDiff !== 0) return labelDiff;

                return a.label.localeCompare(b.label);
              });

              return (
              <ul className="list-disc list-inside ml-2 text-gray-800 space-y-1.5">
                {sortedItems.map((item, idx) => (
                  <li key={`kl-${idx}`} className="leading-relaxed">
                    <span className={`font-bold ${item.type === 'Lộc' ? 'text-blue-700' : 'text-gray-900'}`}>{item.label}</span>
                    {' '}xung vào{' '}
                    <span className="font-semibold">{item.target}</span>
                    {item.isInfinite && <span className="text-red-600 font-bold ml-1">(Vô hạn)</span>}
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-md font-bold ${item.type === 'Lộc' ? 'bg-blue-100 text-blue-800 ring-1 ring-blue-300' : 'bg-red-100 text-red-800 ring-1 ring-red-300'}`}>
                      {item.strengthLabel}
                    </span>
                    <span className="ml-2 text-xs text-gray-500 font-medium">— {getInterpretation(item)}</span>
                  </li>
                ))}
              </ul>
              );
            };

            const hasTienThien = ketLuan.tienThien.length > 0;
            const hasDaiVan = ketLuan.daiVan.length > 0;
            const hasNam = ketLuan.nam.length > 0;

            if (!hasTienThien && !hasDaiVan && !hasNam) {
              return <p className="text-gray-600">Không có Lộc/Kỵ nào xung vào các cung trọng yếu.</p>;
            }

            return (
              <div className="space-y-3">
                {hasTienThien && (
                  <div>
                    <h5 className="font-bold text-emerald-800 mb-2 text-sm md:text-base font-serif">Tiên thiên</h5>
                    {renderItems(ketLuan.tienThien)}
                  </div>
                )}

                {hasDaiVan && (
                  <div>
                    <h5 className="font-bold text-emerald-800 mb-2 text-sm md:text-base font-serif">Đại Vận</h5>
                    {renderItems(ketLuan.daiVan)}
                  </div>
                )}

                {selectedYear !== null && hasNam && (
                  <div>
                    <h5 className="font-bold text-emerald-800 mb-2 text-sm md:text-base font-serif">Năm</h5>
                    {renderItems(ketLuan.nam)}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Panel xếp hạng năm đẹp/xấu trong Đại Vận */}
      {viewMode === 'daiVan' && showYearRanking && daiVanYearRanking && daiVanYearRanking.length > 0 && (
        <div className="max-w-4xl mx-auto mt-4 p-4 md:p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-xl shadow-sm">
          <h4 className="font-bold text-emerald-900 mb-3 text-base md:text-lg font-serif">
            Năm đẹp & xấu cho {selectedCungIndex !== null ? (getDaiVanRoleName?.(selectedCungIndex) ?? palaces[selectedCungIndex].name) + ' Vận' : ''} trong Đại Vận {selectedDaiVan ?? currentDaiVan}
          </h4>
          <p className="text-xs md:text-sm text-gray-600 mb-4 leading-relaxed">
            Phân tích ảnh hưởng giữa <strong>Tiên thiên</strong>, <strong>Đại Vận</strong> và <strong>Năm</strong>,
            bao gồm Tiên thiên → Năm, Năm → Tiên thiên, Đại Vận → Năm, Năm → Đại Vận và các tự xung của từng tầng thay đổi theo năm,
            có tính cả Lộc/Kỵ mở rộng (L4+/K4+) và vô hạn.
            Điểm càng cao càng tốt, càng thấp càng xấu.
          </p>
          <p className="text-[11px] md:text-xs text-gray-500 mb-4">
            Ghi chú: ảnh hưởng giữa Tiên thiên và Đại Vận là phần cố định trong suốt Đại Vận này, nên không cộng vào xếp hạng từng năm.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Năm đẹp nhất */}
            <div>
              <h5 className="font-bold text-emerald-800 mb-2 text-sm md:text-base font-serif">Năm đẹp nhất</h5>
              <div className="space-y-2">
                {daiVanYearRanking.slice(0, 5).map((item) => {
                  const level = getLevelLabel(item.level);
                  return (
                    <div key={`good-${item.year}`} className="bg-white/80 rounded-lg p-2.5 border border-emerald-200 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm md:text-base text-gray-900">
                          Năm {item.year} ({item.can} {item.chi})
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md ring-1 ${level.color}`}>
                          {level.text} · {item.score > 0 ? '+' : ''}{item.score}
                        </span>
                      </div>
                      <p className="text-[11px] md:text-xs text-gray-500 mb-1">Tuổi âm: {item.age}</p>
                      <div className="space-y-1">
                        {renderYearImpactGroups(item.details, `good-detail-${item.year}`)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Năm xấu nhất */}
            <div>
              <h5 className="font-bold text-red-800 mb-2 text-sm md:text-base font-serif">Năm xấu nhất</h5>
              <div className="space-y-2">
                {[...daiVanYearRanking].reverse().slice(0, 5).map((item) => {
                  const level = getLevelLabel(item.level);
                  return (
                    <div key={`bad-${item.year}`} className="bg-white/80 rounded-lg p-2.5 border border-red-200 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm md:text-base text-gray-900">
                          Năm {item.year} ({item.can} {item.chi})
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md ring-1 ${level.color}`}>
                          {level.text} · {item.score > 0 ? '+' : ''}{item.score}
                        </span>
                      </div>
                      <p className="text-[11px] md:text-xs text-gray-500 mb-1">Tuổi âm: {item.age}</p>
                      <div className="space-y-1">
                        {renderYearImpactGroups(item.details, `bad-detail-${item.year}`)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <p className="text-center text-[10px] md:text-xs text-gray-400 mt-3">
        Tên cung đỏ = Mệnh gốc · xanh = Thân · tím = Mệnh + Thân · cam = Mệnh Đại Vận · hồng = Mệnh năm · click cung để xem Lộc/Kỵ
      </p>
    </div>
  );
}
