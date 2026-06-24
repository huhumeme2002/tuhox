import type { Palace as PalaceType } from '../types/tuVi';
import { CUNG_NAMES, STAR_COLORS } from '../data/constants';

interface LocKyMap {
  loc: readonly number[];
  ky: readonly number[];
}

interface AffectedDaiVan {
  loc: { daiVan: number; label: string; target: string; cungName: string }[];
  ky: { daiVan: number; label: string; target: string; cungName: string }[];
}

interface Props {
  palace: PalaceType;
  daiVanCungIndex?: number | null;
  locKyMap?: LocKyMap | null;
  daiVanLocKyMap?: LocKyMap | null;
  affectedDaiVan?: AffectedDaiVan | null;
  yearCanMap?: Record<number, string> | null;
  activeMenhIndex?: number | null;
  activeMenhLabel?: string | null;
  yearRoleName?: string | null;
  isSelected?: boolean;
  onSelect?: () => void;
}

const BADGE_TU_HOA_CLASS: Record<string, string> = {
  'Hóa Lộc': 'bg-emerald-500/16 text-emerald-200 ring-1 ring-emerald-400/35',
  'Hóa Quyền': 'bg-sky-500/16 text-sky-200 ring-1 ring-sky-400/35',
  'Hóa Khoa': 'bg-violet-500/16 text-violet-200 ring-1 ring-violet-400/35',
  'Hóa Kỵ': 'bg-red-500/16 text-red-200 ring-1 ring-red-400/35',
};

