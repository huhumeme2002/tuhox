import { useMemo, useState } from 'react';
import type { BirthInput } from '../types/tuVi';

interface Props {
  onSubmit: (input: BirthInput) => void;
}

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

const BIRTH_TIME_OPTIONS = [
  { label: 'Tý (23-01h)', value: '00:30' },
  { label: 'Sửu (01-03h)', value: '01:30' },
  { label: 'Dần (03-05h)', value: '03:30' },
  { label: 'Mão (05-07h)', value: '05:30' },
  { label: 'Thìn (07-09h)', value: '07:30' },
  { label: 'Tỵ (09-11h)', value: '09:30' },
  { label: 'Ngọ (11-13h)', value: '11:30' },
  { label: 'Mùi (13-15h)', value: '13:30' },
  { label: 'Thân (15-17h)', value: '15:30' },
  { label: 'Dậu (17-19h)', value: '17:30' },
  { label: 'Tuất (19-21h)', value: '19:30' },
  { label: 'Hợi (21-23h)', value: '21:30' },
] as const;

export function BirthForm({ onSubmit }: Props) {
  const [name, setName] = useState('');
  const [day, setDay] = useState(26);
  const [month, setMonth] = useState(7);
  const [year, setYear] = useState(2003);
  const [birthTime, setBirthTime] = useState('11:30');
  const [gender, setGender] = useState<'Nam' | 'Nữ'>('Nữ');

  const maxDay = useMemo(() => new Date(year, month, 0).getDate(), [year, month]);
  const days = useMemo(() => Array.from({ length: maxDay }, (_, i) => i + 1), [maxDay]);
  const safeDay = Math.min(day, maxDay);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const fieldClass = 'feng-input w-full rounded-xl px-3 py-2.5 text-sm text-slate-900';
  const compactFieldClass = 'feng-input w-full rounded-xl px-2.5 py-2.5 text-sm text-slate-900';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const birthDate = `${year}-${pad(month)}-${pad(safeDay)}`;
    onSubmit({ name, birthDate, birthTime, gender });
  };

  return (
    <form onSubmit={handleSubmit} className="feng-shell rounded-[1.35rem] p-5 md:p-6">
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <span className="feng-kicker">Thông tin khai lá số</span>
          <div>
            <h2 className="font-serif text-xl font-semibold text-amber-950 md:text-2xl">Nhập thông tin sinh</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-amber-900/70">
              Chọn ngày giờ theo định dạng quen thuộc để lập lá số và chuyển ngay sang phần phân tích.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="md:col-span-1">
          <label className="mb-1.5 block text-sm font-medium text-amber-950">Họ tên</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass}
            placeholder="Nhập họ tên"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-amber-950">Ngày sinh (dương lịch)</label>
          <div className="grid grid-cols-3 gap-2">
            <select
              value={safeDay}
              onChange={(e) => setDay(Number(e.target.value))}
              className={compactFieldClass}
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
              className={compactFieldClass}
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
              className={fieldClass}
              placeholder="Năm"
              required
            />
          </div>
        </div>

        <div className="md:col-span-1">
          <label className="mb-1.5 block text-sm font-medium text-amber-950">Giờ sinh</label>
          <select
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)}
            className={fieldClass}
            required
          >
            {BIRTH_TIME_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-1">
          <label className="mb-1.5 block text-sm font-medium text-amber-950">Giới tính</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as 'Nam' | 'Nữ')}
            className={fieldClass}
          >
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
          </select>
        </div>

        <div className="md:col-span-3 flex items-end">
          <button
            type="submit"
            className="feng-button-primary w-full rounded-xl px-8 py-2.5 font-semibold md:w-auto"
          >
            Lập lá số
          </button>
        </div>
      </div>
    </form>
  );
}
