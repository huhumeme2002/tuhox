<!-- AGENTS.md — Luangiaituhoaphai
File hướng dẫn dành cho AI coding agents. Đọc file này trước khi sửa code.
-->

# AGENTS.md — Luangiaituhoaphai

> Tài liệu này tổng hợp kiến trúc, công nghệ, quy ước code và trạng thái hiện tại của dự án Luangiaituhoaphai, dựa trên nội dung thực tế trong repo.

---

## 1. Tổng quan dự án

**Luangiaituhoaphai** là ứng dụng web client-side tính và hiển thị **lá số Tử Vi (Zi Wei Dou Shu)** theo phái **Tứ Hóa**. Ứng dụng nhận thông tin sinh (họ tên, ngày sinh dương lịch, giờ sinh, giới tính), chuyển sang âm lịch, rồi an sao vào 12 cung để phân tích vận hạn.

- **Loại ứng dụng**: Single-page application (SPA), chạy hoàn toàn trên trình duyệt, không có backend.
- **Ngôn ngữ chính**: TypeScript.
- **Ngôn ngữ giao diện / comment / tài liệu**: Tiếng Việt.
- **Framework UI**: React 19 (chạy trong `StrictMode`).
- **Build tool**: Vite 8 với `@vitejs/plugin-react` (Oxc-based) và `@tailwindcss/vite`.
- **Styling**: Tailwind CSS v4, phong cách màu amber/truyền thống.
- **Calendar engine**: `lunar-javascript` để chuyển dương lịch ↔ âm lịch và lấy Can Chi.
- **Linter**: ESLint 10 với `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`.

---

## 2. Cấu trúc thư mục

```
d:/Luangiaituhoaphai/
├── src/
│   ├── components/              # React components
│   │   ├── BirthForm.tsx        # Form nhập thông tin sinh
│   │   ├── Palace.tsx           # Component hiển thị 1 cung (card)
│   │   └── TuViBoard.tsx        # Bảng 12 cung + panel phân tích (HIỆN TẠI BỊ CẮT XÉN)
│   ├── data/
│   │   └── constants.ts         # Hằng số: CAN, CHI, CUNG_NAMES, NAP_AM, MENH_CUC,
│   │                            # CHINH_TINH, STAR_COLORS, TU_HOA_TABLE, PHU_TINH
│   ├── types/
│   │   ├── tuVi.ts              # TypeScript types cốt lõi
│   │   └── lunar-javascript.d.ts # Type declaration cho thư viện lunar-javascript
│   ├── utils/                   # Toàn bộ logic tính toán lá số
│   │   ├── calendar.ts          # Dương lịch → âm lịch
│   │   ├── canChi.ts            # Tính Can Chi năm/tháng/ngày/giờ
│   │   ├── chartBuilder.ts      # Orchestrator: xây dựng đối tượng TuViChart
│   │   ├── palaceCalc.ts        # Mệnh cung, Thân cung, Mệnh Cục, Đại Vận, Tiểu Hạn, vị trí Tử Vi
│   │   ├── starPlacement.ts     # An 14 chính tinh + sao phụ (Lộc Tồn, Văn Xương, Văn Khúc)
│   │   └── tuHoa.ts             # Áp dụng Tứ Hóa (Hóa Lộc, Hóa Quyền, Hóa Khoa, Hóa Kỵ)
│   ├── App.tsx                  # Root component: form + board
│   ├── index.css                # Tailwind import + custom scrollbar + font
│   └── main.tsx                 # Entry point React
├── public/
│   └── favicon.svg              # Favicon SVG
├── dist/                        # Build output (static files từ Vite)
├── temp-lasotuvi/               # Thư viện Python tham chiếu (lasotuvi)
│   ├── lasotuvi/                # Source Python gốc
│   ├── tests/                   # Pytest tests của thư viện gốc
│   └── README.md
├── debug-ketluan.ts             # Script debug cho tính toán Lộc/Kỵ
├── temp_check.py                # Script Python dùng lasotuvi để in cung Mệnh/Thân/sao
├── temp_validate.py             # Script Python validate khác
├── package.json
├── tsconfig.json                # Project references (tsconfig.app.json + tsconfig.node.json)
├── tsconfig.app.json            # Config TS cho app (src/)
├── tsconfig.node.json           # Config TS cho Vite config
├── vite.config.ts               # Vite config
├── eslint.config.js             # ESLint flat config
└── index.html                   # HTML entry point
```

### 2.1. Vị trí quan trọng

