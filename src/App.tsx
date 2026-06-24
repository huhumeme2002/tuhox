import { useState } from 'react';
import { BirthForm } from './components/BirthForm';
import { TuViBoard } from './components/TuViBoard';
import { buildChart } from './utils/chartBuilder';
import type { BirthInput, TuViChart } from './types/tuVi';

const thienBanWatermark = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 600' fill='none'%3E%3Ccircle cx='300' cy='300' r='220' stroke='%23b45309' stroke-opacity='0.08' stroke-width='2'/%3E%3Ccircle cx='300' cy='300' r='170' stroke='%23b45309' stroke-opacity='0.06' stroke-width='1.5'/%3E%3Ccircle cx='300' cy='300' r='120' stroke='%23b45309' stroke-opacity='0.05' stroke-width='1.2'/%3E%3Cpath d='M300 40V560M40 300H560M112 112L488 488M488 112L112 488' stroke='%23b45309' stroke-opacity='0.05' stroke-width='1'/%3E%3Ccircle cx='300' cy='300' r='9' fill='%23b45309' fill-opacity='0.10'/%3E%3C/svg%3E")`;

function TuHoaHeroLogo() {
  return (
    <div className="mx-auto flex w-full max-w-[320px] items-center justify-center md:max-w-[380px]">
      <svg
        viewBox="0 0 320 320"
        role="img"
        aria-label="Logo Tứ Hóa Phái"
        className="h-auto w-full drop-shadow-[0_16px_32px_rgba(120,53,15,0.28)]"
      >
        <defs>
          <linearGradient id="heroGold" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <linearGradient id="heroCopper" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#fff7ed" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#fed7aa" stopOpacity="0.52" />
          </linearGradient>
          <filter id="heroGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle cx="160" cy="160" r="138" fill="rgba(251,191,36,0.08)" />
        <circle cx="160" cy="160" r="124" fill="none" stroke="rgba(254,243,199,0.44)" strokeWidth="1.5" />
        <circle cx="160" cy="160" r="108" fill="none" stroke="url(#heroGold)" strokeWidth="7" />
        <circle cx="160" cy="160" r="90" fill="none" stroke="rgba(255,247,237,0.72)" strokeWidth="1.2" />
        <circle cx="160" cy="160" r="70" fill="rgba(120,53,15,0.2)" stroke="rgba(254,243,199,0.48)" strokeWidth="1.2" />

        {[...Array(12)].map((_, index) => {
          const angle = (index * 30 * Math.PI) / 180;
          const x1 = 160 + Math.cos(angle) * 96;
          const y1 = 160 + Math.sin(angle) * 96;
          const x2 = 160 + Math.cos(angle) * 118;
          const y2 = 160 + Math.sin(angle) * 118;
          return (
            <line
              key={`tick-${index}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(254,243,199,0.82)"
              strokeWidth={index % 3 === 0 ? 3.2 : 2}
              strokeLinecap="round"
            />
          );
        })}

        {[45, 135, 225, 315].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const cx = 160 + Math.cos(rad) * 58;
          const cy = 160 + Math.sin(rad) * 58;
          return <circle key={`hoa-${angle}`} cx={cx} cy={cy} r="8" fill="url(#heroGold)" filter="url(#heroGlow)" />;
        })}

        <path
          d="M160 92 L206 160 L160 228 L114 160 Z"
          fill="rgba(120,53,15,0.34)"
          stroke="url(#heroCopper)"
          strokeWidth="2.6"
        />
        <circle cx="160" cy="160" r="24" fill="url(#heroGold)" filter="url(#heroGlow)" />
        <circle cx="160" cy="160" r="10" fill="#fff7ed" />
        <path
          d="M160 114 L160 206 M114 160 L206 160 M128 128 L192 192 M192 128 L128 192"
          stroke="rgba(254,243,199,0.52)"
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
          <div className="relative z-10 flex items-center justify-center">
            <h1 className="sr-only">Lập Lá Số Tử Vi Tứ Hóa Phái</h1>
            <TuHoaHeroLogo />
          </div>
        </header>

        <BirthForm onSubmit={handleSubmit} />
        {chart && <TuViBoard key={chartKey} chart={chart} />}

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
