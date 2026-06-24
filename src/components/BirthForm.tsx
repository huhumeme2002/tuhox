import { useMemo, useState } from 'react';
import type { BirthInput } from '../types/tuVi';

interface Props {
  onSubmit: (input: BirthInput) => void;
}

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function FieldIcon({ type }: { type: 'user' | 'calendar' | 'clock' | 'gender' }) {
  const common = 'h-4 w-4 text-[var(--gold-soft)]';

  if (type === 'user') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common} aria-hidden="true">
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="8" r="4" />
      </svg>
    );
  }

  if (type === 'calendar') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common} aria-hidden="true">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </svg>
    );
  }

  if (type === 'clock') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common} aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common} aria-hidden="true">
      <path d="M12 21V3M7 7c0 2.8 2.2 5 5 5M12 12c2.8 0 5 2.2 5 5" />
    </svg>
  );
}

function FieldLabel({ icon, label }: { icon: 'user' | 'calendar' | 'clock' | 'gender'; label: string }) {
  return (
    <span className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--gold-soft)]/90">
      <FieldIcon type={icon} />
      {label}
    </span>
  );
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
  const fieldClass = 'feng-input w-full rounded-xl px-3 py-3 text-sm';
  const compactFieldClass = 'feng-input w-full rounded-xl px-3 py-3 text-sm';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const birthDate = `${year}-${pad(month)}-${pad(safeDay)}`;
    onSubmit({ name, birthDate, birthTime, gender });
  };

  return (
    <form id="birth-form" onSubmit={handleSubmit} className="feng-shell rounded-[1.45rem] p-5 md:p-6">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <span className="feng-kicker">Thông tin khai lá số</span>
          <div>
            <h2 className="font-serif text-2xl font-semibold text-[var(--text-main)] md:text-3xl">Nhập thông tin sinh</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
              Chọn ngày giờ sinh, giới tính và năm theo định dạng quen thuộc để khởi tạo nhanh lá số, sau đó chuyển sang phần luận giải.
            </p>
          </div>
        </div>
        <div className="imperial-button-secondary inline-flex rounded-xl px-4 py-3 text-xs font-medium text-[var(--text-muted)]">
          Form nhập liệu giữ nguyên logic, chỉ nâng cấp trình bày.
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="md:col-span-1">
          <label className="block">
            <FieldLabel icon="user" label="Họ tên" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
              placeholder="Nhập họ tên"
            />
          </label>
        </div>

        <div className="md:col-span-2">
          <label className="block">
            <FieldLabel icon="calendar" label="Ngày sinh dương lịch" />
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
          </label>
        </div>

        <div className="md:col-span-1">
          <label className="block">
            <FieldLabel icon="clock" label="Giờ sinh" />
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
          </label>
        </div>

        <div className="md:col-span-1">
          <label className="block">
            <FieldLabel icon="gender" label="Giới tính" />
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as 'Nam' | 'Nữ')}
              className={fieldClass}
            >
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
            </select>
          </label>
        </div>

        <div className="md:col-span-3 flex items-end">
          <button
            type="submit"
            className="feng-button-primary w-full rounded-xl px-8 py-3 font-semibold md:w-auto"
          >
            Lập lá số
          </button>
        </div>
      </div>
    </form>
  );
}