- **Luồng tính toán chính**: `src/utils/chartBuilder.ts` là entry point duy nhất được `App.tsx` gọi.
- **Nguồn chân lý thuật toán**: `temp-lasotuvi/lasotuvi/`. Code TypeScript được port từ Python, nhiều file utils có comment so sánh với logic 1-based của Python.
- **File đang bị lỗi**: `src/components/TuViBoard.tsx` hiện tại bị cắt xén ở đầu file, dẫn đến build thất bại (xem mục 8).

---

## 3. Stack công nghệ

| Lớp | Công nghệ | Phiên bản (package.json) | Ghi chú |
|-----|-----------|--------------------------|---------|
| UI Framework | React | `^19.2.6` | StrictMode enabled |
| DOM Renderer | react-dom | `^19.2.6` | `createRoot` API |
| Build Tool | Vite | `^8.0.12` | `@vitejs/plugin-react` (Oxc) |
| CSS | Tailwind CSS | `^4.3.1` | Qua plugin `@tailwindcss/vite` |
| Language | TypeScript | `~6.0.2` | Target ES2023, moduleResolution bundler |
| Calendar | lunar-javascript | `^1.7.7` | Chuyển đổi dương-âm lịch, GanZhi |
| Linter | ESLint | `^10.3.0` | + typescript-eslint + react-hooks + react-refresh |

---

## 4. Lệnh build, dev & lint

Tất cả chạy qua `npm`:

```bash
npm install       # Cài dependencies
npm run dev       # Chạy dev server Vite (mặc định http://localhost:5173)
npm run build     # Type-check (tsc -b) rồi build production ra dist/
npm run lint      # ESLint toàn project
npm run preview   # Preview build production
```

### 4.1. Trạng thái build hiện tại

**Build hiện đang bị lỗi** do `src/components/TuViBoard.tsx` bị cắt xén: file bắt đầu từ giữa một `useMemo` (dòng đầu tiên là `// Xếp hạng năm đẹp/xấu...`), thiếu phần import, khai báo component, props, và các hook phía trên. `tsc -b` báo hàng loạt lỗi `Cannot find name`, `Module has no exported member 'TuViBoard'`, v.v.

Trước khi deploy hoặc phát triển tiếp, **cần khôi phục hoặc viết lại `TuViBoard.tsx`**.

---

## 5. Tổ chức code & luồng dữ liệu

### 5.1. Pipeline tính toán lá số

```
BirthInput (App.tsx / BirthForm.tsx)
  → calendar.ts        : chuyển dương lịch → âm lịch
  → canChi.ts          : tính Can Chi năm/tháng/ngày/giờ
  → palaceCalc.ts      : Mệnh cung, Thân cung, Mệnh Cục, Đại Vận, Tiểu Hạn, vị trí Tử Vi
  → starPlacement.ts   : an 14 chính tinh + sao phụ
  → tuHoa.ts           : áp Tứ Hóa theo Can năm
  → chartBuilder.ts    : gộp tất cả thành TuViChart
  → TuViBoard.tsx + Palace.tsx : render
```

### 5.2. Indexing: 0-based vs 1-based

Toàn bộ code TypeScript dùng **0-based indexing** (0–11) cho 12 cung / 12 Chi. Tuy nhiên, nhiều file utils (đặc biệt `palaceCalc.ts`, `starPlacement.ts`) có comment tường minh so sánh với logic **1-based** của repo Python gốc (`temp-lasotuvi/`).

Ví dụ chuyển đổi:

```ts
// Python: dichCung(cung, *steps) = (cung + sum(steps)) % 12, nếu 0 thì 12
// JS 0-based: (cung0 + sum(steps)) % 12
```

Khi sửa logic tính toán, **phải đọc comment Python** trong từng file để đảm bảo không nhầm lẫn giữa 0-based và 1-based.

### 5.3. Types cốt lõi (`src/types/tuVi.ts`)

- `Can`: Union type 10 Can (`'Giáp'` … `'Quý'`).
- `Chi`: Union type 12 Chi (`'Tý'` … `'Hợi'`).
- `CungName`: Union type 12 tên cung (`'Mệnh'`, `'Phụ Mẫu'`, …).
- `StarType`: `'chinh' | 'phu' | 'tuHoa'`.
- `Star`: `{ name, type, quality?, tuHoa? }` — `quality` dùng `+1`/`-1` cho miếu vượng/hãm địa.
- `Palace`: `{ index: 0-11, name, can, chi, isMenh?, isThan?, daiVan?, stars[] }`.
- `TuViChart`: object chứa toàn bộ thông tin lá số.
- `BirthInput`: `{ name, birthDate: 'YYYY-MM-DD', birthTime: 'HH:mm', gender: 'Nam' | 'Nữ' }`.

### 5.4. Constants (`src/data/constants.ts`)

