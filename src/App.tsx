import { useState } from 'react';
import { BirthForm } from './components/BirthForm';
import { TuViBoard } from './components/TuViBoard';
import { buildChart } from './utils/chartBuilder';
import type { BirthInput, TuViChart } from './types/tuVi';

const imperialWatermark = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 600' fill='none'%3E%3Ccircle cx='300' cy='300' r='222' stroke='%23D4AF37' stroke-opacity='0.16' stroke-width='2'/%3E%3Ccircle cx='300' cy='300' r='174' stroke='%23F3D27A' stroke-opacity='0.12' stroke-width='1.5'/%3E%3Ccircle cx='300' cy='300' r='126' stroke='%238B5CF6' stroke-opacity='0.1' stroke-width='1.2'/%3E%3Cpath d='M300 42V558M42 300H558M118 118L482 482M482 118L118 482' stroke='%23D4AF37' stroke-opacity='0.08' stroke-width='1'/%3E%3Ccircle cx='300' cy='300' r='10' fill='%23F3D27A' fill-opacity='0.16'/%3E%3C/svg%3E")`;

function TuHoaHeroLogo() {
  return (
    <div className="mx-auto flex w-full max-w-[168px] items-center justify-center md:mx-0 md:max-w-[220px]">
      <svg
        viewBox="0 0 320 320"
        role="img"
        aria-label="Logo Tử Hóa Phái"
        className="h-auto w-full drop-shadow-[0_20px_40px_rgba(2,6,23,0.55)]"
      >
        <defs>
          <linearGradient id="imperialGold" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#F8EFD2" />
            <stop offset="38%" stopColor="#F3D27A" />
            <stop offset="72%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#8A6318" />
          </linearGradient>
          <linearGradient id="imperialViolet" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="0.2" />
          </linearGradient>
          <filter id="imperialGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle cx="160" cy="160" r="140" fill="rgba(11,16,32,0.75)" />
        <circle cx="160" cy="160" r="126" fill="none" stroke="rgba(243,210,122,0.22)" strokeWidth="1.5" />
        <circle cx="160" cy="160" r="110" fill="none" stroke="url(#imperialGold)" strokeWidth="7" />
        <circle cx="160" cy="160" r="92" fill="none" stroke="rgba(248,239,210,0.44)" strokeWidth="1.2" />
        <circle cx="160" cy="160" r="72" fill="url(#imperialViolet)" stroke="rgba(243,210,122,0.4)" strokeWidth="1.2" />

        {[...Array(12)].map((_, index) => {
          const angle = (index * 30 * Math.PI) / 180;
          const x1 = 160 + Math.cos(angle) * 94;
          const y1 = 160 + Math.sin(angle) * 94;
          const x2 = 160 + Math.cos(angle) * 118;
          const y2 = 160 + Math.sin(angle) * 118;
          return (
            <line
              key={`tick-${index}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(243,210,122,0.88)"
              strokeWidth={index % 3 === 0 ? 3.2 : 1.8}
              strokeLinecap="round"
            />
          );
        })}

        {[45, 135, 225, 315].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const cx = 160 + Math.cos(rad) * 58;
          const cy = 160 + Math.sin(rad) * 58;
          return <circle key={`hoa-${angle}`} cx={cx} cy={cy} r="8" fill="url(#imperialGold)" filter="url(#imperialGlow)" />;
        })}

        <path
          d="M160 90 L210 160 L160 230 L110 160 Z"
          fill="rgba(11,16,32,0.55)"
          stroke="rgba(248,239,210,0.48)"
          strokeWidth="2.3"
        />
        <circle cx="160" cy="160" r="24" fill="url(#imperialGold)" filter="url(#imperialGlow)" />
        <circle cx="160" cy="160" r="10" fill="#fff7dd" />
        <path
          d="M160 114 L160 206 M114 160 L206 160 M128 128 L192 192 M192 128 L128 192"
          stroke="rgba(248,239,210,0.48)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function App() {
  const [chart, setChart] = useState<TuViChart | null>(null);

  const handleSubmit = (input: BirthInput) => {
    const newChart = buildChart(input);
    setChart(newChart);
  };

  const chartKey = chart
    ? [chart.birthDate, chart.canChi.hour, chart.canChi.year, chart.amDuong, chart.name].join('|')
    : 'empty';

  return (
    <div className="relative min-h-screen overflow-hidden px-3 py-4 md:px-5 md:py-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(243,210,122,0.08),_transparent_26%),radial-gradient(circle_at_82%_14%,_rgba(139,92,246,0.12),_transparent_24%),radial-gradient(circle_at_18%_84%,_rgba(20,184,166,0.08),_transparent_26%)]" />
        <div
          className="absolute left-1/2 top-[-220px] h-[480px] w-[480px] -translate-x-1/2 opacity-70 md:top-[-180px] md:h-[620px] md:w-[620px]"
          style={{
            backgroundImage: imperialWatermark,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundSize: 'contain',
          }}
        />
        <div
          className="absolute right-[-80px] top-[24%] h-[320px] w-[320px] rounded-full opacity-35"
          style={{
            backgroundImage: imperialWatermark,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundSize: 'contain',
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl space-y-5">
        <header className="feng-hero rounded-[1.65rem] px-4 py-7 md:px-8 md:py-9">
          <div className="relative z-10 grid items-center gap-6 md:grid-cols-[minmax(0,1.1fr)_220px] md:gap-8">
            <div className="text-center md:text-left">
              <div className="feng-kicker">Imperial Dark Astrology UI</div>
              <h1 className="mt-4 font-serif text-4xl font-bold tracking-tight text-[var(--text-main)] md:text-5xl">
                Tử Hóa Phái
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-muted)] md:text-base">
                Luận giải Lộc - Quyền - Khoa - Kỵ theo Tiên Thiên, Đại Vận, Lưu Niên và Nhập Quái.
              </p>
              <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center md:justify-start">
                <a
                  href="#birth-form"
                  className="feng-button-primary inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold"
                >
                  Lập lá số ngay
                </a>
                <span className="imperial-button-secondary inline-flex items-center rounded-xl px-4 py-3 text-xs font-medium text-[var(--text-muted)]">
                  Giữ nguyên thuật toán, nâng cấp toàn bộ trải nghiệm hiển thị
                </span>
              </div>
            </div>

            <div className="flex justify-center md:justify-end">
              <TuHoaHeroLogo />
            </div>
          </div>
        </header>

        <BirthForm onSubmit={handleSubmit} />
        {chart && <TuViBoard key={chartKey} chart={chart} />}

        {!chart && (
          <div className="feng-panel rounded-[1.35rem] px-5 py-10 text-center text-sm text-[var(--text-muted)] md:px-6">
            Nhập thông tin và bấm <span className="font-semibold text-[var(--gold-soft)]">Lập lá số</span> để hiển thị bàn đồ và phần luận giải.
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
