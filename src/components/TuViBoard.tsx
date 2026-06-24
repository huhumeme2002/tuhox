import { useCallback, useMemo, useState } from 'react';
import type { TuViChart, Palace, Can, CungName } from '../types/tuVi';
import { TU_HOA_TABLE, CUNG_NAMES, CAN, CHI } from '../data/constants';
import { Palace as PalaceComponent } from './Palace';
import { getCurrentLunarYear } from '../utils/calendar';
import { getNguHoDonCanMap } from '../utils/canChi';

function getYearCanChi(year: number): { can: Can; chi: string; chiIndex: number } {
  const canIndex = ((year - 4) % 10 + 10) % 10;
  const chiIndex = ((year - 4) % 12 + 12) % 12;
  return { can: CAN[canIndex], chi: CHI[chiIndex], chiIndex };
}

function getYearCanMap(yearCan: Can): Record<number, Can> {
  return getNguHoDonCanMap(yearCan);
}

function getGocCan(chart: TuViChart): Can {
  return (chart.canChi.year.split(' ')[0] as Can) ?? CAN[0];
}

interface Props {
  chart: TuViChart;
}

type LocKyLike = {
  loc: readonly number[];
  ky: readonly number[];
  isInfinite?: boolean;
  locInfinite?: boolean;
  kyInfinite?: boolean;
  locInfiniteStartLevel?: number;
  kyInfiniteStartLevel?: number;
  locInfiniteIndex?: number;
  kyInfiniteIndex?: number;
};

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
): LocKyLike {
  const locResult: number[] = [];
  const kyResult: number[] = [];
  let locInfinite = false;
  let kyInfinite = false;
  let locInfiniteStartLevel: number | undefined;
  let kyInfiniteStartLevel: number | undefined;
  let locInfiniteIndex: number | undefined;
  let kyInfiniteIndex: number | undefined;

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
    const lNextLevel = locResult.length + 4;
    const lNext5 = (lNext + 6) % 12;
    const lNext6 = (lNext + 11) % 12;
    locResult.push(lNext, lNext5, lNext6);
    if (gocLocPalaces.has(lNext)) {
      locInfinite = true;
      locInfiniteStartLevel = lNextLevel;
      locInfiniteIndex = lNext;
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
    const kNextLevel = kyResult.length + 4;
    const kNext5 = (kNext + 6) % 12;
    const kNext6 = (kNext + 11) % 12;
    kyResult.push(kNext, kNext5, kNext6);
    if (gocKyPalaces.has(kNext)) {
      kyInfinite = true;
      kyInfiniteStartLevel = kNextLevel;
      kyInfiniteIndex = kNext;
      break;
    }
    kTriggers = [kNext, kNext5, kNext6];
  }

  return {
    loc: locResult,
    ky: kyResult,
    locInfinite,
    kyInfinite,
    locInfiniteStartLevel,
    kyInfiniteStartLevel,
    locInfiniteIndex,
    kyInfiniteIndex,
    isInfinite: locInfinite || kyInfinite,
  };
}

type ImpactContext = 'default' | 'year-self';

function getStrengthLabel(
  level: number,
  distance: number,
  type: 'Lộc' | 'Kỵ',
  context: ImpactContext = 'default'
) {
  const raw = getImpactMagnitude(level, distance, context);
  let rank = 0;
  if (raw >= 3.5) rank = 4;
  else if (raw >= 2.5) rank = 3;
  else if (raw >= 1.5) rank = 2;
  else if (raw >= 1) rank = 1;

  if (distance === 1) rank = Math.min(rank, 3);
  if (distance >= 2) rank = Math.min(rank, 1);

  if (rank >= 4) return type === 'Lộc' ? 'Cực mạnh' : 'Cực nặng';
  if (rank >= 3) return type === 'Lộc' ? 'Rất mạnh' : 'Rất nặng';
  if (rank >= 2) return type === 'Lộc' ? 'Mạnh' : 'Nặng';
  if (rank >= 1) return 'Vừa';
  return 'Nhẹ';
}

function getEffectiveImpactLevel(level: number) {
  if (level <= 3) return level;
  return ((level - 1) % 3) + 1;
}

function getImpactMagnitude(level: number, distance: number, context: ImpactContext = 'default') {
  const effectiveLevel = getEffectiveImpactLevel(level);
  let magnitude = effectiveLevel;

  if (distance <= 0) {
    magnitude = effectiveLevel;
  } else if (distance === 1) {
    magnitude = 0.5 * effectiveLevel + 0.5;
  } else if (distance >= 2) {
    magnitude = 0.25 * effectiveLevel + 0.25;
  }

  // Trong phần chấm đẹp/xấu theo năm, tự xung Năm -> Năm là lớp trực tiếp nhất
  // nên được ưu tiên cao hơn các tương tác chéo còn lại.
  if (context === 'year-self') {
    magnitude += 1;
  }

  return magnitude;
}

function getImpactDisplayName(type: 'Lộc' | 'Kỵ', level: number) {
  return `${type} ${level}`;
}

function getInfiniteImpactDisplayName(type: 'Lộc' | 'Kỵ') {
  return `${type} vô hạn`;
}

function expandImpactLabel(label: string) {
  const match = label.match(/^([LK])(\d+)$/);
  if (!match) return label;
  const [, prefix, level] = match;
  return `${prefix === 'L' ? 'Lộc' : 'Kỵ'} ${level}`;
}

export interface AffectedDaiVan {
  loc: { daiVan: number; label: string; target: string; cungName: string }[];
  ky: { daiVan: number; label: string; target: string; cungName: string }[];
}

interface ImpactDetail {
  text: string;
  point: number;
  good: boolean;
  target: string;
}