- `CAN`, `CHI`, `CUNG_NAMES`: mảng typed theo thứ tự truyền thống.
- `NAP_AM`: Record 60 hoa giáp → Ngũ hành nạp âm.
- `MENH_CUC`: Map Ngũ hành → tên cục (`Kim Tứ Cục`, `Mộc Tam Cục`, …).
- `CHINH_TINH`: 14 sao chính theo thứ tự vòng sao.
- `STAR_COLORS`: màu hex cho từng sao theo Ngũ hành (dùng render).
- `TU_HOA_TABLE`: bảng Tứ Hóa theo Can năm — mỗi Can ánh xạ đến `[Hóa Lộc, Hóa Quyền, Hóa Khoa, Hóa Kỵ]`.
- `PHU_TINH`: danh sách sao phụ hay dùng.

### 5.5. Các module utils chính

| File | Trách nhiệm |
|------|-------------|
| `calendar.ts` | `convertSolarToLunar(dateStr)` trả về `{ day, month, year, leap }`. Dùng `lunar-javascript`. |
| `canChi.ts` | `getYearCanChi`, `getMonthCanChi`, `getDayCanChi`, `hourToChi`, `getHourCanChi`. Hỗ trợ chuyển Hán tự từ `getDayInGanZhi()` sang tên Việt. |
| `palaceCalc.ts` | `dichCung`, `calculateMenhCungIndex`, `calculateThanCungIndex`, `timCuc`, `getMenhCuc`, `getMenhCucNumber`, `timTuVi`, `calculateDaiVan`, `calculateTieuHan`, `getAmDuongNamNu`. |
| `starPlacement.ts` | `placeChinhTinh(viTriTuVi)` an 14 sao chính; `placePhuTinh(...)` an Lộc Tồn, Văn Khúc, Văn Xương. |
| `tuHoa.ts` | `applyTuHoa(can, starsByPalace)` đánh dấu `tuHoa` cho sao tương ứng. |
| `chartBuilder.ts` | `buildChart(input)` ghép tất cả các bước trên và trả về `TuViChart`. |

### 5.6. Components

- `BirthForm.tsx`: form nhập liệu, mặc định ngày 26/07/2003, giờ 11:30, giới tính Nữ. Dùng select/input riêng cho ngày/tháng/năm.
- `Palace.tsx`: render 1 cung dưới dạng card, hiển thị chính tinh, phụ tinh, Tứ Hóa, badge Mệnh/Thân/Đại Vận, badge Lộc/Kỵ.
- `TuViBoard.tsx`: **hiện bị cắt xén**, chỉ còn phần `daiVanYearRanking` useMemo. Dự kiến nơi đây nhận `chart` từ `App.tsx` và render 12 cung + panel phân tích Đại Vận/Năm.

---

## 6. Quy ước code & style

### 6.1. TypeScript strictness

`tsconfig.app.json` bật các tùy chọn nghiêm ngặt:

- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noFallthroughCasesInSwitch: true`
- `verbatimModuleSyntax: true`
- `erasableSyntaxOnly: true`

Yêu cầu:
- Không để biến/param không dùng.
- Switch phải exhaustive hoặc có `default`.
- Import type phải dùng `import type { ... }`.
- Không dùng cú pháp TS sẽ bị xóa (enum, namespace, parameter properties, v.v.).

### 6.2. Styling

- Dùng **Tailwind CSS v4** utility classes. Không dùng CSS module hay styled-components.
- Màu chủ đạo: **amber** (vàng nâu) — phong cách truyền thống Tử Vi.
- Font: `Inter` (sans-serif cho body), `Noto Serif` (serif cho tiêu đề và tên cung), load từ Google Fonts trong `index.html`.
- Custom scrollbar trong `index.css` với màu `#c4a882`.

### 6.3. Ngôn ngữ

- Code, tên biến/hàm: tiếng Việt không dấu hoặc tiếng Anh tùy ngữ cảnh (ví dụ: `calculateMenhCungIndex`, `BirthForm`).
- Comment và tài liệu: **tiếng Việt**.
- Tên sao, cung, Can Chi: tiếng Việt có dấu.

---

## 7. Testing strategies

- **Dự án hiện không có test runner nào được cấu hình** (không Jest, Vitest, Playwright, Cypress).
- Không có test tự động ở tầng JS/TS.
- Validation hiện được thực hiện thủ công qua:
  - `temp_check.py` / `temp_validate.py`: chạy thư viện Python `lasotuvi` để in cung Mệnh, Thân, và sao các cung, dùng đối chiếu với kết quả TypeScript.
  - `debug-ketluan.ts`: script Node/TS debug cho logic Lộc/Kỵ.