export function Palace({
  palace,
  daiVanCungIndex,
  locKyMap,
  daiVanLocKyMap,
  affectedDaiVan,
  yearCanMap,
  activeMenhIndex,
  activeMenhLabel,
  yearRoleName,
  isSelected = false,
  onSelect,
}: Props) {
  const { index, name, can, chi, isMenh, isThan, daiVan, stars } = palace;
  const displayCan = yearCanMap?.[index] ?? can;
  const isActiveMenh = activeMenhIndex === index;

  const chinhTinh = stars.filter((s) => s.type === 'chinh');
  const phuTinh = stars.filter((s) => s.type === 'phu' && !s.tuHoa);
  const tuHoaList = stars.filter((s) => s.tuHoa);

  const isDaiVanMenh = daiVanCungIndex === index;
  const daiVanName =
    daiVanCungIndex !== null && daiVanCungIndex !== undefined
      ? CUNG_NAMES[(index - daiVanCungIndex + 12) % 12]
      : null;

  const locLabel = locKyMap ? (locKyMap.loc.indexOf(index) >= 0 ? `L${locKyMap.loc.indexOf(index) + 1}` : null) : null;
  const kyLabel = locKyMap ? (locKyMap.ky.indexOf(index) >= 0 ? `K${locKyMap.ky.indexOf(index) + 1}` : null) : null;

  const daiVanLocLabel = daiVanLocKyMap
    ? daiVanLocKyMap.loc.indexOf(index) >= 0
      ? `LĐV${daiVanLocKyMap.loc.indexOf(index) + 1}`
      : null
    : null;
  const daiVanKyLabel = daiVanLocKyMap
    ? daiVanLocKyMap.ky.indexOf(index) >= 0
      ? `KĐV${daiVanLocKyMap.ky.indexOf(index) + 1}`
      : null
    : null;

  const daiVanLoc = affectedDaiVan?.loc.some((x) => x.daiVan === daiVan);
  const daiVanKy = affectedDaiVan?.ky.some((x) => x.daiVan === daiVan);

  const borderClass = isDaiVanMenh
    ? 'border-[rgba(243,210,122,0.7)] bg-[rgba(60,45,12,0.28)] ring-2 ring-[rgba(243,210,122,0.34)] shadow-[0_0_28px_rgba(212,175,55,0.22)]'
    : isMenh && isThan
      ? 'border-[rgba(168,85,247,0.78)] bg-[rgba(76,29,149,0.18)] ring-2 ring-[rgba(168,85,247,0.28)] shadow-[0_0_26px_rgba(168,85,247,0.18)]'
      : isActiveMenh
        ? 'border-[rgba(244,114,182,0.72)] bg-[rgba(127,29,29,0.16)] ring-2 ring-[rgba(244,114,182,0.24)] shadow-[0_0_24px_rgba(244,114,182,0.18)]'
        : isMenh
          ? 'border-[rgba(248,113,113,0.56)] bg-[rgba(127,29,29,0.14)]'
          : isThan
            ? 'border-[rgba(45,212,191,0.54)] bg-[rgba(8,47,73,0.14)]'
            : 'border-[rgba(243,210,122,0.2)] bg-[rgba(15,23,42,0.74)]';

  const nameColor = isDaiVanMenh
    ? 'text-[var(--gold-soft)] font-serif'
    : isMenh && isThan
      ? 'text-violet-300 font-serif'
      : isActiveMenh
        ? 'text-rose-300 font-serif'
        : isMenh
          ? 'text-red-300 font-serif'
          : isThan
            ? 'text-teal-300 font-serif'
            : 'text-[var(--text-main)] font-serif';

  const selectedClass = isSelected
    ? 'z-20 border-[rgba(243,210,122,0.9)] ring-[6px] ring-[rgba(139,92,246,0.35)] shadow-[0_0_42px_rgba(212,175,55,0.32)] scale-[1.03]'
    : '';

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onSelect}
      className={`palace-card relative flex min-h-[168px] flex-col rounded-[1rem] border p-2 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-[rgba(243,210,122,0.56)] hover:shadow-[0_20px_42px_rgba(2,6,23,0.42)] focus:outline-none focus:ring-2 focus:ring-[rgba(243,210,122,0.4)] sm:min-h-[188px] md:min-h-[228px] md:p-3 ${borderClass} ${selectedClass}`}
    >
      {daiVan !== undefined && (
        <div className="absolute right-1.5 top-1.5 z-10">
          <span
            className={`rounded-lg px-2 py-0.5 text-xs font-bold shadow-sm md:text-sm ${
              daiVanLoc
                ? 'bg-emerald-500/18 text-emerald-100 ring-1 ring-emerald-400/35'
                : daiVanKy
                  ? 'bg-red-500/18 text-red-100 ring-1 ring-red-400/35'
                  : 'bg-[rgba(212,175,55,0.18)] text-[var(--gold-soft)] ring-1 ring-[rgba(243,210,122,0.26)]'
            }`}
          >
            {daiVan}
          </span>
        </div>
      )}

      <div className="relative z-10 mb-2 flex items-start justify-end border-b border-[rgba(243,210,122,0.18)] pb-1.5">
        <div className="pr-7 text-right leading-tight">
          {yearRoleName ? (
            <div className={`text-sm font-bold md:text-base ${nameColor}`}>{yearRoleName}</div>
          ) : daiVanName ? (
            <div className={`text-sm font-bold md:text-base ${nameColor}`}>{daiVanName} Vận</div>
          ) : (
            <div className={`text-sm font-bold md:text-base ${nameColor}`}>{name}</div>
          )}
          <div className="text-xs font-semibold tracking-wide text-[var(--text-muted)] md:text-sm">
            {displayCan} {chi}
          </div>
        </div>
      </div>

      {isDaiVanMenh && (
        <div className="absolute left-1.5 top-1.5 z-10">
          <span className="rounded-md bg-[linear-gradient(135deg,#f3d27a,#d4af37,#9f6f17)] px-2 py-0.5 text-[9px] font-bold text-[#221600] shadow-sm ring-1 ring-[rgba(243,210,122,0.34)] md:text-[10px]">
            Mệnh Vận
          </span>
        </div>
      )}
      {isActiveMenh && !isMenh && (
        <div className="absolute left-1.5 top-1.5 z-10">
          <span className="rounded-md bg-[linear-gradient(135deg,#fb7185,#e11d48)] px-2 py-0.5 text-[9px] font-bold text-white shadow-sm ring-1 ring-rose-300/30 md:text-[10px]">
            {activeMenhLabel ?? 'Mệnh năm'}
          </span>
        </div>
      )}

      <div className="relative z-10 mb-2 space-y-1.5">
        {chinhTinh.map((star, idx) => (
          <div
            key={`chinh-${idx}`}
            className="flex items-center gap-2 font-serif text-sm font-extrabold leading-tight md:text-base"
            style={{ color: STAR_COLORS[star.name] || '#F8EFD2' }}
          >
            <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-current opacity-95 shadow-[0_0_8px_currentColor]" />
            <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
              {star.quality === 1 ? '+' : star.quality === -1 ? '-' : ''}
              {star.name}
            </span>
            {star.tuHoa && (
              <span className={`ml-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold md:text-xs ${BADGE_TU_HOA_CLASS[star.tuHoa] ?? 'bg-white/10 text-white ring-1 ring-white/10'}`}>
                {star.tuHoa}
              </span>
            )}
          </div>
        ))}
      </div>

      {phuTinh.length > 0 && (
        <div className="relative z-10 mt-auto border-t border-dashed border-[rgba(243,210,122,0.14)] pt-2">
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            {phuTinh.map((star, idx) => (
              <span key={`phu-${idx}`} className="text-xs font-medium leading-tight text-[var(--text-muted)]/90 md:text-sm">
                {star.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {tuHoaList.length > 0 && (
        <div className="relative z-10 mt-1.5 border-t border-dashed border-[rgba(243,210,122,0.1)] pt-1.5">
          <div className="flex flex-wrap gap-1">
            {tuHoaList.map((star, idx) => (
              <span
                key={`tuhoa-${idx}`}
                className={`rounded-md px-2 py-0.5 text-[10px] font-bold md:text-xs ${BADGE_TU_HOA_CLASS[star.tuHoa ?? ''] ?? 'bg-white/10 text-white ring-1 ring-white/10'}`}
              >
                {star.tuHoa}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="absolute bottom-1.5 right-1.5 z-10 flex max-w-[80%] flex-wrap justify-end gap-1">
        {locLabel && (
          <span className="rounded-lg bg-emerald-500/18 px-2 py-0.5 text-[10px] font-bold text-emerald-100 shadow-md ring-1 ring-emerald-400/35 md:text-xs">
            {locLabel}
          </span>
        )}
        {kyLabel && (
          <span className="rounded-lg bg-red-500/18 px-2 py-0.5 text-[10px] font-bold text-red-100 shadow-md ring-1 ring-red-400/35 md:text-xs">
            {kyLabel}
          </span>
        )}
        {daiVanLocLabel && (
          <span className="rounded-lg bg-sky-500/18 px-2 py-0.5 text-[10px] font-bold text-sky-100 shadow-md ring-1 ring-sky-400/35 md:text-xs">
            {daiVanLocLabel}
          </span>
        )}
        {daiVanKyLabel && (
          <span className="rounded-lg bg-violet-500/18 px-2 py-0.5 text-[10px] font-bold text-violet-100 shadow-md ring-1 ring-violet-400/35 md:text-xs">
            {daiVanKyLabel}
          </span>
        )}
      </div>
    </button>
  );
}
