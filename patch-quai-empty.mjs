import { readFileSync, writeFileSync } from 'fs';

const path = 'src/components/TuViBoard.tsx';
let text = readFileSync(path, 'utf8');

const old = `          {!quaiInfo && (
            <div className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm md:p-5">
              <h4 className="text-sm font-bold text-amber-900 md:text-base font-serif">Nhập Quái</h4>
              <p className="mt-1 text-xs leading-relaxed text-gray-600 md:text-sm">
                Nhập năm sinh của ngưới B để an hệ quái chồng lên lá số A. Sau đó click một cung để xem Lộc/Kỵ quái và đối chiếu hai chiều giữa quái với Tiên thiên, Đại Vận và Năm của A.
              </p>
            </div>
          )}`;

const neW = `          {!quaiInfo && (
            <div className="feng-panel rounded-[1.35rem] p-5 md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[rgba(243,210,122,0.14)] text-[var(--gold-soft)] ring-1 ring-[rgba(243,210,122,0.24)]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6" aria-hidden="true">
                    <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
                    <path d="M12 11v4M12 8h.01" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-serif text-base font-bold text-[var(--text-main)] md:text-lg">Bắt đầu Nhập Quái</h4>
                  <p className="mt-1 max-w-3xl text-xs leading-relaxed text-[var(--text-muted)] md:text-sm">
                    Nhập năm sinh của ngưới B để an hệ quái chồng lên lá số A. Sau đó click một cung để xem Lộc/Kỵ quái và đối chiếu hai chiều giữa quái với Tiên thiên, Đại Vận và Năm của A.
                  </p>
                  <ol className="mt-3 space-y-1 text-xs text-[var(--text-muted)] md:text-sm">
                    <li className="flex items-center gap-2"><span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[rgba(243,210,122,0.14)] text-[10px] font-bold text-[var(--gold-soft)] ring-1 ring-[rgba(243,210,122,0.24)]">1</span> Nhập năm sinh ngưới B.</li>
                    <li className="flex items-center gap-2"><span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[rgba(243,210,122,0.14)] text-[10px] font-bold text-[var(--gold-soft)] ring-1 ring-[rgba(243,210,122,0.24)]">2</span> Chọn Đại Vận / Năm của A (tùy chọn).</li>
                    <li className="flex items-center gap-2"><span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[rgba(243,210,122,0.14)] text-[10px] font-bold text-[var(--gold-soft)] ring-1 ring-[rgba(243,210,122,0.24)]">3</span> Click một cung trên bàn đồ để xem phân tích.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}`;

if (!text.includes(old)) {
  console.log('OLD not found');
  process.exit(1);
}
text = text.replace(old, neW);
writeFileSync(path, text, 'utf8');
console.log('Patched Nhập Quái empty state');