export function TuViBoard({ chart }: Props) {
  const { palaces } = chart;
  const getPalace = (index: number) => palaces[index];

  const daiVanOptions = useMemo(
    () => palaces.map((p) => p.daiVan).filter((dv): dv is number => dv !== undefined).sort((a, b) => a - b),
    [palaces]
  );

  type ViewMode = 'tienThien' | 'daiVan' | 'nam' | 'quai';
  const [viewMode, setViewMode] = useState<ViewMode>('tienThien');
  const [selectedDaiVan, setSelectedDaiVan] = useState<number | null>(null);
  const [selectedCungIndex, setSelectedCungIndex] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [currentAge, setCurrentAge] = useState<number | null>(null);
  const [showYearRanking, setShowYearRanking] = useState(false);
  const [showQuaiYearRanking, setShowQuaiYearRanking] = useState(false);
  const [hideMenhImpacts, setHideMenhImpacts] = useState(false);
  const [quaiBirthYear, setQuaiBirthYear] = useState<number | null>(null);
  const [quaiSelectedDaiVan, setQuaiSelectedDaiVan] = useState<number | null>(null);
  const [quaiSelectedYear, setQuaiSelectedYear] = useState<number | null>(() => getCurrentLunarYear());

  const yearInfo = useMemo(() => {
    if (selectedYear === null) return null;
    const { can, chi, chiIndex } = getYearCanChi(selectedYear);
    const yearCanMap = getYearCanMap(can);
    return { can, chi, chiIndex, yearCanMap };
  }, [selectedYear]);

  // Tuổi âm hiện tại theo năm âm lịch hiện tại
  const currentAmAge = useMemo(() => {
    return getCurrentLunarYear() - chart.lunarDate.year + 1;
  }, [chart.lunarDate.year]);

  // Tuổi âm đang dùng để suy Đại Vận: ưu tiên năm đang xem, nếu không có thì lấy tuổi âm hiện tại
  const effectiveCurrentAge = useMemo(() => {
    if (selectedYear !== null) {
      if (currentAge !== null) return currentAge;
      return selectedYear - chart.lunarDate.year + 1;
    }
    return currentAmAge;
  }, [selectedYear, currentAge, currentAmAge, chart.lunarDate.year]);

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

  const switchViewMode = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    setSelectedCungIndex(null);
    setShowYearRanking(false);
    setShowQuaiYearRanking(false);

    if (mode === 'tienThien') {
      setSelectedDaiVan(null);
      setSelectedYear(null);
      setCurrentAge(null);
      return;
    }

    if (mode === 'daiVan') {
      setSelectedYear(null);
      setCurrentAge(null);
      setSelectedDaiVan(daiVanOptions[0] ?? null);
      return;
    }

    if (mode === 'nam') {
      setSelectedDaiVan(null);
      setSelectedYear(getCurrentLunarYear());
      setCurrentAge(null);
      return;
    }

    setSelectedDaiVan(null);
    setSelectedYear(null);
    setCurrentAge(null);
    setQuaiSelectedDaiVan((prev) => prev ?? currentDaiVan ?? daiVanOptions[0] ?? null);
    setQuaiSelectedYear((prev) => prev ?? getCurrentLunarYear());
  }, [currentDaiVan, daiVanOptions]);

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
    if (viewMode === 'nam' && selectedYear !== null) return (selectedCungIndex - activeMenhIndex + 12) % 12;
    if (viewMode === 'daiVan' && activeDaiVanCungIndex !== null) return (selectedCungIndex - activeDaiVanCungIndex + 12) % 12;
    return (selectedCungIndex - gocMenhIndex + 12) % 12;
  }, [selectedCungIndex, viewMode, selectedYear, activeMenhIndex, activeDaiVanCungIndex, gocMenhIndex]);

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

  const isQuaiMode = viewMode === 'quai';

  const quaiInfo = useMemo(() => {
    if (quaiBirthYear === null) return null;
    const { can, chi, chiIndex } = getYearCanChi(quaiBirthYear);
    return {
      can,
      chi,
      chiIndex,
      canMap: getYearCanMap(can),
    };
  }, [quaiBirthYear]);

  const quaiYearInfo = useMemo(() => {
    if (quaiSelectedYear === null) return null;
    const { can, chi, chiIndex } = getYearCanChi(quaiSelectedYear);
    return {
      can,
      chi,
      chiIndex,
      yearCanMap: getYearCanMap(can),
    };
  }, [quaiSelectedYear]);

  const quaiSelectedDaiVanCungIndex = useMemo(
    () => (quaiSelectedDaiVan !== null ? palaces.findIndex((p) => p.daiVan === quaiSelectedDaiVan) : null),
    [quaiSelectedDaiVan, palaces]
  );

  const getQuaiRoleName = useCallback((index: number) => {
    if (!quaiInfo) return null;
    return `${CUNG_NAMES[(index - quaiInfo.chiIndex + 12) % 12]} quái`;
  }, [quaiInfo]);

  const getQuaiDisplayName = useCallback((index: number) => {
    return getQuaiRoleName(index) ?? palaces[index].name;
  }, [getQuaiRoleName, palaces]);

  const quaiRoleIndex = useMemo(() => {
    if (selectedCungIndex === null || !quaiInfo) return null;
    return (selectedCungIndex - quaiInfo.chiIndex + 12) % 12;
  }, [selectedCungIndex, quaiInfo]);

  const quaiRoleName = useMemo(
    () => (quaiRoleIndex !== null ? CUNG_NAMES[quaiRoleIndex] : null),
    [quaiRoleIndex]
  );

  const quaiGocRoleIndex = useMemo(() => {
    if (quaiRoleIndex === null) return null;
    return (gocMenhIndex + quaiRoleIndex) % 12;
  }, [quaiRoleIndex, gocMenhIndex]);

  const quaiDaiVanRoleIndex = useMemo(() => {
    if (quaiRoleIndex === null || quaiSelectedDaiVanCungIndex === null) return null;
    return (quaiSelectedDaiVanCungIndex + quaiRoleIndex) % 12;
  }, [quaiRoleIndex, quaiSelectedDaiVanCungIndex]);

  const quaiNamRoleIndex = useMemo(() => {
    if (quaiRoleIndex === null || !quaiYearInfo) return null;
    return (quaiYearInfo.chiIndex + quaiRoleIndex) % 12;
  }, [quaiRoleIndex, quaiYearInfo]);

  const quaiLocKy = useMemo(() => {
    if (selectedCungIndex === null || !quaiInfo) return null;
    return calculateLocKy(quaiInfo.canMap[selectedCungIndex], palaces);
  }, [selectedCungIndex, quaiInfo, palaces]);

  const quaiExtendedLocKy = useMemo(() => {
    if (selectedCungIndex === null || !quaiInfo) return null;
    return calculateExtendedLocKy(
      quaiInfo.canMap[selectedCungIndex],
      palaces,
      gocTuHoaPalaces.loc,
      gocTuHoaPalaces.ky,
      (index: number) => palaces[index].can
    );
  }, [selectedCungIndex, quaiInfo, palaces, gocTuHoaPalaces]);

  const quaiGocLocKy = useMemo(() => {
    if (quaiGocRoleIndex === null) return null;
    return calculateLocKy(palaces[quaiGocRoleIndex].can, palaces);
  }, [quaiGocRoleIndex, palaces]);

  const quaiGocExtendedLocKy = useMemo(() => {
    if (quaiGocRoleIndex === null) return null;
    return calculateExtendedLocKy(
      palaces[quaiGocRoleIndex].can,
      palaces,
      gocTuHoaPalaces.loc,
      gocTuHoaPalaces.ky,
      (index: number) => palaces[index].can
    );
  }, [quaiGocRoleIndex, palaces, gocTuHoaPalaces]);

  const quaiDaiVanLocKy = useMemo(() => {
    if (quaiDaiVanRoleIndex === null) return null;
    return calculateLocKy(palaces[quaiDaiVanRoleIndex].can, palaces);
  }, [quaiDaiVanRoleIndex, palaces]);

  const quaiDaiVanExtendedLocKy = useMemo(() => {
    if (quaiDaiVanRoleIndex === null) return null;
    return calculateExtendedLocKy(
      palaces[quaiDaiVanRoleIndex].can,
      palaces,
      gocTuHoaPalaces.loc,
      gocTuHoaPalaces.ky,
      (index: number) => palaces[index].can
    );
  }, [quaiDaiVanRoleIndex, palaces, gocTuHoaPalaces]);

  const quaiNamLocKy = useMemo(() => {
    if (quaiNamRoleIndex === null || !quaiYearInfo) return null;
    return calculateLocKy(quaiYearInfo.yearCanMap[quaiNamRoleIndex], palaces);
  }, [quaiNamRoleIndex, quaiYearInfo, palaces]);

  const quaiNamExtendedLocKy = useMemo(() => {
    if (quaiNamRoleIndex === null || !quaiYearInfo) return null;
    return calculateExtendedLocKy(
      quaiYearInfo.yearCanMap[quaiNamRoleIndex],
      palaces,
      gocTuHoaPalaces.loc,
      gocTuHoaPalaces.ky,
      (index: number) => palaces[index].can
    );
  }, [quaiNamRoleIndex, quaiYearInfo, palaces, gocTuHoaPalaces]);

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
  const getCungDisplayName = useCallback((index: number) => {
    if (selectedDaiVan !== null && getDaiVanRoleName) return `${getDaiVanRoleName(index)} Vận`;
    if (selectedYear !== null && getYearRoleName) return getYearRoleName(index);
    return palaces[index].name;
  }, [selectedDaiVan, getDaiVanRoleName, selectedYear, getYearRoleName, palaces]);

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

  const activeExtendedLocKy = selectedYear !== null
    ? namExtendedLocKy
    : selectedDaiVan !== null
      ? daiVanExtendedLocKy
      : gocExtendedLocKy;

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
    const includeYearLayer = viewMode === 'nam' && selectedYear !== null;

    const clickRoleName = CUNG_NAMES[clickRoleIndex];

    const addImpacts = (
      sourceLocKy: LocKyLike | null,
      targetMenhIndex: number | null,
      targetRoleIndex: number | null,
      distance: number,
      targetLayerName: string,
      resultArray: KetLuanItem[],
      extended = false,
      context: ImpactContext = 'default'
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
          strengthLabel: getStrengthLabel(level, distance, 'Lộc', context),
          isInfinite: extended && sourceLocKy.locInfiniteIndex === idx ? true : undefined,
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
          strengthLabel: getStrengthLabel(level, distance, 'Kỵ', context),
          isInfinite: extended && sourceLocKy.kyInfiniteIndex === idx ? true : undefined,
          sourceRole: clickRoleName,
        });
      });
    };

    // Tiên thiên → các tầng
    addImpacts(gocLocKy, gocMenhIndex, gocRoleCungIndex, 0, 'tiên thiên', result.tienThien);
    addImpacts(gocLocKy, activeDaiVanCungIndex, daiVanRoleCungIndex, 1, 'Vận', result.tienThien);
    addImpacts(gocExtendedLocKy, gocMenhIndex, gocRoleCungIndex, 0, 'tiên thiên', result.tienThien, true);
    addImpacts(gocExtendedLocKy, activeDaiVanCungIndex, daiVanRoleCungIndex, 1, 'Vận', result.tienThien, true);
    if (includeYearLayer) {
      addImpacts(gocLocKy, activeMenhIndex, namRoleCungIndex, 2, 'năm', result.tienThien);
      addImpacts(gocExtendedLocKy, activeMenhIndex, namRoleCungIndex, 2, 'năm', result.tienThien, true);
    }

    // Đại Vận → các tầng
    addImpacts(daiVanLocKy, gocMenhIndex, gocRoleCungIndex, 1, 'tiên thiên', result.daiVan);
    addImpacts(daiVanLocKy, activeDaiVanCungIndex, daiVanRoleCungIndex, 0, 'Vận', result.daiVan);
    addImpacts(daiVanExtendedLocKy, gocMenhIndex, gocRoleCungIndex, 1, 'tiên thiên', result.daiVan, true);
    addImpacts(daiVanExtendedLocKy, activeDaiVanCungIndex, daiVanRoleCungIndex, 0, 'Vận', result.daiVan, true);
    if (includeYearLayer) {
      addImpacts(daiVanLocKy, activeMenhIndex, namRoleCungIndex, 1, 'năm', result.daiVan);
      addImpacts(daiVanExtendedLocKy, activeMenhIndex, namRoleCungIndex, 1, 'năm', result.daiVan, true);
    }

    // Năm → các tầng
    if (includeYearLayer) {
      addImpacts(namLocKy, gocMenhIndex, gocRoleCungIndex, 2, 'tiên thiên', result.nam);
      addImpacts(namLocKy, activeDaiVanCungIndex, daiVanRoleCungIndex, 1, 'Vận', result.nam);
      addImpacts(namLocKy, activeMenhIndex, namRoleCungIndex, 0, 'năm', result.nam, false, 'year-self');
      addImpacts(namExtendedLocKy, gocMenhIndex, gocRoleCungIndex, 2, 'tiên thiên', result.nam, true);
      addImpacts(namExtendedLocKy, activeDaiVanCungIndex, daiVanRoleCungIndex, 1, 'Vận', result.nam, true);
      addImpacts(namExtendedLocKy, activeMenhIndex, namRoleCungIndex, 0, 'năm', result.nam, true, 'year-self');
    }

    return result;
  }, [viewMode, selectedYear, selectedCungIndex, clickRoleIndex, gocMenhIndex, activeDaiVanCungIndex, activeMenhIndex, gocRoleCungIndex, daiVanRoleCungIndex, namRoleCungIndex, gocLocKy, daiVanLocKy, namLocKy, gocExtendedLocKy, daiVanExtendedLocKy, namExtendedLocKy]);

  const visibleKetLuan = useMemo(() => {
    const filterItems = (items: KetLuanItem[]) => (
      hideMenhImpacts ? items.filter((item) => !item.target.startsWith('Mệnh')) : items
    );

    if (viewMode === 'tienThien') {
      return {
        tienThien: filterItems(ketLuan.tienThien),
        daiVan: [] as KetLuanItem[],
        nam: [] as KetLuanItem[],
      };
    }

    if (viewMode === 'daiVan') {
      return {
        tienThien: filterItems(ketLuan.tienThien),
        daiVan: filterItems(ketLuan.daiVan),
        nam: [] as KetLuanItem[],
      };
    }

    return {
      tienThien: filterItems(ketLuan.tienThien),
      daiVan: filterItems(ketLuan.daiVan),
      nam: filterItems(ketLuan.nam),
    };
  }, [viewMode, ketLuan, hideMenhImpacts]);



  // Ảnh hưởng Đại Vận bởi Lộc/Kỵ tiên thiên (L1/L2/L3, K1/K2/K3)
  const getKetLuanInterpretation = (item: KetLuanItem) => {
    const meaning = CUNG_INTERPRETATION[item.sourceRole] ?? item.sourceRole;
    const quality = item.type === 'Lộc' ? 'tốt' : 'xấu';
    const layer = item.target.includes('Vận') ? 'Đại Vận đó' : item.target.includes('năm') ? 'Năm đó' : 'Lá số gốc';
    return `${layer} ${meaning} ${quality}`;
  };

  const renderKetLuanItems = (items: KetLuanItem[]) => {
    const getLabelLevel = (label: string) => {
      const match = label.match(/\d+/);
      return match ? Number(match[0]) : 99;
    };

    const sortedItems = [...items].sort((a, b) => {
      const menhDiff = Number(!a.target.startsWith('Mệnh')) - Number(!b.target.startsWith('Mệnh'));
      if (menhDiff !== 0) return menhDiff;

      const labelDiff = getLabelLevel(a.label) - getLabelLevel(b.label);
      if (labelDiff !== 0) return labelDiff;

      return a.label.localeCompare(b.label);
    });

    return (
      <ul className="list-disc list-inside ml-2 text-gray-800 space-y-1.5">
        {sortedItems.map((item, idx) => (
          <li key={`ket-luan-detail-${idx}`} className="leading-relaxed">
            <span className={`font-bold ${item.type === 'Lộc' ? 'text-blue-700' : 'text-gray-900'}`}>{expandImpactLabel(item.label)}</span>
            {' '}xung vào{' '}
            <span className="font-semibold">{item.target}</span>
            {item.isInfinite && <span className="text-red-600 font-bold ml-1">(Vô hạn)</span>}
            <span className={`ml-2 text-xs px-2 py-0.5 rounded-md font-bold ${item.type === 'Lộc' ? 'bg-blue-100 text-blue-800 ring-1 ring-blue-300' : 'bg-red-100 text-red-800 ring-1 ring-red-300'}`}>
              {item.strengthLabel}
            </span>
            <span className="ml-2 text-xs text-gray-500 font-medium">— {getKetLuanInterpretation(item)}</span>
          </li>
        ))}
      </ul>
    );
  };

  const daiVanImpactSourceLocKy = selectedDaiVan !== null ? daiVanClickLocKy : activeLocKy;

  const affectedDaiVan = useMemo<AffectedDaiVan>(() => {
    const result: AffectedDaiVan = { loc: [], ky: [] };
    if (selectedCungIndex === null || !daiVanImpactSourceLocKy) return result;

    const distanceFromMenh = (selectedCungIndex - activeMenhIndex + 12) % 12;

    for (const p of palaces) {
      const dv = p.daiVan;
      if (dv === undefined) continue;
      const targetDaiVan = selectedDaiVan;
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

      daiVanImpactSourceLocKy.loc.forEach((idx, i) => {
        if (idx === menhVan) result.loc.push({ daiVan: dv, label: `L${i + 1}`, target: menhTarget, cungName: palaces[menhVan].name });
        if (idx === tuongUngVan) result.loc.push({ daiVan: dv, label: `L${i + 1}`, target: tuongUngTarget, cungName: palaces[tuongUngVan].name });
      });
      daiVanImpactSourceLocKy.ky.forEach((idx, i) => {
        if (idx === menhVan) result.ky.push({ daiVan: dv, label: `K${i + 1}`, target: menhTarget, cungName: palaces[menhVan].name });
        if (idx === tuongUngVan) result.ky.push({ daiVan: dv, label: `K${i + 1}`, target: tuongUngTarget, cungName: palaces[tuongUngVan].name });
      });
    }

    result.loc.sort((a, b) => a.daiVan - b.daiVan);
    result.ky.sort((a, b) => a.daiVan - b.daiVan);
    return result;
  }, [selectedCungIndex, selectedDaiVan, activeMenhIndex, getDaiVanRoleName, getCungDisplayName, daiVanImpactSourceLocKy, palaces]);

  const mixedAffectedDaiVan = useMemo(() => {
    const locByDaiVan = new Map<number, AffectedDaiVan['loc']>();
    const kyByDaiVan = new Map<number, AffectedDaiVan['ky']>();

    affectedDaiVan.loc.forEach((item) => {
      const items = locByDaiVan.get(item.daiVan) ?? [];
      items.push(item);
      locByDaiVan.set(item.daiVan, items);
    });

    affectedDaiVan.ky.forEach((item) => {
      const items = kyByDaiVan.get(item.daiVan) ?? [];
      items.push(item);
      kyByDaiVan.set(item.daiVan, items);
    });

    return [...locByDaiVan.keys()]
      .filter((daiVan) => kyByDaiVan.has(daiVan))
      .sort((a, b) => a - b)
      .map((daiVan) => ({
        daiVan,
        loc: locByDaiVan.get(daiVan) ?? [],
        ky: kyByDaiVan.get(daiVan) ?? [],
      }));
  }, [affectedDaiVan]);

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
    if (selectedCungIndex === null || selectedDaiVan === null || selectedDaiVanCungIndex === null || !daiVanClickLocKy) return null;
    const roleIndex = (selectedCungIndex - selectedDaiVanCungIndex + 12) % 12;
    const sameRoleGocIndex = (activeMenhIndex + roleIndex) % 12;
    const roleName = getYearRoleName?.(sameRoleGocIndex) ?? CUNG_NAMES[roleIndex];

    const loc = daiVanClickLocKy.loc
      .map((idx, i) => ({ idx, label: `L${i + 1}` }))
      .filter((item) => item.idx === activeMenhIndex || item.idx === sameRoleGocIndex)
      .map((item) => ({
        ...item,
        target: item.idx === activeMenhIndex ? 'Mệnh' : `${roleName}`,
      }));
    const ky = daiVanClickLocKy.ky
      .map((idx, i) => ({ idx, label: `K${i + 1}` }))
      .filter((item) => item.idx === activeMenhIndex || item.idx === sameRoleGocIndex)
      .map((item) => ({
        ...item,
        target: item.idx === activeMenhIndex ? 'Mệnh' : `${roleName}`,
      }));

    return { roleName, loc, ky };
  }, [selectedCungIndex, selectedDaiVan, selectedDaiVanCungIndex, activeMenhIndex, getYearRoleName, daiVanClickLocKy]);

  // Lộc/Kỵ mở rộng ảnh hưởng đến Mệnh gốc và cùng vai trò gốc
  const extendedToGoc = useMemo(() => {
    if (selectedCungIndex === null || !activeExtendedLocKy || gocRoleCungIndex === null) return null;
    const sameRoleGocIndex = gocRoleCungIndex;
    const roleName = palaces[sameRoleGocIndex].name;

    const loc = activeExtendedLocKy.loc
      .map((idx, i) => ({ idx, label: `L${i + 4}` }))
      .filter((item) => item.idx === activeMenhIndex || item.idx === sameRoleGocIndex)
      .map((item) => ({
        ...item,
        target: item.idx === activeMenhIndex ? 'Mệnh' : `${roleName}`,
      }));
    const ky = activeExtendedLocKy.ky
      .map((idx, i) => ({ idx, label: `K${i + 4}` }))
      .filter((item) => item.idx === activeMenhIndex || item.idx === sameRoleGocIndex)
      .map((item) => ({
        ...item,
        target: item.idx === activeMenhIndex ? 'Mệnh' : `${roleName}`,
      }));

    return { roleName, loc, ky };
  }, [selectedCungIndex, gocRoleCungIndex, activeMenhIndex, activeExtendedLocKy, palaces]);

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
  }, [selectedCungIndex, selectedYear, selectedDaiVan, activeDaiVanCungIndex, activeMenhIndex, detailLocKy]);

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
        sourceLocKy: LocKyLike,
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
        const context: ImpactContext = sourceLayerName === 'năm' && targetLayerName === 'năm' ? 'year-self' : 'default';

        const locList = extended ? sourceLocKy.loc.slice(0, maxExtendedItems) : sourceLocKy.loc;
        const kyList = extended ? sourceLocKy.ky.slice(0, maxExtendedItems) : sourceLocKy.ky;
        const pushImpactSeries = (
          type: 'Lộc' | 'Kỵ',
          hits: readonly number[],
          infinite: boolean | undefined
        ) => {
          const isGood = type === 'Lộc';
          const infiniteLevel = isGood ? sourceLocKy.locInfiniteStartLevel : sourceLocKy.kyInfiniteStartLevel;
          const infiniteIndex = isGood ? sourceLocKy.locInfiniteIndex : sourceLocKy.kyInfiniteIndex;
          const infiniteMenh = Boolean(infinite && infiniteIndex === targetMenhIndex);
          const infiniteRole = Boolean(infinite && !sameTarget && infiniteIndex === targetRoleIndex);

          hits.forEach((idx, i) => {
            const level = i + startLevel;
            const isMenh = idx === targetMenhIndex;
            const isRole = idx === targetRoleIndex;
            if (!isMenh && !isRole) return;
            if (sameTarget && !isMenh) return;
            if ((isMenh && infiniteMenh) || (isRole && infiniteRole)) return;

            const target = isMenh ? `Mệnh ${targetLayerName}` : `${selectedCungName} ${targetLayerName}`;
            const strength = getStrengthLabel(level, distance, type, context);
            const point = getImpactMagnitude(level, distance, context) * (isGood ? 1 : -1);
            score += point;
            details.push({ text: `${getImpactDisplayName(type, level)} ${sourceLabel} xung vào ${target} (${strength})`, point, good: isGood, target });
          });

          if (!infinite || infiniteLevel === undefined || infiniteIndex === undefined) return;

        const pushInfinite = (isMenh: boolean) => {
          const target = isMenh ? `Mệnh ${targetLayerName}` : `${selectedCungName} ${targetLayerName}`;
          const strength = getStrengthLabel(infiniteLevel, distance, type, context);
          const point = getImpactMagnitude(infiniteLevel, distance, context) * (isGood ? 1 : -1);
          score += point;
          details.push({
            text: `${getInfiniteImpactDisplayName(type)} ${sourceLabel} xung vào ${target} (${strength}, khởi từ ${getImpactDisplayName(type, infiniteLevel)}) (Vô hạn)`,
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

  const fixedTienThienDaiVanImpacts = useMemo(() => {
    const targetDaiVan = selectedDaiVan ?? currentDaiVan;
    if (selectedCungIndex === null || targetDaiVan === null || activeDaiVanCungIndex === null) return null;

    const clickRoleIndex = (selectedCungIndex - activeDaiVanCungIndex + 12) % 12;
    const selectedCungName = CUNG_NAMES[clickRoleIndex];
    const dvRoleCan = palaces[selectedCungIndex].can;
    const dvRoleLocKy = calculateLocKy(dvRoleCan, palaces);
    if (!dvRoleLocKy) return null;

    const dvExtendedLocKy = calculateExtendedLocKy(
      dvRoleCan,
      palaces,
      gocTuHoaPalaces.loc,
      gocTuHoaPalaces.ky,
      (index: number) => palaces[index].can
    );

    const gocRoleIndex = (gocMenhIndex + clickRoleIndex) % 12;
    const gocRoleCan = palaces[gocRoleIndex].can;
    const gocRoleLocKy = calculateLocKy(gocRoleCan, palaces);
    if (!gocRoleLocKy) return null;

    const gocExtendedLocKy = calculateExtendedLocKy(
      gocRoleCan,
      palaces,
      gocTuHoaPalaces.loc,
      gocTuHoaPalaces.ky,
      (index: number) => palaces[index].can
    );

    const tienThienToDaiVan: ImpactDetail[] = [];
    const daiVanToTienThien: ImpactDetail[] = [];

    const addImpacts = (
      bucket: ImpactDetail[],
      sourceLocKy: LocKyLike,
      targetMenhIndex: number,
      targetRoleIndex: number,
      distance: number,
      sourceLayerName: string,
      targetLayerName: string,
      extended = false
    ) => {
      const startLevel = extended ? 4 : 1;
      const maxExtendedItems = 6;
      const sameTarget = targetMenhIndex === targetRoleIndex;
      const sourceLabel = `${selectedCungName} ${sourceLayerName}`;

      const pushImpactSeries = (
        type: 'Lộc' | 'Kỵ',
        hits: readonly number[],
        infinite: boolean | undefined
      ) => {
        const isGood = type === 'Lộc';
        const infiniteLevel = isGood ? sourceLocKy.locInfiniteStartLevel : sourceLocKy.kyInfiniteStartLevel;
        const infiniteIndex = isGood ? sourceLocKy.locInfiniteIndex : sourceLocKy.kyInfiniteIndex;
        const infiniteMenh = Boolean(infinite && infiniteIndex === targetMenhIndex);
        const infiniteRole = Boolean(infinite && !sameTarget && infiniteIndex === targetRoleIndex);

        hits.forEach((idx, i) => {
          const level = i + startLevel;
          const isMenh = idx === targetMenhIndex;
          const isRole = idx === targetRoleIndex;
          if (!isMenh && !isRole) return;
          if (sameTarget && !isMenh) return;
          if ((isMenh && infiniteMenh) || (isRole && infiniteRole)) return;

          const target = isMenh ? `Mệnh ${targetLayerName}` : `${selectedCungName} ${targetLayerName}`;
          const strength = getStrengthLabel(level, distance, type);
          const point = getImpactMagnitude(level, distance) * (isGood ? 1 : -1);
          bucket.push({ text: `${getImpactDisplayName(type, level)} ${sourceLabel} xung vào ${target} (${strength})`, point, good: isGood, target });
        });

        if (!infinite || infiniteLevel === undefined || infiniteIndex === undefined) return;

        const pushInfinite = (isMenh: boolean) => {
          const target = isMenh ? `Mệnh ${targetLayerName}` : `${selectedCungName} ${targetLayerName}`;
          const strength = getStrengthLabel(infiniteLevel, distance, type);
          const point = getImpactMagnitude(infiniteLevel, distance) * (isGood ? 1 : -1);
          bucket.push({
            text: `${getInfiniteImpactDisplayName(type)} ${sourceLabel} xung vào ${target} (${strength}, khởi từ ${getImpactDisplayName(type, infiniteLevel)}) (Vô hạn)`,
            point,
            good: isGood,
            target,
          });
        };

        if (infiniteMenh) pushInfinite(true);
        if (infiniteRole) pushInfinite(false);
      };

      pushImpactSeries('Lộc', extended ? sourceLocKy.loc.slice(0, maxExtendedItems) : sourceLocKy.loc, extended ? sourceLocKy.locInfinite : false);
      pushImpactSeries('Kỵ', extended ? sourceLocKy.ky.slice(0, maxExtendedItems) : sourceLocKy.ky, extended ? sourceLocKy.kyInfinite : false);
    };

    addImpacts(tienThienToDaiVan, gocRoleLocKy, activeDaiVanCungIndex, selectedCungIndex, 1, 'tiên thiên', 'Vận');
    addImpacts(tienThienToDaiVan, gocExtendedLocKy, activeDaiVanCungIndex, selectedCungIndex, 1, 'tiên thiên', 'Vận', true);
    addImpacts(daiVanToTienThien, dvRoleLocKy, gocMenhIndex, gocRoleIndex, 1, 'Vận', 'tiên thiên');
    addImpacts(daiVanToTienThien, dvExtendedLocKy, gocMenhIndex, gocRoleIndex, 1, 'Vận', 'tiên thiên', true);

    return { tienThienToDaiVan, daiVanToTienThien };
  }, [selectedCungIndex, selectedDaiVan, currentDaiVan, activeDaiVanCungIndex, palaces, gocTuHoaPalaces, gocMenhIndex]);

  const namMonthAnalysis = useMemo(() => {
    if (selectedYear === null || selectedCungIndex === null || clickRoleIndex === null || !namLocKy) return null;

    const watchedRoleName = CUNG_NAMES[clickRoleIndex];
    const danGocRoleIndex = (2 - gocMenhIndex + 12) % 12;
    const month1MenhIndex = (activeMenhIndex + danGocRoleIndex) % 12;
    const month1RoleName = palaces[2].name;

    type MonthImpact = {
      month: number;
      menhIndex: number;
      roleIndex: number;
      score: number;
      level: 'very-good' | 'good' | 'neutral' | 'bad' | 'very-bad';
      details: ImpactDetail[];
    };

    const months: MonthImpact[] = [];

    const addImpacts = (
      bucket: ImpactDetail[],
      sourceLocKy: LocKyLike,
      targetMenhIndex: number,
      targetRoleIndex: number,
      month: number,
      scoreRef: { value: number },
      extended = false
    ) => {
      const startLevel = extended ? 4 : 1;
      const maxExtendedItems = 6;
      const sameTarget = targetMenhIndex === targetRoleIndex;
      const sourceLabel = `${watchedRoleName} năm`;

      const pushImpactSeries = (
        type: 'Lộc' | 'Kỵ',
        hits: readonly number[],
        infinite: boolean | undefined
      ) => {
        const isGood = type === 'Lộc';
        const infiniteLevel = isGood ? sourceLocKy.locInfiniteStartLevel : sourceLocKy.kyInfiniteStartLevel;
        const infiniteIndex = isGood ? sourceLocKy.locInfiniteIndex : sourceLocKy.kyInfiniteIndex;
        const infiniteMenh = Boolean(infinite && infiniteIndex === targetMenhIndex);
        const infiniteRole = Boolean(infinite && !sameTarget && infiniteIndex === targetRoleIndex);

        hits.forEach((idx, i) => {
          const level = i + startLevel;
          const isMenh = idx === targetMenhIndex;
          const isRole = idx === targetRoleIndex;
          if (!isMenh && !isRole) return;
          if (sameTarget && !isMenh) return;
          if ((isMenh && infiniteMenh) || (isRole && infiniteRole)) return;

          const target = isMenh ? `Mệnh tháng ${month}` : `${watchedRoleName} tháng ${month}`;
          const strength = getStrengthLabel(level, 1, type);
          const point = getImpactMagnitude(level, 1) * (isGood ? 1 : -1);
          scoreRef.value += point;
          bucket.push({ text: `${getImpactDisplayName(type, level)} ${sourceLabel} xung vào ${target} (${strength})`, point, good: isGood, target });
        });

        if (!infinite || infiniteLevel === undefined || infiniteIndex === undefined) return;

        const pushInfinite = (isMenh: boolean) => {
          const target = isMenh ? `Mệnh tháng ${month}` : `${watchedRoleName} tháng ${month}`;
          const strength = getStrengthLabel(infiniteLevel, 1, type);
          const point = getImpactMagnitude(infiniteLevel, 1) * (isGood ? 1 : -1);
          scoreRef.value += point;
          bucket.push({
            text: `${getInfiniteImpactDisplayName(type)} ${sourceLabel} xung vào ${target} (${strength}, khởi từ ${getImpactDisplayName(type, infiniteLevel)}) (Vô hạn)`,
            point,
            good: isGood,
            target,
          });
        };

        if (infiniteMenh) pushInfinite(true);
        if (infiniteRole) pushInfinite(false);
      };

      pushImpactSeries('Lộc', extended ? sourceLocKy.loc.slice(0, maxExtendedItems) : sourceLocKy.loc, extended ? sourceLocKy.locInfinite : false);
      pushImpactSeries('Kỵ', extended ? sourceLocKy.ky.slice(0, maxExtendedItems) : sourceLocKy.ky, extended ? sourceLocKy.kyInfinite : false);
    };

    for (let month = 1; month <= 12; month++) {
      const menhIndex = (month1MenhIndex + (month - 1)) % 12;
      const roleIndex = (menhIndex + clickRoleIndex) % 12;
      const details: ImpactDetail[] = [];
      const scoreRef = { value: 0 };

      addImpacts(details, namLocKy, menhIndex, roleIndex, month, scoreRef);
      if (namExtendedLocKy) {
        addImpacts(details, namExtendedLocKy, menhIndex, roleIndex, month, scoreRef, true);
      }

      let level: MonthImpact['level'] = 'neutral';
      if (scoreRef.value >= 5) level = 'very-good';
      else if (scoreRef.value >= 1) level = 'good';
      else if (scoreRef.value <= -5) level = 'very-bad';
      else if (scoreRef.value <= -1) level = 'bad';

      months.push({
        month,
        menhIndex,
        roleIndex,
        score: scoreRef.value,
        level,
        details,
      });
    }

    return { watchedRoleName, month1MenhIndex, month1RoleName, months };
  }, [selectedYear, selectedCungIndex, clickRoleIndex, namLocKy, namExtendedLocKy, gocMenhIndex, activeMenhIndex, palaces]);

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'very-good': return { text: 'Rất đẹp', color: 'text-emerald-100 bg-emerald-500/15 ring-emerald-400/30' };
      case 'good': return { text: 'Đẹp', color: 'text-sky-100 bg-sky-500/15 ring-sky-400/30' };
      case 'neutral': return { text: 'Bình thường', color: 'text-slate-100 bg-slate-500/15 ring-slate-300/30' };
      case 'bad': return { text: 'Xấu', color: 'text-amber-100 bg-amber-500/15 ring-amber-400/30' };
      case 'very-bad': return { text: 'Rất xấu', color: 'text-red-100 bg-red-500/15 ring-red-400/30' };
      default: return { text: '', color: '' };
    }
  };

  const getTargetLayerOrder = (target: string) => {
    if (target.includes('quái')) return -1;
    if (target.includes('tiên thiên')) return 0;
    if (target.includes('Vận')) return 1;
    if (target.includes('năm')) return 2;
    return 3;
  };

  const isMenhRelatedImpact = useCallback((detail: Pick<ImpactDetail, 'target' | 'text'>) => {
    if (detail.target.trim().startsWith('Mệnh')) return true;
    return /(^|\s)Mệnh(\s|$)/.test(detail.text);
  }, []);

  const getVisibleImpactDetails = useCallback((details: ImpactDetail[]) => {
    if (!hideMenhImpacts) return details;
    return details.filter((detail) => !isMenhRelatedImpact(detail));
  }, [hideMenhImpacts, isMenhRelatedImpact]);

  const renderYearImpactGroups = (
    details: ImpactDetail[],
    prefix: string,
    showPoints = true
  ) => {
    const visibleDetails = getVisibleImpactDetails(details);
    const grouped = visibleDetails.reduce<Array<{ target: string; items: typeof visibleDetails; firstIndex: number }>>((acc, detail, index) => {
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
              {detail.text}
              {showPoints && <> ({detail.point > 0 ? '+' : ''}{detail.point})</>}
            </li>
          ))}
        </ul>
      </div>
    ));
  };

  const summarizeYearImpacts = useCallback((details: ImpactDetail[]) => {
    const visibleDetails = getVisibleImpactDetails(details);
    const grouped = visibleDetails.reduce<Array<{ target: string; point: number; firstIndex: number }>>((acc, detail, index) => {
      const existing = acc.find((item) => item.target === detail.target);
      if (existing) {
        existing.point += detail.point;
      } else {
        acc.push({ target: detail.target, point: detail.point, firstIndex: index });
      }
      return acc;
    }, []);

    const nonZero = grouped.filter((item) => Math.abs(item.point) > 0);
    const source = nonZero.length > 0 ? nonZero : grouped;

    return source
      .sort((a, b) => {
        const pointDiff = Math.abs(b.point) - Math.abs(a.point);
        if (pointDiff !== 0) return pointDiff;
        return a.firstIndex - b.firstIndex;
      })
      .slice(0, 3)
      .map((item) => ({
        target: item.target,
        positive: item.point > 0,
        neutral: item.point === 0,
      }));
  }, [getVisibleImpactDetails]);

  const quaiAnalysis = useMemo(() => {
    if (
      !isQuaiMode ||
      selectedCungIndex === null ||
      !quaiInfo ||
      quaiRoleName === null ||
      !quaiLocKy
    ) {
      return null;
    }

    const quaiRoleLabel = `${quaiRoleName} quái`;
    const forward: ImpactDetail[] = [];
    const backward: ImpactDetail[] = [];

    const addImpacts = (
      bucket: ImpactDetail[],
      sourceLocKy: LocKyLike | null,
      sourceLabel: string,
      targetMenhIndex: number | null,
      targetRoleIndex: number | null,
      targetMenhLabel: string,
      targetRoleLabel: string,
      distance: number,
      extended = false
    ) => {
      if (!sourceLocKy || targetMenhIndex === null || targetRoleIndex === null) return;
      const startLevel = extended ? 4 : 1;
      const maxExtendedItems = 6;
      const sameTarget = targetMenhIndex === targetRoleIndex;

      const pushImpactSeries = (
        type: 'Lộc' | 'Kỵ',
        hits: readonly number[],
        infinite: boolean | undefined
      ) => {
        const isGood = type === 'Lộc';
        const infiniteLevel = isGood ? sourceLocKy.locInfiniteStartLevel : sourceLocKy.kyInfiniteStartLevel;
        const infiniteIndex = isGood ? sourceLocKy.locInfiniteIndex : sourceLocKy.kyInfiniteIndex;
        const infiniteMenh = Boolean(infinite && infiniteIndex === targetMenhIndex);
        const infiniteRole = Boolean(infinite && !sameTarget && infiniteIndex === targetRoleIndex);

        hits.forEach((idx, i) => {
          const level = i + startLevel;
          const isMenh = idx === targetMenhIndex;
          const isRole = idx === targetRoleIndex;
          if (!isMenh && !isRole) return;
          if (sameTarget && !isMenh) return;
          if ((isMenh && infiniteMenh) || (isRole && infiniteRole)) return;

          const target = isMenh ? targetMenhLabel : targetRoleLabel;
          const strength = getStrengthLabel(level, distance, type);
          const point = getImpactMagnitude(level, distance) * (isGood ? 1 : -1);
          bucket.push({
            text: `${getImpactDisplayName(type, level)} ${sourceLabel} xung vào ${target} (${strength})`,
            point,
            good: isGood,
            target,
          });
        });

        if (!infinite || infiniteLevel === undefined || infiniteIndex === undefined) return;

        const pushInfinite = (isMenh: boolean) => {
          const target = isMenh ? targetMenhLabel : targetRoleLabel;
          const strength = getStrengthLabel(infiniteLevel, distance, type);
          const point = getImpactMagnitude(infiniteLevel, distance) * (isGood ? 1 : -1);
          bucket.push({
            text: `${getInfiniteImpactDisplayName(type)} ${sourceLabel} xung vào ${target} (${strength}, khởi từ ${getImpactDisplayName(type, infiniteLevel)}) (Vô hạn)`,
            point,
            good: isGood,
            target,
          });
        };

        if (infiniteMenh) pushInfinite(true);
        if (infiniteRole) pushInfinite(false);
      };

      pushImpactSeries('Lộc', extended ? sourceLocKy.loc.slice(0, maxExtendedItems) : sourceLocKy.loc, extended ? sourceLocKy.locInfinite : false);
      pushImpactSeries('Kỵ', extended ? sourceLocKy.ky.slice(0, maxExtendedItems) : sourceLocKy.ky, extended ? sourceLocKy.kyInfinite : false);
    };

    addImpacts(forward, quaiLocKy, quaiRoleLabel, quaiInfo.chiIndex, selectedCungIndex, 'Mệnh quái', quaiRoleLabel, 0);
    addImpacts(forward, quaiExtendedLocKy, quaiRoleLabel, quaiInfo.chiIndex, selectedCungIndex, 'Mệnh quái', quaiRoleLabel, 0, true);
    addImpacts(forward, quaiLocKy, quaiRoleLabel, gocMenhIndex, quaiGocRoleIndex, 'Mệnh tiên thiên', `${quaiRoleName} tiên thiên`, 0);
    addImpacts(forward, quaiExtendedLocKy, quaiRoleLabel, gocMenhIndex, quaiGocRoleIndex, 'Mệnh tiên thiên', `${quaiRoleName} tiên thiên`, 0, true);
    addImpacts(forward, quaiLocKy, quaiRoleLabel, quaiSelectedDaiVanCungIndex, quaiDaiVanRoleIndex, 'Mệnh Vận', `${quaiRoleName} Vận`, 1);
    addImpacts(forward, quaiExtendedLocKy, quaiRoleLabel, quaiSelectedDaiVanCungIndex, quaiDaiVanRoleIndex, 'Mệnh Vận', `${quaiRoleName} Vận`, 1, true);
    addImpacts(forward, quaiLocKy, quaiRoleLabel, quaiYearInfo?.chiIndex ?? null, quaiNamRoleIndex, 'Mệnh năm', `${quaiRoleName} năm`, 2);
    addImpacts(forward, quaiExtendedLocKy, quaiRoleLabel, quaiYearInfo?.chiIndex ?? null, quaiNamRoleIndex, 'Mệnh năm', `${quaiRoleName} năm`, 2, true);

    addImpacts(backward, quaiGocLocKy, `${quaiRoleName} tiên thiên`, quaiInfo.chiIndex, selectedCungIndex, 'Mệnh quái', quaiRoleLabel, 0);
    addImpacts(backward, quaiGocExtendedLocKy, `${quaiRoleName} tiên thiên`, quaiInfo.chiIndex, selectedCungIndex, 'Mệnh quái', quaiRoleLabel, 0, true);
    addImpacts(backward, quaiDaiVanLocKy, `${quaiRoleName} Vận`, quaiInfo.chiIndex, selectedCungIndex, 'Mệnh quái', quaiRoleLabel, 1);
    addImpacts(backward, quaiDaiVanExtendedLocKy, `${quaiRoleName} Vận`, quaiInfo.chiIndex, selectedCungIndex, 'Mệnh quái', quaiRoleLabel, 1, true);
    addImpacts(backward, quaiNamLocKy, `${quaiRoleName} năm`, quaiInfo.chiIndex, selectedCungIndex, 'Mệnh quái', quaiRoleLabel, 2);
    addImpacts(backward, quaiNamExtendedLocKy, `${quaiRoleName} năm`, quaiInfo.chiIndex, selectedCungIndex, 'Mệnh quái', quaiRoleLabel, 2, true);

    return {
      roleLabel: quaiRoleLabel,
      forward,
      backward,
      forwardSummary: summarizeYearImpacts(forward),
      backwardSummary: summarizeYearImpacts(backward),
    };
  }, [
    isQuaiMode,
    selectedCungIndex,
    quaiInfo,
    quaiRoleName,
    quaiLocKy,
    quaiExtendedLocKy,
    gocMenhIndex,
    quaiGocRoleIndex,
    quaiSelectedDaiVanCungIndex,
    quaiDaiVanRoleIndex,
    quaiYearInfo,
    quaiNamRoleIndex,
    quaiGocLocKy,
    quaiGocExtendedLocKy,
    quaiDaiVanLocKy,
    quaiDaiVanExtendedLocKy,
    quaiNamLocKy,
    quaiNamExtendedLocKy,
    summarizeYearImpacts,
  ]);

  const quaiYearRanking = useMemo(() => {
    const targetDaiVan = quaiSelectedDaiVan ?? currentDaiVan;
    if (
      !isQuaiMode ||
      selectedCungIndex === null ||
      quaiRoleIndex === null ||
      quaiRoleName === null ||
      !quaiInfo ||
      targetDaiVan === null
    ) {
      return null;
    }

    const targetDaiVanCungIndex = palaces.findIndex((p) => p.daiVan === targetDaiVan);
    if (targetDaiVanCungIndex === -1) return null;

    const sortedDaiVan = [...daiVanOptions].sort((a, b) => a - b);
    const dvIndex = sortedDaiVan.indexOf(targetDaiVan);
    const nextDaiVan = sortedDaiVan[dvIndex + 1];
    const endAge = nextDaiVan !== undefined ? nextDaiVan - 1 : targetDaiVan + 9;
    const yearStart = chart.lunarDate.year + targetDaiVan - 1;
    const yearEnd = chart.lunarDate.year + endAge - 1;

    const quaiSourceLocKy = calculateLocKy(quaiInfo.canMap[selectedCungIndex], palaces);
    if (!quaiSourceLocKy) return null;
    const quaiSourceExtended = calculateExtendedLocKy(
      quaiInfo.canMap[selectedCungIndex],
      palaces,
      gocTuHoaPalaces.loc,
      gocTuHoaPalaces.ky,
      (index: number) => palaces[index].can
    );

    const daiVanRoleIndex = (targetDaiVanCungIndex + quaiRoleIndex) % 12;
    const daiVanRoleCan = palaces[daiVanRoleIndex].can;
    const daiVanSourceLocKy = calculateLocKy(daiVanRoleCan, palaces);
    const daiVanSourceExtended = calculateExtendedLocKy(
      daiVanRoleCan,
      palaces,
      gocTuHoaPalaces.loc,
      gocTuHoaPalaces.ky,
      (index: number) => palaces[index].can
    );

    type QuaiYearHit = {
      source: 'year' | 'quai' | 'daiVan';
      type: 'Lộc' | 'Kỵ';
      target: 'menh' | 'role';
    };

    const result: {
      year: number;
      age: number;
      can: string;
      chi: string;
      score: number;
      level: 'very-good' | 'good' | 'neutral' | 'bad' | 'very-bad';
      details: ImpactDetail[];
    }[] = [];

    for (let year = yearStart; year <= yearEnd; year++) {
      const age = year - chart.lunarDate.year + 1;
      const { can, chi, chiIndex } = getYearCanChi(year);
      const yearCanMap = getYearCanMap(can);
      const yearRoleIndex = (chiIndex + quaiRoleIndex) % 12;
      const yearRoleCan = yearCanMap[yearRoleIndex];
      const yearSourceLocKy = calculateLocKy(yearRoleCan, palaces);
      if (!yearSourceLocKy) continue;
      const yearSourceExtended = calculateExtendedLocKy(
        yearRoleCan,
        palaces,
        gocTuHoaPalaces.loc,
        gocTuHoaPalaces.ky,
        (index: number) => palaces[index].can
      );

      const details: ImpactDetail[] = [];
      const hits: QuaiYearHit[] = [];
      let score = 0;
      const getYearTargetLabel = (target: 'menh' | 'role') => (
        target === 'menh' ? 'Mệnh năm' : `${quaiRoleName} năm`
      );

      const addYearTargetImpacts = (
        sourceLocKy: LocKyLike | null,
        sourceLabel: string,
        source: QuaiYearHit['source'],
        distance: number,
        extended = false
      ) => {
        if (!sourceLocKy) return;
        const startLevel = extended ? 4 : 1;
        const maxExtendedItems = 6;
        const context: ImpactContext = source === 'year' ? 'year-self' : 'default';

        const pushImpactSeries = (
          type: 'Lộc' | 'Kỵ',
          items: readonly number[],
          infinite: boolean | undefined
        ) => {
          const isGood = type === 'Lộc';
          const infiniteLevel = isGood ? sourceLocKy.locInfiniteStartLevel : sourceLocKy.kyInfiniteStartLevel;
          const infiniteIndex = isGood ? sourceLocKy.locInfiniteIndex : sourceLocKy.kyInfiniteIndex;

          items.forEach((idx, i) => {
            const level = i + startLevel;
            const targetKind = idx === chiIndex ? 'menh' : idx === yearRoleIndex ? 'role' : null;
            if (!targetKind) return;
            if (extended && infinite && idx === infiniteIndex) return;

            const target = getYearTargetLabel(targetKind);
            const strength = getStrengthLabel(level, distance, type, context);
            const point = getImpactMagnitude(level, distance, context) * (isGood ? 1 : -1);
            score += point;
            hits.push({ source, type, target: targetKind });
            details.push({
              text: `${getImpactDisplayName(type, level)} ${sourceLabel} xung vào ${target} (${strength})`,
              point,
              good: isGood,
              target,
            });
          });

          if (!extended || !infinite || infiniteLevel === undefined || infiniteIndex === undefined) return;
          if (infiniteIndex !== chiIndex && infiniteIndex !== yearRoleIndex) return;

          const targetKind = infiniteIndex === chiIndex ? 'menh' : 'role';
          const target = getYearTargetLabel(targetKind);
          const point = getImpactMagnitude(infiniteLevel, distance, context) * (isGood ? 1 : -1);
          score += point;
          hits.push({ source, type, target: targetKind });
          details.push({
            text: `${getInfiniteImpactDisplayName(type)} ${sourceLabel} xung vào ${target} (${getStrengthLabel(infiniteLevel, distance, type, context)}, khởi từ ${getImpactDisplayName(type, infiniteLevel)}) (Vô hạn)`,
            point,
            good: isGood,
            target,
          });
        };

        pushImpactSeries('Lộc', extended ? sourceLocKy.loc.slice(0, maxExtendedItems) : sourceLocKy.loc, extended ? sourceLocKy.locInfinite : false);
        pushImpactSeries('Kỵ', extended ? sourceLocKy.ky.slice(0, maxExtendedItems) : sourceLocKy.ky, extended ? sourceLocKy.kyInfinite : false);
      };

      addYearTargetImpacts(yearSourceLocKy, `${quaiRoleName} năm gốc`, 'year', 0);
      addYearTargetImpacts(yearSourceExtended, `${quaiRoleName} năm gốc`, 'year', 0, true);
      addYearTargetImpacts(quaiSourceLocKy, `${quaiRoleName} quái`, 'quai', 1);
      addYearTargetImpacts(quaiSourceExtended, `${quaiRoleName} quái`, 'quai', 1, true);
      addYearTargetImpacts(daiVanSourceLocKy, `${quaiRoleName} Vận`, 'daiVan', 1);
      addYearTargetImpacts(daiVanSourceExtended, `${quaiRoleName} Vận`, 'daiVan', 1, true);

      const hasHit = (type: 'Lộc' | 'Kỵ', target: 'menh' | 'role', source?: QuaiYearHit['source']) =>
        hits.some((hit) => hit.type === type && hit.target === target && (source === undefined || hit.source === source));
      const hasAnySourceHit = (type: 'Lộc' | 'Kỵ', source: QuaiYearHit['source']) =>
        hits.some((hit) => hit.type === type && hit.source === source);

      if (hasHit('Kỵ', 'menh') && hasHit('Kỵ', 'role')) {
        score -= 2.5;
      }

      if (hasHit('Lộc', 'menh') && hasHit('Lộc', 'role')) {
        score += 2.5;
      }

      if (hasAnySourceHit('Kỵ', 'year') && hasAnySourceHit('Kỵ', 'quai')) {
        score -= 1.5;
      }

      if (hasAnySourceHit('Lộc', 'year') && hasAnySourceHit('Lộc', 'quai')) {
        score += 1.5;
      }

      if (hasAnySourceHit('Kỵ', 'daiVan') && (hasAnySourceHit('Kỵ', 'year') || hasAnySourceHit('Kỵ', 'quai'))) {
        score -= 1;
      }

      if (hasAnySourceHit('Lộc', 'daiVan') && (hasAnySourceHit('Lộc', 'year') || hasAnySourceHit('Lộc', 'quai'))) {
        score += 1;
      }

      let level: typeof result[number]['level'] = 'neutral';
      if (score >= 5) level = 'very-good';
      else if (score >= 1) level = 'good';
      else if (score <= -5) level = 'very-bad';
      else if (score <= -1) level = 'bad';

      result.push({ year, age, can, chi, score, level, details });
    }

    return result.sort((a, b) => b.score - a.score);
  }, [
    quaiSelectedDaiVan,
    currentDaiVan,
    isQuaiMode,
    selectedCungIndex,
    quaiRoleIndex,
    quaiRoleName,
    quaiInfo,
    palaces,
    daiVanOptions,
    chart.lunarDate.year,
    gocTuHoaPalaces,
  ]);

  const renderImpactLegend = () => (
    <p className="text-[11px] md:text-xs text-gray-500">
      Ký hiệu: <span className="font-semibold text-blue-700">L = Lộc</span>, <span className="font-semibold text-red-700">K = Kỵ</span>.
    </p>
  );

  const renderLocKyOverviewCard = (
    title: string,
    description: string,
    locKy: { loc: readonly number[]; ky: readonly number[] },
    labelResolver: (index: number) => string,
    prefixLoc: string,
    prefixKy: string,
    kyWarnings: Set<string> = new Set()
  ) => {
    const locItems = locKy.loc
      .map((idx, i) => ({ idx, level: i + 1, target: labelResolver(idx) }))
      .filter((item) => !hideMenhImpacts || !item.target.startsWith('Mệnh'));
    const kyItems = locKy.ky
      .map((idx, i) => ({ idx, level: i + 1, target: labelResolver(idx), label: `${prefixKy}${i + 1}` }))
      .filter((item) => !hideMenhImpacts || !item.target.startsWith('Mệnh'));

    return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h4 className="text-sm font-bold text-slate-900 md:text-base font-serif">{title}</h4>
      <p className="mt-1 text-xs leading-relaxed text-gray-600 md:text-sm">{description}</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Lộc</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {locItems.map((item) => (
              <span
                key={`${prefixLoc}-${item.level}`}
                className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800 ring-1 ring-blue-200"
              >
                {prefixLoc}{item.level} {item.target}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Kỵ</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {kyItems.map((item) => (
                <span
                  key={`${prefixKy}-${item.level}`}
                  className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-800 ring-1 ring-red-200"
                >
                  {item.label} {item.target}
                  {kyWarnings.has(item.label) && <span className="ml-1 text-[10px] font-bold text-red-600">(hãm)</span>}
                </span>
            ))}
          </div>
        </div>
      </div>
    </div>
    );
  };

  const quaiBadKy = useMemo(() => {
    if (!isQuaiMode || selectedCungIndex === null || !quaiLocKy || !quaiInfo) return null;
    return quaiLocKy.ky
      .map((idx, i) => ({ idx, label: `K${i + 1}` }))
      .filter((item) => item.idx === quaiInfo.chiIndex || item.idx === selectedCungIndex);
  }, [isQuaiMode, selectedCungIndex, quaiLocKy, quaiInfo]);

  const activeLayerLabel = isQuaiMode
    ? 'Quái'
    : selectedYear !== null
      ? 'Năm'
      : selectedDaiVan !== null
        ? 'Đại Vận'
        : 'Tiên thiên';

  const selectedRoleName = selectedCungIndex !== null
    ? isQuaiMode
      ? getQuaiDisplayName(selectedCungIndex)
      : getCungDisplayName(selectedCungIndex)
    : null;

  const selectedRoleCan = selectedCungIndex !== null
    ? isQuaiMode
      ? quaiInfo?.canMap[selectedCungIndex] ?? null
      : getActiveCan(selectedCungIndex)
    : null;

  const displayActiveMenhIndex = isQuaiMode ? quaiInfo?.chiIndex ?? null : activeMenhIndex;
  const displayActiveMenhLabel = isQuaiMode ? 'Mệnh quái' : 'Mệnh năm';
  const displayDaiVanCungIndex = isQuaiMode ? null : selectedDaiVanCungIndex;
  const displayLocKy = isQuaiMode ? quaiLocKy : activeLocKy;
  const displayDetailLocKy = isQuaiMode ? quaiLocKy : detailLocKy;
  const displayDaiVanLocKy = isQuaiMode ? null : daiVanLocKy;
  const displayAffectedDaiVan = isQuaiMode ? null : affectedDaiVan;
  const displayYearCanMap = isQuaiMode ? quaiInfo?.canMap ?? null : yearInfo?.yearCanMap ?? null;
  const displayRoleNameOnBoard = isQuaiMode ? getQuaiRoleName : getYearRoleName;
  const badKyLabels = new Set(((isQuaiMode ? quaiBadKy : badKy) ?? []).map((item) => item.label));
  const renderBoardPalace = (index: number) => (
    <PalaceComponent
      palace={getPalace(index)}
      daiVanCungIndex={displayDaiVanCungIndex}
      locKyMap={displayLocKy}
      daiVanLocKyMap={displayDaiVanLocKy}
      affectedDaiVan={displayAffectedDaiVan}
      yearCanMap={displayYearCanMap}
      activeMenhIndex={displayActiveMenhIndex}
      activeMenhLabel={displayActiveMenhLabel}
      yearRoleName={displayRoleNameOnBoard?.(index) ?? null}
      isSelected={selectedCungIndex === index}
      onSelect={() => setSelectedCungIndex(index)}
    />
  );

  const boardCenterCard = (
    <div className="feng-medallion flex flex-col items-center justify-center rounded-[1.35rem] p-3 text-center md:p-4">
      <span className="feng-kicker !bg-[rgba(11,16,32,0.48)] !text-[var(--gold-soft)] !shadow-none">Trung tâm lá số</span>
      <h3 className="mt-3 font-serif text-base font-bold text-[var(--text-main)] md:text-lg">Tứ Hóa Phái</h3>
      <p className="mt-1 font-serif text-sm font-semibold text-[var(--text-main)] md:text-base">{chart.name || 'Vô danh'}</p>
      <p className="text-[10px] text-[var(--text-muted)] md:text-xs">{chart.canChi.year} · {chart.amDuong}</p>
      <div className="mt-3 space-y-1 text-xs text-[var(--text-muted)] md:text-sm">
        <p><span className="font-semibold text-rose-300">{chart.menhCung.label}:</span> {chart.menhCung.chi}</p>
        <p><span className="font-semibold text-teal-300">{chart.thanCung.label}:</span> {chart.thanCung.chi}</p>
        <p className="font-serif text-base font-bold text-[var(--gold-soft)] md:text-lg">{chart.menhCuc}</p>
      </div>
      {!isQuaiMode && selectedDaiVan !== null && (
        <p className="imperial-chip imperial-chip-accent mt-3 rounded-full px-3 py-1 text-xs font-semibold md:text-sm">
          Đang xem Đại Vận {selectedDaiVan}
        </p>
      )}
      {!isQuaiMode && yearInfo && (
        <p className="imperial-chip imperial-chip-bad mt-2 rounded-full px-3 py-1 text-xs font-semibold md:text-sm">
          Đang xem năm {selectedYear}: Mệnh năm {palaces[yearInfo.chiIndex].name}
        </p>
      )}
      {isQuaiMode && quaiInfo && (
        <>
          <p className="imperial-chip imperial-chip-bad mt-3 rounded-full px-3 py-1 text-xs font-semibold md:text-sm">
            Mệnh quái tại {palaces[quaiInfo.chiIndex].chi} · {getQuaiDisplayName(quaiInfo.chiIndex)}
          </p>
          <p className="imperial-chip mt-2 rounded-full px-3 py-1 text-xs font-semibold md:text-sm">
            Người B: {quaiBirthYear} ({quaiInfo.can} {quaiInfo.chi})
          </p>
        </>
      )}
      <p className="mt-2 text-[10px] text-[var(--text-muted)]/80 md:text-xs">
        {selectedCungIndex !== null ? 'Cung đang xem sẽ được viền sáng trên bàn đồ.' : 'Chạm một cung để mở phần phân tích bên dưới.'}
      </p>
    </div>
  );

  return (
    <div className="imperial-ui feng-shell mt-6 rounded-[1.35rem] p-3 md:p-5">
      {/* Header info */}
      <div className="mb-5 space-y-4">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.95fr)]">
          <section className="feng-panel rounded-[1.35rem] p-4 md:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div>
                  <h2 className="font-serif text-xl font-bold text-[var(--text-main)] md:text-2xl">Lá số Tử Vi</h2>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    <span className="font-semibold">{chart.name || 'Vô danh'}</span>
                    <span className="mx-1.5 text-[var(--text-muted)]/50">•</span>
                    Dương: {chart.birthDate.split('-').reverse().join('/')}
                    <span className="mx-1.5 text-[var(--text-muted)]/50">•</span>
                    Âm: {chart.lunarDate.day}/{chart.lunarDate.month}/{chart.lunarDate.year}
                    {chart.lunarDate.leap ? ' (nhuận)' : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs md:text-sm">
                  <span className="imperial-chip imperial-chip-accent rounded-full px-3 py-1 font-medium">Năm: {chart.canChi.year}</span>
                  <span className="imperial-chip rounded-full px-3 py-1 font-medium">Tháng: {chart.canChi.month}</span>
                  <span className="imperial-chip rounded-full px-3 py-1 font-medium">Ngày: {chart.canChi.day}</span>
                  <span className="imperial-chip rounded-full px-3 py-1 font-medium">Giờ: {chart.canChi.hour}</span>
                  <span className="imperial-chip imperial-chip-good rounded-full px-3 py-1 font-medium">Tuổi âm hiện tại: {currentAmAge}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:min-w-[280px]">
                <div className="imperial-stat rounded-xl p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-300">Mệnh</p>
                  <p className="mt-1 text-sm font-bold text-[var(--text-main)]">{chart.menhCung.position}</p>
                </div>
                <div className="imperial-stat rounded-xl p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-300">Thân</p>
                  <p className="mt-1 text-sm font-bold text-[var(--text-main)]">{chart.thanCung.position}</p>
                </div>
                <div className="imperial-stat rounded-xl p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Âm Dương</p>
                  <p className="mt-1 text-sm font-bold text-[var(--text-main)]">{chart.amDuong}</p>
                </div>
                <div className="imperial-stat rounded-xl p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--gold-soft)]">Mệnh Cục</p>
                  <p className="mt-1 text-sm font-bold text-[var(--text-main)]">{chart.menhCuc}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="feng-panel rounded-[1.35rem] p-4 md:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--gold-soft)]/80">Điều khiển</p>
                <h3 className="mt-1 text-base font-bold text-[var(--text-main)] font-serif">Chế độ xem và bộ lọc</h3>
              </div>
              <span className="imperial-chip rounded-full px-2.5 py-1 text-[11px] font-medium">
                Đang xem: {activeLayerLabel}
              </span>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--gold-soft)]/80">Lớp phân tích</p>
                <div className="imperial-segmented">
                  {([
                    { key: 'tienThien', label: 'Tiên thiên' },
                    { key: 'daiVan', label: 'Đại Vận' },
                    { key: 'nam', label: 'Năm' },
                    { key: 'quai', label: 'Nhập Quái' },
                  ] as { key: ViewMode; label: string }[]).map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => switchViewMode(m.key)}
                      className={`imperial-tab rounded-xl px-4 py-2 text-xs font-bold transition-all md:text-sm ${
                        viewMode === m.key
                          ? 'imperial-tab-active'
                          : ''
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {viewMode === 'daiVan' && (
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--gold-soft)]/80">Đại Vận</span>
                    <select
                      value={selectedDaiVan ?? ''}
                      onChange={(e) => setSelectedDaiVan(e.target.value ? Number(e.target.value) : null)}
                      className="feng-input w-full rounded-xl px-3 py-2 text-sm"
                    >
                      {daiVanOptions.map((dv) => (
                        <option key={`dv-${dv}`} value={dv}>
                          Đại vận {dv}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {viewMode === 'nam' && (
                  <>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--gold-soft)]/80">Năm xem</span>
                      <input
                        type="number"
                        placeholder="Nhập năm"
                        value={selectedYear ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedYear(val ? Number(val) : null);
                        }}
                        className="feng-input w-full rounded-xl px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--gold-soft)]/80">Tuổi âm</span>
                      <input
                        type="number"
                        placeholder="Tùy chọn"
                        value={currentAge ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCurrentAge(val ? Number(val) : null);
                        }}
                        className="feng-input w-full rounded-xl px-3 py-2 text-sm"
                      />
                    </label>
                  </>
                )}

                {viewMode === 'quai' && (
                  <>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--gold-soft)]/80">Năm sinh người B</span>
                      <input
                        type="number"
                        placeholder="Ví dụ 2005"
                        value={quaiBirthYear ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setQuaiBirthYear(val ? Number(val) : null);
                          setSelectedCungIndex(null);
                        }}
                        className="feng-input w-full rounded-xl px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--gold-soft)]/80">Đại Vận của A</span>
                      <select
                        value={quaiSelectedDaiVan ?? ''}
                        onChange={(e) => setQuaiSelectedDaiVan(e.target.value ? Number(e.target.value) : null)}
                        className="feng-input w-full rounded-xl px-3 py-2 text-sm"
                      >
                        <option value="">Không chọn</option>
                        {daiVanOptions.map((dv) => (
                          <option key={`quai-dv-${dv}`} value={dv}>
                            Đại vận {dv}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--gold-soft)]/80">Năm của A</span>
                      <input
                        type="number"
                        placeholder="Ví dụ 2027"
                        value={quaiSelectedYear ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setQuaiSelectedYear(val ? Number(val) : null);
                        }}
                        className="feng-input w-full rounded-xl px-3 py-2 text-sm"
                      />
                    </label>
                  </>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedYear !== null && (
                  <button
                    type="button"
                    onClick={() => setSelectedYear(null)}
                    className="imperial-button-secondary rounded-full px-3 py-1.5 text-xs font-medium transition"
                  >
                    Bỏ năm đang chọn
                  </button>
                )}
                {currentAge !== null && (
                  <button
                    type="button"
                    onClick={() => setCurrentAge(null)}
                    className="imperial-button-secondary rounded-full px-3 py-1.5 text-xs font-medium transition"
                  >
                    Bỏ tuổi âm
                  </button>
                )}
                {viewMode === 'quai' && quaiBirthYear !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuaiBirthYear(null);
                      setSelectedCungIndex(null);
                    }}
                    className="imperial-button-secondary rounded-full px-3 py-1.5 text-xs font-medium transition"
                  >
                    Xóa năm người B
                  </button>
                )}
                {viewMode === 'quai' && quaiSelectedYear !== null && (
                  <button
                    type="button"
                    onClick={() => setQuaiSelectedYear(null)}
                    className="imperial-button-secondary rounded-full px-3 py-1.5 text-xs font-medium transition"
                  >
                    Bỏ năm của A
                  </button>
                )}
                {viewMode === 'quai' && currentDaiVan !== null && (
                  <button
                    type="button"
                    onClick={() => setQuaiSelectedDaiVan(currentDaiVan)}
                    className="imperial-button-secondary rounded-full px-3 py-1.5 text-xs font-medium transition"
                  >
                    Dùng Đại Vận hiện tại
                  </button>
                )}
                {viewMode === 'quai' && quaiSelectedDaiVan !== null && (
                  <button
                    type="button"
                    onClick={() => setQuaiSelectedDaiVan(null)}
                    className="imperial-button-secondary rounded-full px-3 py-1.5 text-xs font-medium transition"
                  >
                    Bỏ Đại Vận A
                  </button>
                )}
                {selectedCungIndex !== null && (
                  <button
                    type="button"
                    onClick={() => setSelectedCungIndex(null)}
                    className="imperial-button-secondary rounded-full px-3 py-1.5 text-xs font-medium transition"
                  >
                    Bỏ chọn Lộc/Kỵ
                  </button>
                )}
                {selectedCungIndex !== null && (
                  <button
                    type="button"
                    aria-pressed={hideMenhImpacts}
                    onClick={() => setHideMenhImpacts((value) => !value)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      hideMenhImpacts
                        ? 'bg-[linear-gradient(135deg,#f3d27a,#d4af37,#9f6f17)] text-[#211500]'
                        : 'imperial-button-secondary text-[var(--text-main)]'
                    }`}
                  >
                    {hideMenhImpacts ? 'Hiện tác động của Mệnh' : 'Ẩn tác động của Mệnh'}
                  </button>
                )}
                {viewMode === 'daiVan' && (selectedDaiVan !== null || currentDaiVan !== null) && selectedCungIndex !== null && (
                  <button
                    type="button"
                    onClick={() => setShowYearRanking((s) => !s)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
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
                {viewMode === 'quai' && quaiInfo && selectedCungIndex !== null && (
                  <button
                    type="button"
                    onClick={() => setShowQuaiYearRanking((s) => !s)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      showQuaiYearRanking
                        ? 'bg-violet-600 text-white hover:bg-violet-700'
                        : 'bg-violet-100 text-violet-800 hover:bg-violet-200'
                    }`}
                  >
                    {showQuaiYearRanking
                      ? 'Ẩn năm tốt/xấu của Quái'
                      : `Năm tốt/xấu cho ${getQuaiDisplayName(selectedCungIndex)}`}
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>

        {viewMode === 'nam' && yearInfo && (
          <div className="grid gap-3 md:grid-cols-3">
            <div className="imperial-stat rounded-xl p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--gold-soft)]">Năm đang xem</p>
              <p className="mt-1 text-sm font-bold text-[var(--text-main)]">{selectedYear}: {yearInfo.can} {yearInfo.chi}</p>
            </div>
            <div className="imperial-stat rounded-xl p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-300">Mệnh năm</p>
              <p className="mt-1 text-sm font-bold text-[var(--text-main)]">{palaces[yearInfo.chiIndex].name}</p>
            </div>
            {currentDaiVan !== null && (
              <div className="imperial-stat rounded-xl p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-300">Đại Vận hiện tại</p>
                <p className="mt-1 text-sm font-bold text-[var(--text-main)]">
                  {currentDaiVan} tuổi ({palaces.find((p) => p.daiVan === currentDaiVan)?.name})
                </p>
              </div>
            )}
          </div>
        )}

        {viewMode === 'quai' && (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="imperial-stat rounded-xl p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--gold-soft)]">Năm sinh người B</p>
              <p className="mt-1 text-sm font-bold text-[var(--text-main)]">
                {quaiInfo ? `${quaiBirthYear}: ${quaiInfo.can} ${quaiInfo.chi}` : 'Chưa nhập'}
              </p>
            </div>
            <div className="imperial-stat rounded-xl p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-300">Mệnh quái</p>
              <p className="mt-1 text-sm font-bold text-[var(--text-main)]">
                {quaiInfo ? `${getQuaiDisplayName(quaiInfo.chiIndex)} tại ${palaces[quaiInfo.chiIndex].chi}` : 'Chưa xác định'}
              </p>
            </div>
            <div className="imperial-stat rounded-xl p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-300">Đại Vận của A</p>
              <p className="mt-1 text-sm font-bold text-[var(--text-main)]">
                {quaiSelectedDaiVan !== null && quaiSelectedDaiVanCungIndex !== null && quaiSelectedDaiVanCungIndex >= 0
                  ? `${quaiSelectedDaiVan} tuổi (${palaces[quaiSelectedDaiVanCungIndex].name})`
                  : 'Không chọn'}
              </p>
            </div>
            <div className="imperial-stat rounded-xl p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-300">Năm của A</p>
              <p className="mt-1 text-sm font-bold text-[var(--text-main)]">
                {quaiYearInfo ? `${quaiSelectedYear}: ${quaiYearInfo.can} ${quaiYearInfo.chi}` : 'Không chọn'}
              </p>
            </div>
          </div>
        )}

        {selectedCungIndex !== null && selectedRoleName && (
          <section className="feng-panel rounded-[1.2rem] p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--gold-soft)]/80">Ngữ cảnh đang xem</p>
                <h3 className="mt-1 text-base font-bold text-[var(--text-main)] font-serif">{selectedRoleName}</h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Phân tích theo lớp <span className="font-semibold text-[var(--text-main)]">{activeLayerLabel}</span>
                  {selectedRoleCan && <> · Can của cung: <span className="font-semibold text-[var(--text-main)]">{selectedRoleCan}</span></>}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {!isQuaiMode && selectedDaiVan !== null && (
                  <span className="imperial-chip imperial-chip-accent rounded-full px-3 py-1 font-medium">Đại Vận {selectedDaiVan}</span>
                )}
                {!isQuaiMode && selectedYear !== null && yearInfo && (
                  <span className="imperial-chip imperial-chip-bad rounded-full px-3 py-1 font-medium">Năm {selectedYear}: {yearInfo.can} {yearInfo.chi}</span>
                )}
                {isQuaiMode && quaiInfo && (
                  <span className="imperial-chip imperial-chip-bad rounded-full px-3 py-1 font-medium">Người B: {quaiBirthYear} ({quaiInfo.can} {quaiInfo.chi})</span>
                )}
                {isQuaiMode && quaiSelectedDaiVan !== null && (
                  <span className="imperial-chip imperial-chip-accent rounded-full px-3 py-1 font-medium">Đại Vận A: {quaiSelectedDaiVan}</span>
                )}
                {isQuaiMode && quaiSelectedYear !== null && quaiYearInfo && (
                  <span className="imperial-chip rounded-full px-3 py-1 font-medium">Năm A: {quaiSelectedYear} ({quaiYearInfo.can} {quaiYearInfo.chi})</span>
                )}
                <span className="imperial-chip rounded-full px-3 py-1 font-medium">Click cung để đổi trọng tâm phân tích</span>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* 12-palace board - Tứ Hóa Phái layout */}
      <div className="feng-board mx-auto mt-6 max-w-5xl rounded-[1.6rem] p-3 md:p-5">
      <div className="relative z-10 mx-auto grid max-w-4xl grid-cols-4 gap-2 md:gap-3">
        {/* Row 1: Tỵ -> Thân */}
        {renderBoardPalace(5)}
        {renderBoardPalace(6)}
        {renderBoardPalace(7)}
        {renderBoardPalace(8)}

        {/* Row 2: Thìn + center + Dậu */}
        {renderBoardPalace(4)}
        <div className="col-span-2 row-span-2">
          {boardCenterCard}
        </div>
        {renderBoardPalace(9)}

        {/* Row 3: Mão + center + Tuất */}
        {renderBoardPalace(3)}
        {renderBoardPalace(10)}

        {/* Row 4: Dần -> Hợi (Tý Sửu ở giữa dưới) */}
        {renderBoardPalace(2)}
        {renderBoardPalace(1)}
        {renderBoardPalace(0)}
        {renderBoardPalace(11)}
      </div>

      <div className="mx-auto mt-5 grid max-w-5xl gap-4 xl:grid-cols-2">
        {selectedCungIndex !== null && displayDetailLocKy && renderLocKyOverviewCard(
          `${activeLayerLabel} của ${selectedRoleName ?? getCungDisplayName(selectedCungIndex)}`,
          isQuaiMode
            ? `Lộc/Kỵ của cung quái đang chọn được an theo can quái; phần mở rộng vẫn bám theo can gốc của lá số A.`
            : `Ba tầng Lộc/Kỵ chính đang tác động trực tiếp từ cung được chọn${selectedRoleCan ? ` (${selectedRoleCan})` : ''}.`,
          displayDetailLocKy,
          (index) => isQuaiMode ? getQuaiDisplayName(index) : getCungDisplayName(index),
          'L',
          'K',
          badKyLabels
        )}
        {!isQuaiMode && selectedDaiVanCungIndex !== null && daiVanLocKy && renderLocKyOverviewCard(
          `Lộc/Kỵ của Đại Vận ${selectedDaiVan ?? currentDaiVan}`,
          `Tóm tắt các vị trí LĐV/KĐV của Mệnh Vận ${palaces[selectedDaiVanCungIndex].name}.`,
          daiVanLocKy,
          (index) => `${getDaiVanRoleName?.(index) ?? palaces[index].name} Vận`,
          'LĐV',
          'KĐV'
        )}
      </div>
      </div>

      {isQuaiMode && (
        <div className="mx-auto mt-4 max-w-5xl space-y-4">
          {!quaiInfo && (
            <div className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm md:p-5">
              <h4 className="text-sm font-bold text-amber-900 md:text-base font-serif">Nhập Quái</h4>
              <p className="mt-1 text-xs leading-relaxed text-gray-600 md:text-sm">
                Nhập năm sinh của người B để an hệ quái chồng lên lá số A. Sau đó click một cung để xem Lộc/Kỵ quái và đối chiếu hai chiều giữa quái với Tiên thiên, Đại Vận và Năm của A.
              </p>
            </div>
          )}

          {selectedCungIndex !== null && quaiInfo && quaiAnalysis && (
            <>
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-sky-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-sky-900 md:text-base font-serif">Quái → Lá số A</h4>
                      <p className="mt-1 text-xs leading-relaxed text-gray-600 md:text-sm">
                        Lộc/Kỵ của <span className="font-semibold text-slate-900">{quaiAnalysis.roleLabel}</span> tác động vào Mệnh quái, chính cung quái và 3 tầng của lá số A.
                      </p>
                    </div>
                    <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-800 ring-1 ring-sky-200">
                      Can quái: {selectedRoleCan}
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-[11px] font-medium text-gray-600">3 tác động chính</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {quaiAnalysis.forwardSummary.length > 0 ? (
                        quaiAnalysis.forwardSummary.map((impact, index) => (
                          <span
                            key={`quai-forward-summary-${index}`}
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${
                              impact.neutral
                                ? 'bg-gray-50 text-gray-700 ring-gray-200'
                                : impact.positive
                                  ? 'bg-blue-50 text-blue-700 ring-blue-200'
                                  : 'bg-red-50 text-red-700 ring-red-200'
                            }`}
                          >
                            {impact.neutral ? '•' : impact.positive ? '+' : '-'} {impact.target}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-gray-500">Chưa có tương tác trọng yếu.</span>
                      )}
                    </div>
                  </div>
                  <details className="mt-3 rounded-lg border border-sky-100 bg-sky-50/40">
                    <summary className="cursor-pointer list-none px-3 py-2 text-[11px] font-semibold text-sky-800 md:text-xs">
                      Xem chi tiết Quái → Lá số A
                    </summary>
                    <div className="border-t border-sky-100 px-3 py-2 space-y-1">
                      {renderImpactLegend()}
                      {quaiAnalysis.forward.length > 0 ? (
                        renderYearImpactGroups(quaiAnalysis.forward, 'quai-forward')
                      ) : (
                        <p className="text-[11px] md:text-xs text-gray-500">Không có chi tiết phát sinh.</p>
                      )}
                    </div>
                  </details>
                </div>

                <div className="rounded-2xl border border-violet-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-violet-900 md:text-base font-serif">Lá số A → Quái</h4>
                      <p className="mt-1 text-xs leading-relaxed text-gray-600 md:text-sm">
                        Lộc/Kỵ của cùng vai trò bên lá số A đi ngược lại để xem ảnh hưởng lên Mệnh quái và <span className="font-semibold text-slate-900">{quaiAnalysis.roleLabel}</span>.
                      </p>
                    </div>
                    <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-800 ring-1 ring-violet-200">
                      Mở rộng dùng can gốc của A
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-[11px] font-medium text-gray-600">3 tác động chính</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {quaiAnalysis.backwardSummary.length > 0 ? (
                        quaiAnalysis.backwardSummary.map((impact, index) => (
                          <span
                            key={`quai-backward-summary-${index}`}
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${
                              impact.neutral
                                ? 'bg-gray-50 text-gray-700 ring-gray-200'
                                : impact.positive
                                  ? 'bg-blue-50 text-blue-700 ring-blue-200'
                                  : 'bg-red-50 text-red-700 ring-red-200'
                            }`}
                          >
                            {impact.neutral ? '•' : impact.positive ? '+' : '-'} {impact.target}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-gray-500">Chưa có tương tác trọng yếu.</span>
                      )}
                    </div>
                  </div>
                  <details className="mt-3 rounded-lg border border-violet-100 bg-violet-50/40">
                    <summary className="cursor-pointer list-none px-3 py-2 text-[11px] font-semibold text-violet-800 md:text-xs">
                      Xem chi tiết Lá số A → Quái
                    </summary>
                    <div className="border-t border-violet-100 px-3 py-2 space-y-1">
                      {renderImpactLegend()}
                      {quaiAnalysis.backward.length > 0 ? (
                        renderYearImpactGroups(quaiAnalysis.backward, 'quai-backward')
                      ) : (
                        <p className="text-[11px] md:text-xs text-gray-500">Không có chi tiết phát sinh.</p>
                      )}
                    </div>
                  </details>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h4 className="text-sm font-bold text-slate-900 md:text-base font-serif">Nguyên tắc đang áp dụng</h4>
                <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-gray-700 md:text-sm">
                  <li>Mệnh quái đặt theo địa chi năm sinh của người B.</li>
                  <li>12 cung quái được an lại từ Mệnh quái theo cùng thứ tự cung hiện tại.</li>
                  <li>Can 12 cung quái được an bằng Ngũ Hổ Độn theo thiên can năm sinh của người B.</li>
                  <li>L1-L3 và K1-K3 của quái dùng can quái; Lộc/Kỵ mở rộng vẫn dùng can gốc của lá số A.</li>
                  <li>Khi đối chiếu với A, hệ thống xét đủ Tiên thiên, Đại Vận và Năm theo context đang chọn trong tab này.</li>
                </ul>
              </div>

              {showQuaiYearRanking && quaiYearRanking && quaiYearRanking.length > 0 && (
                <div className="rounded-2xl border border-violet-200 bg-white p-4 shadow-sm md:p-5">
                  <h4 className="font-bold text-violet-900 mb-3 text-base md:text-lg font-serif">
                    Năm tốt & xấu cho {quaiAnalysis.roleLabel}
                  </h4>
                  <p className="text-xs md:text-sm text-gray-600 mb-4 leading-relaxed">
                    Mỗi năm được chấm theo 2 điểm trọng yếu của lá số A: <strong>Mệnh năm</strong> và <strong>{quaiRoleName} năm</strong>.
                    Điểm tăng hoặc giảm mạnh hơn khi năm gốc của A và quái cùng chạm vào các điểm này; nếu Đại Vận cũng chiếu vào thì độ mạnh được cộng thêm.
                  </p>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <h5 className="font-bold text-emerald-800 mb-2 text-sm md:text-base font-serif">Năm tốt nhất</h5>
                      <div className="space-y-2">
                        {quaiYearRanking.slice(0, 5).map((item) => {
                          const level = getLevelLabel(item.level);
                          const topImpacts = summarizeYearImpacts(item.details);
                          return (
                            <div key={`quai-good-${item.year}`} className="rounded-lg border border-emerald-200 bg-white/80 p-2.5 shadow-sm">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-sm md:text-base text-gray-900">
                                  Năm {item.year} ({item.can} {item.chi})
                                </span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ring-1 ${level.color}`}>
                                  {level.text} · {item.score > 0 ? '+' : ''}{item.score}
                                </span>
                              </div>
                              <p className="text-[11px] md:text-xs text-gray-500 mb-1">Tuổi âm: {item.age}</p>
                              {topImpacts.length > 0 && (
                                <div className="mb-2">
                                  <p className="text-[11px] md:text-xs font-medium text-gray-600">3 tác động chính</p>
                                  <div className="mt-1 flex flex-wrap gap-1.5">
                                    {topImpacts.map((impact, index) => (
                                      <span
                                        key={`quai-good-summary-${item.year}-${index}`}
                                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${
                                          impact.neutral
                                            ? 'bg-gray-50 text-gray-700 ring-gray-200'
                                            : impact.positive
                                              ? 'bg-blue-50 text-blue-700 ring-blue-200'
                                              : 'bg-red-50 text-red-700 ring-red-200'
                                        }`}
                                      >
                                        {impact.neutral ? '•' : impact.positive ? '+' : '-'} {impact.target}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <details className="rounded-lg border border-emerald-100 bg-emerald-50/40">
                                <summary className="cursor-pointer list-none px-3 py-2 text-[11px] font-semibold text-emerald-800 md:text-xs">
                                  Xem chi tiết
                                </summary>
                                <div className="border-t border-emerald-100 px-3 py-2 space-y-1">
                                  {renderImpactLegend()}
                                  {renderYearImpactGroups(item.details, `quai-good-detail-${item.year}`)}
                                </div>
                              </details>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-bold text-red-800 mb-2 text-sm md:text-base font-serif">Năm xấu nhất</h5>
                      <div className="space-y-2">
                        {[...quaiYearRanking].reverse().slice(0, 5).map((item) => {
                          const level = getLevelLabel(item.level);
                          const topImpacts = summarizeYearImpacts(item.details);
                          return (
                            <div key={`quai-bad-${item.year}`} className="rounded-lg border border-red-200 bg-white/80 p-2.5 shadow-sm">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-sm md:text-base text-gray-900">
                                  Năm {item.year} ({item.can} {item.chi})
                                </span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ring-1 ${level.color}`}>
                                  {level.text} · {item.score > 0 ? '+' : ''}{item.score}
                                </span>
                              </div>
                              <p className="text-[11px] md:text-xs text-gray-500 mb-1">Tuổi âm: {item.age}</p>
                              {topImpacts.length > 0 && (
                                <div className="mb-2">
                                  <p className="text-[11px] md:text-xs font-medium text-gray-600">3 tác động chính</p>
                                  <div className="mt-1 flex flex-wrap gap-1.5">
                                    {topImpacts.map((impact, index) => (
                                      <span
                                        key={`quai-bad-summary-${item.year}-${index}`}
                                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${
                                          impact.neutral
                                            ? 'bg-gray-50 text-gray-700 ring-gray-200'
                                            : impact.positive
                                              ? 'bg-blue-50 text-blue-700 ring-blue-200'
                                              : 'bg-red-50 text-red-700 ring-red-200'
                                        }`}
                                      >
                                        {impact.neutral ? '•' : impact.positive ? '+' : '-'} {impact.target}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <details className="rounded-lg border border-red-100 bg-red-50/30">
                                <summary className="cursor-pointer list-none px-3 py-2 text-[11px] font-semibold text-red-800 md:text-xs">
                                  Xem chi tiết
                                </summary>
                                <div className="border-t border-red-100 px-3 py-2 space-y-1">
                                  {renderImpactLegend()}
                                  {renderYearImpactGroups(item.details, `quai-bad-detail-${item.year}`)}
                                </div>
                              </details>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {selectedCungIndex !== null && !isQuaiMode && (
        <details className="mx-auto mt-4 max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <summary className="cursor-pointer list-none bg-slate-50/90 p-4 md:p-5">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 md:text-base font-serif">Phân tích chi tiết mở rộng</h4>
                <p className="mt-1 text-xs leading-relaxed text-gray-600 md:text-sm">
                  Giữ lại toàn bộ các lớp giải thích chi tiết, nhưng gom vào một khu riêng để phần đọc nhanh phía trên bớt rối.
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200 md:text-xs">
                Mở khi cần xem đầy đủ
              </span>
            </div>
          </summary>
          <div className="space-y-4 border-t border-slate-100 p-4 md:p-5">

      {(visibleKetLuan.tienThien.length > 0 || visibleKetLuan.daiVan.length > 0 || visibleKetLuan.nam.length > 0) && (
        <div className="max-w-4xl mx-auto mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs md:text-sm">
          <h4 className="font-bold text-emerald-900 mb-2">Đối chiếu theo từng tầng</h4>
          <div className="mb-2">
            {renderImpactLegend()}
          </div>

          {visibleKetLuan.tienThien.length > 0 && (
            <div className="mt-2">
              <p className="font-semibold text-emerald-800 mb-1">Tiên thiên</p>
              {renderKetLuanItems(visibleKetLuan.tienThien)}
            </div>
          )}

          {visibleKetLuan.daiVan.length > 0 && (
            <div className="mt-3">
              <p className="font-semibold text-emerald-800 mb-1">Đại Vận</p>
              {renderKetLuanItems(visibleKetLuan.daiVan)}
            </div>
          )}

          {visibleKetLuan.nam.length > 0 && (
            <div className="mt-3">
              <p className="font-semibold text-emerald-800 mb-1">Năm</p>
              {renderKetLuanItems(visibleKetLuan.nam)}
            </div>
          )}
        </div>
      )}

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
                        <span className="font-medium">{expandImpactLabel(item.label)}</span> rơi vào <span className="font-medium">{item.target}</span>
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
                        <span className="font-medium">{expandImpactLabel(item.label)}</span> rơi vào <span className="font-medium">{item.target}</span>
                        {selectedDaiVan === null && <> của Đại Vận <span className="font-medium">{item.daiVan}</span></>}.
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {mixedAffectedDaiVan.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <span className="font-semibold text-amber-700">Đại Vận có cả tốt và xấu:</span>
                  <ul className="list-disc list-inside ml-1 text-gray-700 space-y-0.5">
                    {mixedAffectedDaiVan.map((item) => (
                      <li key={`mixed-dai-van-${item.daiVan}`}>
                        Đại Vận <span className="font-medium">{item.daiVan}</span> có cả Lộc và Kỵ cùng xuất hiện.
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
      {activeExtendedLocKy && (activeExtendedLocKy.loc.length > 0 || activeExtendedLocKy.ky.length > 0 || activeExtendedLocKy.isInfinite) && (
        <div className="max-w-4xl mx-auto mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs md:text-sm">
          <h4 className="font-bold text-purple-900 mb-2">
            {selectedDaiVan !== null && getDaiVanRoleName && selectedCungIndex !== null
              ? `Lộc/Kỵ mở rộng của ${getDaiVanRoleName(selectedCungIndex)} Vận trong Đại Vận ${selectedDaiVan}`
              : selectedYear !== null
                ? `Lộc/Kỵ mở rộng năm từ cung ${selectedCungIndex !== null ? getCungDisplayName(selectedCungIndex) : ''}`
                : `Lộc/Kỵ mở rộng từ cung ${selectedCungIndex !== null ? getCungDisplayName(selectedCungIndex) : ''}`}
            {activeExtendedLocKy.isInfinite && <span className="text-red-600 ml-2">(Vô hạn)</span>}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-semibold text-blue-600">Lộc mở rộng:</span>
              {activeExtendedLocKy.loc.length > 0 ? (
                <ul className="list-disc list-inside ml-1 text-gray-700 space-y-0.5">
                  {activeExtendedLocKy.loc.map((idx, i) => (
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
              {activeExtendedLocKy.ky.length > 0 ? (
                <ul className="list-disc list-inside ml-1 text-gray-700 space-y-0.5">
                  {activeExtendedLocKy.ky.map((idx, i) => (
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
                      <span className="font-medium">{expandImpactLabel(item.label)}</span> rơi vào <span className="font-medium">{item.target}</span>.
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
                      <span className="font-medium">{expandImpactLabel(item.label)}</span> rơi vào <span className="font-medium">{item.target}</span>.
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
                    <span className="font-medium">{expandImpactLabel(item.label)}</span> rơi vào <span className="font-medium">{item.target}</span>.
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
                    <span className="font-medium">{expandImpactLabel(item.label)}</span> rơi vào <span className="font-medium">{item.target}</span>.
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
                      <span className="font-medium">{expandImpactLabel(item.label)}</span> rơi vào <span className="font-medium">{item.target}</span>.
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
                      <span className="font-medium">{expandImpactLabel(item.label)}</span> rơi vào <span className="font-medium">{item.target}</span>.
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

          </div>
        </details>
      )}

      {/* Panel Kết luận tổng hợp */}
      {selectedCungIndex !== null && !isQuaiMode && (
        <div className="mx-auto mt-4 max-w-5xl rounded-2xl border border-emerald-200 bg-white p-4 text-sm shadow-sm md:p-5 md:text-base">
          <h4 className="font-bold text-emerald-900 mb-3 text-base md:text-lg font-serif">
            Kết luận tổng hợp
          </h4>
          <p className="text-xs md:text-sm text-gray-600 mb-3 leading-relaxed">
            Lộc = tốt, Kỵ = xấu. Mỗi tầng tự ảnh hưởng đến chính mình: Tiên thiên → tiên thiên, Đại Vận → Đại Vận, Năm → Năm.
            Nếu xuất hiện cả Lộc và Kỵ thì cung/Đại Vận/năm đó có cả mặt tốt lẫn xấu.
          </p>
          <div className="mb-3">
            {renderImpactLegend()}
          </div>

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
                    <span className={`font-bold ${item.type === 'Lộc' ? 'text-blue-700' : 'text-gray-900'}`}>{expandImpactLabel(item.label)}</span>
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

            const hasTienThien = visibleKetLuan.tienThien.length > 0;
            const hasDaiVan = visibleKetLuan.daiVan.length > 0;
            const hasNam = visibleKetLuan.nam.length > 0;

            if (!hasTienThien && !hasDaiVan && !hasNam) {
              return <p className="text-gray-600">Không có Lộc/Kỵ nào xung vào các cung trọng yếu.</p>;
            }

            return (
              <div className="space-y-3">
                {hasTienThien && (
                  <div>
                    <h5 className="font-bold text-emerald-800 mb-2 text-sm md:text-base font-serif">Tiên thiên</h5>
                    {renderItems(visibleKetLuan.tienThien)}
                  </div>
                )}

                {hasDaiVan && (
                  <div>
                    <h5 className="font-bold text-emerald-800 mb-2 text-sm md:text-base font-serif">Đại Vận</h5>
                    {renderItems(visibleKetLuan.daiVan)}
                  </div>
                )}

                {hasNam && (
                  <div>
                    <h5 className="font-bold text-emerald-800 mb-2 text-sm md:text-base font-serif">Năm</h5>
                    {renderItems(visibleKetLuan.nam)}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {viewMode === 'nam' && selectedYear !== null && namMonthAnalysis && (
        <div className="mx-auto mt-4 max-w-5xl rounded-2xl border border-sky-200 bg-white p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <h4 className="font-bold text-sky-900 text-base md:text-lg font-serif">
                Ảnh hưởng theo tháng trong năm {selectedYear}
              </h4>
              <p className="mt-1 text-xs md:text-sm text-gray-600 leading-relaxed">
                Mệnh tháng 1 khởi từ <span className="font-semibold text-sky-800">{namMonthAnalysis.month1RoleName} năm</span> theo cung Dần gốc,
                sau đó đi theo chiều kim đồng hồ. Mỗi tháng xét 2 vị trí: <span className="font-semibold">Mệnh tháng</span> và
                <span className="font-semibold"> {namMonthAnalysis.watchedRoleName} tháng</span>.
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 ring-1 ring-sky-200 md:text-xs">
              Dùng Lộc/Kỵ năm, kể cả mở rộng và vô hạn
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {namMonthAnalysis.months.map((monthItem) => {
              const level = getLevelLabel(monthItem.level);
              const topImpacts = summarizeYearImpacts(monthItem.details);
              const monthMenhName = `${getYearRoleName?.(monthItem.menhIndex) ?? palaces[monthItem.menhIndex].name} năm`;
              const monthRoleName = `${getYearRoleName?.(monthItem.roleIndex) ?? palaces[monthItem.roleIndex].name} năm`;

              return (
                <div key={`month-${monthItem.month}`} className="rounded-xl border border-sky-200 bg-sky-50/40 p-3 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h5 className="font-bold text-sm md:text-base text-slate-900">Tháng {monthItem.month}</h5>
                      <p className="mt-0.5 text-[11px] md:text-xs text-gray-600">
                        Mệnh tháng: <span className="font-semibold text-slate-800">{monthMenhName}</span>
                      </p>
                      <p className="text-[11px] md:text-xs text-gray-600">
                        {namMonthAnalysis.watchedRoleName} tháng: <span className="font-semibold text-slate-800">{monthRoleName}</span>
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-bold ring-1 ${level.color}`}>
                      {level.text} · {monthItem.score > 0 ? '+' : ''}{monthItem.score}
                    </span>
                  </div>

                  {topImpacts.length > 0 ? (
                    <div className="mt-3">
                      <p className="text-[11px] md:text-xs font-medium text-gray-600">Tác động chính</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {topImpacts.map((impact, index) => (
                          <span
                            key={`month-summary-${monthItem.month}-${index}`}
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${
                              impact.neutral
                                ? 'bg-gray-50 text-gray-700 ring-gray-200'
                                : impact.positive
                                  ? 'bg-blue-50 text-blue-700 ring-blue-200'
                                  : 'bg-red-50 text-red-700 ring-red-200'
                            }`}
                          >
                            {impact.neutral ? '•' : impact.positive ? '+' : '-'} {impact.target}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-[11px] md:text-xs text-gray-500">
                      Không có Lộc/Kỵ năm chạm vào 2 vị trí trọng yếu của tháng này.
                    </p>
                  )}

                  <details className="mt-3 rounded-lg border border-sky-100 bg-white">
                    <summary className="cursor-pointer list-none px-3 py-2 text-[11px] font-semibold text-sky-800 md:text-xs">
                      Xem chi tiết tháng {monthItem.month}
                    </summary>
                    <div className="border-t border-sky-100 px-3 py-2 space-y-1">
                      {renderImpactLegend()}
                      {monthItem.details.length > 0 ? (
                        renderYearImpactGroups(monthItem.details, `month-detail-${monthItem.month}`)
                      ) : (
                        <p className="text-[11px] md:text-xs text-gray-500">Không có chi tiết phát sinh.</p>
                      )}
                    </div>
                  </details>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Panel xếp hạng năm đẹp/xấu trong Đại Vận */}
      {viewMode === 'daiVan' && showYearRanking && daiVanYearRanking && daiVanYearRanking.length > 0 && (
        <div className="mx-auto mt-4 max-w-5xl rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm md:p-5">
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

          {fixedTienThienDaiVanImpacts && (
            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50/80 p-3 md:p-4">
              <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
                <div>
                  <h5 className="font-bold text-slate-900 text-sm md:text-base font-serif">Bảng gốc: Tiên thiên và Đại Vận</h5>
                  <p className="text-[11px] md:text-xs text-gray-600 mt-1">
                    Phần này là nền cố định của Đại Vận đang xét. Chỉ hiển thị để tham khảo, không cộng vào điểm từng năm.
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
                  Không tính vào điểm năm
                </span>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-amber-200 bg-white p-3">
                  <p className="text-xs md:text-sm font-semibold text-amber-800">Tiên thiên → Đại Vận</p>
                  {fixedTienThienDaiVanImpacts.tienThienToDaiVan.length > 0 ? (
                    <div className="mt-2 space-y-1">
                      {renderImpactLegend()}
                      {renderYearImpactGroups(fixedTienThienDaiVanImpacts.tienThienToDaiVan, 'fixed-tt-dv', false)}
                    </div>
                  ) : (
                    <p className="mt-2 text-[11px] md:text-xs text-gray-500">Không có tương tác trọng yếu.</p>
                  )}
                </div>

                <div className="rounded-lg border border-amber-200 bg-white p-3">
                  <p className="text-xs md:text-sm font-semibold text-amber-800">Đại Vận → Tiên thiên</p>
                  {fixedTienThienDaiVanImpacts.daiVanToTienThien.length > 0 ? (
                    <div className="mt-2 space-y-1">
                      {renderImpactLegend()}
                      {renderYearImpactGroups(fixedTienThienDaiVanImpacts.daiVanToTienThien, 'fixed-dv-tt', false)}
                    </div>
                  ) : (
                    <p className="mt-2 text-[11px] md:text-xs text-gray-500">Không có tương tác trọng yếu.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Năm đẹp nhất */}
            <div>
              <h5 className="font-bold text-emerald-800 mb-2 text-sm md:text-base font-serif">Năm đẹp nhất</h5>
              <div className="space-y-2">
                {daiVanYearRanking.slice(0, 5).map((item) => {
                  const level = getLevelLabel(item.level);
                  const topImpacts = summarizeYearImpacts(item.details);
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
                      {topImpacts.length > 0 && (
                        <div className="mb-2">
                          <p className="text-[11px] md:text-xs font-medium text-gray-600">3 tác động chính</p>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {topImpacts.map((impact, index) => (
                              <span
                                key={`good-summary-${item.year}-${index}`}
                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${
                                  impact.neutral
                                    ? 'bg-gray-50 text-gray-700 ring-gray-200'
                                    : impact.positive
                                      ? 'bg-blue-50 text-blue-700 ring-blue-200'
                                      : 'bg-red-50 text-red-700 ring-red-200'
                                }`}
                              >
                                {impact.neutral ? '•' : impact.positive ? '+' : '-'} {impact.target}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <details className="rounded-lg border border-emerald-100 bg-emerald-50/40">
                        <summary className="cursor-pointer list-none px-3 py-2 text-[11px] font-semibold text-emerald-800 md:text-xs">
                          Xem chi tiết
                        </summary>
                        <div className="border-t border-emerald-100 px-3 py-2 space-y-1">
                          {renderImpactLegend()}
                          {renderYearImpactGroups(item.details, `good-detail-${item.year}`)}
                        </div>
                      </details>
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
                  const topImpacts = summarizeYearImpacts(item.details);
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
                      {topImpacts.length > 0 && (
                        <div className="mb-2">
                          <p className="text-[11px] md:text-xs font-medium text-gray-600">3 tác động chính</p>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {topImpacts.map((impact, index) => (
                              <span
                                key={`bad-summary-${item.year}-${index}`}
                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${
                                  impact.neutral
                                    ? 'bg-gray-50 text-gray-700 ring-gray-200'
                                    : impact.positive
                                      ? 'bg-blue-50 text-blue-700 ring-blue-200'
                                      : 'bg-red-50 text-red-700 ring-red-200'
                                }`}
                              >
                                {impact.neutral ? '•' : impact.positive ? '+' : '-'} {impact.target}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <details className="rounded-lg border border-red-100 bg-red-50/30">
                        <summary className="cursor-pointer list-none px-3 py-2 text-[11px] font-semibold text-red-800 md:text-xs">
                          Xem chi tiết
                        </summary>
                        <div className="border-t border-red-100 px-3 py-2 space-y-1">
                          {renderImpactLegend()}
                          {renderYearImpactGroups(item.details, `bad-detail-${item.year}`)}
                        </div>
                      </details>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <p className="mt-4 text-center text-[10px] text-gray-400 md:text-xs">
        {isQuaiMode
          ? 'Tên cung đỏ = Mệnh gốc · xanh = Thân · tím = Mệnh + Thân · hồng = Mệnh quái · click cung để xem Lộc/Kỵ quái'
          : 'Tên cung đỏ = Mệnh gốc · xanh = Thân · tím = Mệnh + Thân · cam = Mệnh Đại Vận · hồng = Mệnh năm · click cung để xem Lộc/Kỵ'}
      </p>
    </div>
  );
}
