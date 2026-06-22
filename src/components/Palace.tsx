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
  yearRoleName?: string | null;
  onSelect?: () => void;
}

export function Palace({ palace, daiVanCungIndex, locKyMap, daiVanLocKyMap, affectedDaiVan, yearCanMap, activeMenhIndex, yearRoleName, onSelect }: Props) {
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
    ? 'border-amber-500 bg-amber-50/90 ring-2 ring-amber-300/70 shadow-amber-200/50'
    : isMenh && isThan
    ? 'border-purple-500 bg-purple-50/90 ring-2 ring-purple-300/70 shadow-purple-200/50'
    : isActiveMenh
    ? 'border-rose-500 bg-rose-50/90 ring-2 ring-rose-300/70 shadow-rose-200/50'
    : isMenh
    ? 'border-red-500 bg-red-50/90'
    : isThan
    ? 'border-blue-500 bg-blue-50/90'
    : 'border-amber-800/40 bg-amber-50/60';

  const nameColor = isDaiVanMenh
    ? 'text-amber-800 font-serif'
    : isMenh && isThan
    ? 'text-purple-800 font-serif'
    : isActiveMenh
    ? 'text-rose-800 font-serif'
    : isMenh
    ? 'text-red-800 font-serif'
    : isThan
    ? 'text-blue-800 font-serif'
    : 'text-amber-950 font-serif';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`text-left border-2 ${borderClass} p-2 md:p-3 min-h-[180px] md:min-h-[220px] flex flex-col rounded-xl shadow-md hover:shadow-xl hover:border-amber-500/80 hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400 relative`}
    >
      {/* Đại vận ở góc phải trên */}
      {daiVan !== undefined && (
        <div className="absolute top-1.5 right-1.5">
          <span
            className={`text-xs md:text-sm font-bold px-2 py-0.5 rounded-lg shadow-sm ${
              daiVanLoc
                ? 'text-white bg-blue-500 ring-1 ring-blue-300'
                : daiVanKy
                ? 'text-white bg-gray-800 ring-1 ring-gray-500'
                : 'text-amber-900 bg-gradient-to-br from-amber-200 to-amber-300 ring-1 ring-amber-400/50'
            }`}
          >
            {daiVan}
          </span>
        </div>
      )}

      {/* Header: tên cung + can chi */}
      <div className="flex justify-end items-start border-b border-amber-300/60 pb-1 mb-2">
        <div className="text-right leading-tight pr-7">
          {yearRoleName ? (
            <div className={`font-bold text-xs md:text-sm ${nameColor}`}>{yearRoleName}</div>
          ) : daiVanName ? (
            <div className={`font-bold text-xs md:text-sm ${nameColor}`}>{daiVanName} Vận</div>
          ) : (
            <div className={`font-bold text-xs md:text-sm ${nameColor}`}>{name}</div>
          )}
          <div className="text-[10px] md:text-xs text-gray-700 font-medium tracking-wide">
            {displayCan} {chi}
          </div>
        </div>
      </div>

      {/* Badge Mệnh Đại Vận / Mệnh năm */}
      {isDaiVanMenh && (
        <div className="absolute top-1.5 left-1.5">
          <span className="text-[9px] md:text-[10px] font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 px-2 py-0.5 rounded-md shadow-sm ring-1 ring-amber-400/50">
            Mệnh Vận
          </span>
        </div>
      )}
      {isActiveMenh && !isMenh && (
        <div className="absolute top-1.5 left-1.5">
          <span className="text-[9px] md:text-[10px] font-bold text-white bg-gradient-to-r from-rose-500 to-rose-600 px-2 py-0.5 rounded-md shadow-sm ring-1 ring-rose-400/50">
            Mệnh năm
          </span>
        </div>
      )}

      {/* Chính tinh */}
          <div className="space-y-1.5 mb-2">
        {chinhTinh.map((star, idx) => (
          <div
            key={`chinh-${idx}`}
            className="flex items-center gap-2 text-sm md:text-base font-bold leading-tight font-serif"
            style={{ color: STAR_COLORS[star.name] || '#333' }}
          >
            <span className="w-2 h-2 rounded-full bg-current opacity-80 flex-shrink-0 shadow-sm" />
            <span>
              {star.quality === 1 ? '+' : star.quality === -1 ? '-' : ''}
              {star.name}
            </span>
            {star.tuHoa && (
              <span className="ml-1 text-[10px] md:text-xs font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded-md ring-1 ring-red-200 shadow-sm">
                {star.tuHoa}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Phụ tinh */}
      {phuTinh.length > 0 && (
          <div className="mt-auto pt-2 border-t border-dashed border-amber-300/60">
          <div className="flex flex-wrap gap-x-2.5 gap-y-1">
            {phuTinh.map((star, idx) => (
              <span key={`phu-${idx}`} className="text-[11px] md:text-xs text-gray-600 leading-tight font-medium">
                {star.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tứ Hóa (nếu sao phụ hóa) */}
      {tuHoaList.length > 0 && (
        <div className="mt-1.5 pt-1.5 border-t border-dashed border-amber-300/50">
          <div className="flex flex-wrap gap-1">
            {tuHoaList.map((star, idx) => (
              <span
                key={`tuhoa-${idx}`}
                className="text-[10px] md:text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-md ring-1 ring-red-200 shadow-sm"
              >
                {star.tuHoa}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Lộc/Kỵ tiên thiên + Đại Vận badges */}
      <div className="absolute bottom-1.5 right-1.5 flex flex-wrap justify-end gap-1 max-w-[80%]">
        {locLabel && (
          <span className="text-[10px] md:text-xs font-bold text-white bg-gradient-to-r from-blue-500 to-blue-600 px-2 py-0.5 rounded-lg shadow-md ring-1 ring-blue-300">
            {locLabel}
          </span>
        )}
        {kyLabel && (
          <span className="text-[10px] md:text-xs font-bold text-white bg-gradient-to-r from-gray-700 to-gray-800 px-2 py-0.5 rounded-lg shadow-md ring-1 ring-gray-500">
            {kyLabel}
          </span>
        )}
        {daiVanLocLabel && (
          <span className="text-[10px] md:text-xs font-bold text-white bg-gradient-to-r from-sky-400 to-sky-500 px-2 py-0.5 rounded-lg shadow-md ring-1 ring-sky-300">
            {daiVanLocLabel}
          </span>
        )}
        {daiVanKyLabel && (
          <span className="text-[10px] md:text-xs font-bold text-white bg-gradient-to-r from-stone-500 to-stone-600 px-2 py-0.5 rounded-lg shadow-md ring-1 ring-stone-400">
            {daiVanKyLabel}
          </span>
        )}
      </div>
    </button>
  );
}
