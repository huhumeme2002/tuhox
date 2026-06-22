import { useMemo, useState } from 'react';
import type { BirthInput } from '../types/tuVi';

interface Props {
  onSubmit: (input: BirthInput) => void;
}

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

export function BirthForm({ onSubmit }: Props) {
  const [name, setName] = useState('');
  const [day, setDay] = useState(26);
  const [month, setMonth] = useState(7);
  const [year, setYear] = useState(2003);
  const [birthTime, setBirthTime] = useState('11:30');
  const [gender, setGender] = useState<'Nam' | 'Nữ'>('Nữ');

  const days = useMemo(() => {
    const maxDay = new Date(year, month, 0).getDate();
    return Array.from({ length: maxDay }, (_, i) => i + 1);
  }, [year, month]);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const birthDate = `${year}-${pad(month)}-${pad(day)}`;
    onSubmit({ name, birthDate, birthTime, gender });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-5 rounded-xl shadow-md border border-amber-100">
      <h2 className="text-lg font-semibold mb-4 text-amber-900 flex items-center gap-2 font-serif">
        <span>🌙</span> Nhập thông tin sinh
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white/80 transition-all hover:border-amber-300"
            placeholder="Nhập họ tên"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh (dương lịch)</label>
          <div className="grid grid-cols-3 gap-2">
            <select
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
              className="w-full border border-amber-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white/80 transition-all hover:border-amber-300"
              required
            >
              <option value="" disabled>Ngày</option>
              {days.map((d) => (
                <option key={`d-${d}`} value={d}>{pad(d)}</option>
              ))}
            </select>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              required
            >
              <option value="" disabled>Tháng</option>
              {months.map((m) => (
                <option key={`m-${m}`} value={m}>Tháng {pad(m)}</option>
              ))}
            </select>
            <input
              type="number"
              min={1900}
              max={2100}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white/80 transition-all hover:border-amber-300"
              placeholder="Năm"
              required
            />
          </div>
        </div>

        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Giờ sinh</label>
          <input
            type="time"
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)}
            className="w-full border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white/80 transition-all hover:border-amber-300"
            required
          />
        </div>

        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as 'Nam' | 'Nữ')}
            className="w-full border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white/80 transition-all hover:border-amber-300"
          >
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
          </select>
        </div>

        <div className="md:col-span-3">
          <button
            type="submit"
            className="w-full md:w-auto bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white py-2.5 px-8 rounded-lg transition-all font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            Lập lá số
          </button>
        </div>
      </div>
    </form>
  );
}
