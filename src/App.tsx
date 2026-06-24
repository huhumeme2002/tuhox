import { useState } from 'react';
import { BirthForm } from './components/BirthForm';
import { TuViBoard } from './components/TuViBoard';
import { buildChart } from './utils/chartBuilder';
import type { BirthInput, TuViChart } from './types/tuVi';

const thienBanWatermark = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 600' fill='none'%3E%3Ccircle cx='300' cy='300' r='220' stroke='%23b45309' stroke-opacity='0.08' stroke-width='2'/%3E%3Ccircle cx='300' cy='300' r='170' stroke='%23b45309' stroke-opacity='0.06' stroke-width='1.5'/%3E%3Ccircle cx='300' cy='300' r='120' stroke='%23b45309' stroke-opacity='0.05' stroke-width='1.2'/%3E%3Cpath d='M300 40V560M40 300H560M112 112L488 488M488 112L112 488' stroke='%23b45309' stroke-opacity='0.05' stroke-width='1'/%3E%3Ccircle cx='300' cy='300' r='9' fill='%23b45309' fill-opacity='0.10'/%3E%3C/svg%3E")`;

function App() {
  const [chart, setChart] = useState<TuViChart | null>(null);

  const handleSubmit = (input: BirthInput) => {
    const newChart = buildChart(input);
    setChart(newChart);
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-3 py-6 md:px-4 md:py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.14),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(180,83,9,0.08),_transparent_30%)]" />
        <div
          className="absolute left-1/2 top-[-120px] h-[560px] w-[560px] -translate-x-1/2 rounded-full opacity-70"
          style={{
            backgroundImage: thienBanWatermark,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundSize: 'contain',
          }}
        />
        <div
          className="absolute right-[-80px] top-[26%] h-[280px] w-[280px] rounded-full opacity-35"
          style={{
            backgroundImage: thienBanWatermark,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundSize: 'contain',
          }}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl space-y-6">
        <header className="feng-hero rounded-[1.6rem] px-5 py-8 text-center md:px-8 md:py-11">
          <div className="relative z-10 space-y-3">
            <div>
              <span className="feng-kicker">Ứng dụng lập lá số Tứ Hóa Phái</span>
            </div>
            <div className="space-y-2">
              <h1 className="font-serif text-3xl font-bold text-amber-50 md:text-5xl">
                Lập Lá Số Tử Vi
              </h1>
              <p className="mx-auto max-w-2xl text-sm leading-relaxed text-amber-50/88 md:text-base">
                Giao diện được tinh chỉnh theo hướng truyền thống, ấm sắc và dễ đọc, giữ trọng tâm ở phần lá số và phần phân tích.
              </p>
            </div>
            <div className="feng-divider" />
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-amber-100/80 md:text-sm">
              Tứ Hóa Phái · Dương lịch sang Âm lịch
            </p>
          </div>
        </header>

        <BirthForm onSubmit={handleSubmit} />
        {chart && <TuViBoard chart={chart} />}

        {!chart && (
          <div className="feng-panel rounded-[1.35rem] px-5 py-10 text-center text-sm text-amber-900/70 md:px-6">
            Nhập thông tin và bấm <span className="font-semibold text-amber-800">Lập lá số</span> để xem sơ đồ.
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
