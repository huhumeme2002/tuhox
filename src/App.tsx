import { useState } from 'react';
import { BirthForm } from './components/BirthForm';
import { TuViBoard } from './components/TuViBoard';
import { buildChart } from './utils/chartBuilder';
import type { BirthInput, TuViChart } from './types/tuVi';

function App() {
  const [chart, setChart] = useState<TuViChart | null>(null);

  const handleSubmit = (input: BirthInput) => {
    const newChart = buildChart(input);
    setChart(newChart);
    console.log(newChart);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 py-6 md:py-10 px-3 md:px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="text-center space-y-1">
          <h1 className="text-2xl md:text-4xl font-bold text-amber-900 font-serif tracking-wide">
            Lập Lá Số Tử Vi
          </h1>
          <p className="text-sm md:text-base text-amber-700/80 font-serif italic">
            Tứ Hóa Phái · Dương lịch → Âm lịch
          </p>
        </header>

        <BirthForm onSubmit={handleSubmit} />
        {chart && <TuViBoard chart={chart} />}

        {!chart && (
          <div className="text-center text-gray-500 text-sm py-10">
            Nhập thông tin và bấm <span className="font-semibold text-amber-700">Lập lá số</span> để xem số đồ.
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