### 7.1. Hướng dẫn validate thuật toán

Khi sửa logic trong `src/utils/`, nên kiểm tra ít nhất 2–3 ngày sinh khác nhau (nam/nữ, tháng nhuận, giờ khác nhau) và đối chiếu với Python:

```bash
# Ví dụ chạy Python validate
python temp_check.py
python temp_validate.py
```

Nếu muốn thêm test suite, khuyến nghị dùng **Vitest** (phù hợp với Vite) và đặt test files cạnh source hoặc trong `src/__tests__/`.

---

## 8. Thư viện tham chiếu Python (`temp-lasotuvi/`)

Thư mục `temp-lasotuvi/` chứa mã nguồn thư viện Python [`lasotuvi`](https://github.com/doanguyen/lasotuvi) của `doanguyen`. Đây là **nguồn chân lý thuật toán** (algorithmic source of truth) cho toàn bộ port TypeScript.

- **Mục đích**: Giúp developer hiểu và validate thuật toán gốc. Không phải dependency của build JS.
- **Cách dùng**: Các file `temp_check.py`, `temp_validate.py` import `lasotuvi` để so sánh kết quả với TypeScript.
- **Git**: `temp-lasotuvi/` bị liệt kê trong `.gitignore` (dòng `temp-lasotuvi/`), nhưng có thể đã được track trong git từ trước.
- **Không sửa** code trong `temp-lasotuvi/` trừ khi mục đích là cập nhật thư viện tham chiếu.

---

## 9. Debug & validation scripts

| File | Mục đích | Cách chạy |
|------|----------|-----------|
| `debug-ketluan.ts` | Debug logic tính Lộc/Kỵ (Kết luận) cho một ngày sinh cụ thể. | `npx ts-node debug-ketluan.ts` hoặc tương đương |
| `temp_check.py` | Chạy `lasotuvi` để in ra cung Mệnh, Thân, và sao các cung theo index 5→11→4→… | `python temp_check.py` |
| `temp_validate.py` | Validate khác, in cung theo thứ tự index 0→11. | `python temp_validate.py` |

Các file này không nằm trong `src/` và không được build.

---

## 10. Deployment

- Build ra thư mục `dist/` (static files: HTML, JS bundle, CSS bundle, assets).
- `dist/` đã có sẵn trong repo (được build trước), nhưng nên rebuild (`npm run build`) trước khi deploy.
- Có thể deploy lên bất kỳ static hosting nào (GitHub Pages, Vercel, Netlify, Cloudflare Pages).
- **Lưu ý**: hiện `npm run build` thất bại do `TuViBoard.tsx` bị cắt xén. Cần sửa file này trước khi build/deploy.

---

## 11. Security considerations

- Ứng dụng là **client-side only** — toàn bộ tính toán chạy trong trình duyệt. Không có backend, API call, hay database.
- Không xử lý dữ liệu nhạy cảm (PII) ngoài việc hiển thị tên người dùng nhập vào form.
- Không có auth, session, hay cookies.

---

## 12. Lưu ý đặc biệt khi sửa code

### 12.1. Tính toán Tử Vi là domain-specific

Mọi thay đổi trong `src/utils/` đều có thể ảnh hưởng đến kết quả lá số. Khi sửa:

1. Đọc comment so sánh với Python trong file đó.
2. Chạy `temp_check.py` hoặc `temp_validate.py` để đối chiếu với `lasotuvi`.
3. Kiểm tra ít nhất 2–3 ngày sinh khác nhau (nam/nữ, tháng nhuận, giờ khác nhau).

### 12.2. `TuViBoard.tsx` đang bị cắt xén

**Cảnh báo nghiêm trọng**: File `src/components/TuViBoard.tsx` trong working tree hiện tại chỉ còn phần cuối của một `useMemo` (`daiVanYearRanking`). File thiếu phần import, khai báo component, props, state, và các helper function như `calculateLocKy`, `calculateExtendedLocKy`, `getYearCanChi`, `getYearCanMap`. Điều này khiến `npm run build` và `npm run lint` đều báo lỗi.

Các hành động có thể cần:
- Khôi phục từ git history: `git show HEAD:src/components/TuViBoard.tsx`.
- Hoặc viết lại component từ đầu nếu phiên bản cũ không còn phù hợp.

### 12.3. Không có tests tự động

Dự án hiện không có test suite. Nếu thêm test, khuyến nghị dùng **Vitest** và đặt test files cạnh source hoặc trong `src/__tests__/`.

### 12.4. Kiểm tra build trước khi commit

Do TS strict và ESLint, luôn chạy:

```bash
npm run lint
npm run build
```

trước khi commit để đảm bảo không để lại lỗi compile.
