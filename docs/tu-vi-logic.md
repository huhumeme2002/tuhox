# Tổng hợp logic tính lá số Tử Vi trong code

> File này tổng hợp toàn bộ logic tính toán lá số Tử Vi (phái Tứ Hóa) từ code TypeScript trong `src/utils/`, để đọc và kiểm tra thuật toán.

---

## 1. Pipeline tính toán tổng quan

```
BirthInput (họ tên, ngày sinh dương lịch, giờ sinh, giới tính)
  → calendar.ts        : chuyển dương lịch → âm lịch
  → canChi.ts          : tính Can Chi năm / tháng / ngày / giờ
  → palaceCalc.ts      : Mệnh cung, Thân cung, Mệnh Cục, Đại Vận, Tiểu Hạn, vị trí Tử Vi
  → starPlacement.ts   : an 14 chính tinh + sao phụ
  → tuHoa.ts           : áp Tứ Hóa theo Can năm
  → chartBuilder.ts    : ghép tất cả thành đối tượng TuViChart
```

---

## 2. Quy ước index: 0-based vs 1-based

Toàn bộ code TypeScript dùng **0-based indexing** (0–11) cho 12 cung / 12 Chi.

| Giá trị | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 |
|---------|---|---|---|---|---|---|---|---|---|---|----|----|
| Chi     | Tý | Sửu | Dần | Mão | Thìn | Tỵ | Ngọ | Mùi | Thân | Dậu | Tuất | Hợi |

Nhiều hàm trong `palaceCalc.ts` và `starPlacement.ts` có comment so sánh trực tiếp với logic **1-based** của repo Python `temp-lasotuvi/`. Khi đọc cần chú ý chuyển đổi.

Hàm cơ sở để dịch cung:

```ts
export function dichCung(cung0: number, ...steps: number[]): number {
  return steps.reduce((acc, s) => (acc + s + 12) % 12, cung0);
}
```

Tương đương Python 1-based: `dichCung(cung, *steps) = (cung + sum(steps)) % 12`, nếu 0 thì quy về 12.

---

## 3. Bước 1: Chuyển dương lịch sang âm lịch

**File:** `src/utils/calendar.ts`

Dùng thư viện `lunar-javascript`:

```ts
export function convertSolarToLunar(dateStr: string): LunarDate {
  const [year, month, day] = dateStr.split('-').map(Number);
  const solar = Solar.fromYmd(year, month, day);
  const lunar = Lunar.fromSolar(solar);
  return {
    day: lunar.getDay(),
    month: Math.abs(lunar.getMonth()),   // tháng nhuận trả về số âm
    year: lunar.getYear(),
    leap: lunar.getMonth() < 0,
  };
}
```

Kết quả: `{ day, month, year, leap }` dùng cho các bước sau.

---

## 4. Bước 2: Tính Can Chi

**File:** `src/utils/canChi.ts`

### 4.1. Can Chi năm

```ts
const canIndex = (lunarYear - 4) % 10;
const chiIndex = (lunarYear - 4) % 12;
```

Năm 4 CN là năm Giáp Tý (canIndex=0, chiIndex=0).

### 4.2. Can Chi tháng

Can tháng 1 âm (Dần) phụ thuộc Can năm theo quy tắc:

| Can năm | Can tháng Giêng |
|---------|-----------------|
| Giáp, Kỷ | Bính |
| Ất, Canh | Mậu |
| Bính, Tân | Canh |
| Đinh, Nhâm | Nhâm |
| Mậu, Quý | Giáp |

```ts
const firstMonthCan = firstMonthCanMap[yearCanIndex];
const canIndex = (firstMonthCan + (lunarMonth - 1)) % 10;
const chiIndex = (lunarMonth + 1) % 12;  // tháng 1 → Dần (index 2)
```

### 4.3. Can Chi ngày

Dùng `lunar.getDayInGanZhi()` rồi chuyển Hán tự về tiếng Việt.

### 4.4. Giờ sinh → Chi

```ts
export function hourToChi(hour: number, minute: number): Chi {
  const totalMinutes = hour * 60 + minute;
  if (totalMinutes >= 23 * 60) return 'Tý';  // 23:00–00:59
  const chiIndex = Math.floor((totalMinutes + 60) / 120) % 12;
  return CHI[chiIndex];
}
```

### 4.5. Can Chi giờ

Giờ Tý của ngày Giáp/Kỷ là Giáp Tý, các ngày khác tuân theo quy tắc:

| Can ngày | Can giờ Tý |
|----------|------------|
| Giáp, Kỷ | Giáp |
| Ất, Canh | Bính |
| Bính, Tân | Mậu |
| Đinh, Nhâm | Canh |
| Mậu, Quý | Nhâm |

```ts
const canIndex = (tyCan + hourChiIndex) % 10;
```

---

## 5. Bước 3: Mệnh cung và Thân cung

**File:** `src/utils/palaceCalc.ts`

### 5.1. Mệnh cung

Công thức (0-based, xuất phát từ Dần index 2):

```ts
export function calculateMenhCungIndex(lunarMonth: number, hourChiIndex: number): number {
  return dichCung(2, lunarMonth - 1, -hourChiIndex);
}
```

So với Python 1-based: `dichCung(3, thangSinhAmLich - 1, -gioSinhAmLich + 1)`.

### 5.2. Thân cung

```ts
export function calculateThanCungIndex(lunarMonth: number, hourChiIndex: number): number {
  return dichCung(2, lunarMonth - 1, hourChiIndex);
}
```

So với Python 1-based: `dichCung(3, thangSinhAmLich - 1, gioSinhAmLich - 1)`.

---

## 6. Bước 4: Mệnh Cục

**File:** `src/utils/palaceCalc.ts`

### 6.1. Tìm ngũ hành cục

Dựa trên vị trí Mệnh cung và Can năm.

```ts
export function timCuc(viTriCungMenh0: number, canNam0: number): string {
  const viTriCungMenh1 = viTriCungMenh0 + 1;
  const canNam1 = canNam0 + 1;

  const canThangGieng = (canNam1 * 2 + 1) % 10;
  let canThangMenh = ((((viTriCungMenh1 - 3) % 12) + 12) % 12 + canThangGieng) % 10;
  if (canThangMenh === 0) canThangMenh = 10;

  const key = `${CAN[canThangMenh - 1]} ${CHI[viTriCungMenh1 - 1]}`;
  const napAm = NAP_AM[key] || '';
  // Trả về Kim / Mộc / Thủy / Hỏa / Thổ
}
```

### 6.2. Chuyển thành tên cục

| Ngũ hành | Tên cục | Số |
|----------|---------|----|
| Thủy | Thủy Nhị Cục | 2 |
| Mộc | Mộc Tam Cục | 3 |
| Kim | Kim Tứ Cục | 4 |
| Thổ | Thổ Ngũ Cục | 5 |
| Hỏa | Hỏa Lục Cục | 6 |

```ts
export function getMenhCucNumber(viTriCungMenh0: number, canNam0: number): number {
  // trả về 2, 3, 4, 5, 6
}
```

---

## 7. Bước 5: Tìm vị trí Tử Vi

**File:** `src/utils/palaceCalc.ts`

Tử Vi được tìm từ cung Dần, cộng dồn theo số cục cho đến khi vượt ngày sinh, rồi điều chỉnh theo sai lệch chẵn/lẻ.

```ts
export function timTuVi(cucSo: number, ngaySinhAmLich: number): number {
  let cungDan1 = 3;     // Dần 1-based
  let cuc = cucSo;
  const cucBanDau = cucSo;

  while (cuc < ngaySinhAmLich) {
    cuc += cucBanDau;
    cungDan1 += 1;
  }

  let saiLech = cuc - ngaySinhAmLich;
  if (saiLech % 2 === 1) {
    saiLech = -saiLech;
  }

  return dichCung(cungDan1 - 1, saiLech);  // chuyển về 0-based
}
```

**Ví dụ minh họa:**
- Cục Kim Tứ Cục = 4, ngày sinh âm lịch = 5.
- Lần 1: `cuc = 4` < 5 → `cuc = 8`, `cungDan1 = 4`.
- Sai lệch = 8 - 5 = 3 (lẻ) → saiLech = -3.
- Tử Vi tại `dichCung(3, -3)` = Mão (index 3).

---

## 8. Bước 6: An 14 chính tinh

**File:** `src/utils/starPlacement.ts`

Sau khi có vị trí Tử Vi, 13 sao còn lại được xác định bằng cách dịch cung:

```ts
const viTriLiemTrinh = dichCung(viTriTuVi, 4);
const viTriThienDong = dichCung(viTriTuVi, 7);
const viTriVuKhuc     = dichCung(viTriTuVi, 8);
const viTriThaiDuong  = dichCung(viTriTuVi, 9);
const viTriThienCo    = dichCung(viTriTuVi, 11);

const viTriThienPhu = dichCung(2, 2 - viTriTuVi);  // từ Dần
const viTriThaiAm    = dichCung(viTriThienPhu, 1);
const viTriThamLang  = dichCung(viTriThienPhu, 2);
const viTriCuMon     = dichCung(viTriThienPhu, 3);
const viTriThienTuong= dichCung(viTriThienPhu, 4);
const viTriThienLuong= dichCung(viTriThienPhu, 5);
const viTriThatSat   = dichCung(viTriThienPhu, 6);
const viTriPhaQuan   = dichCung(viTriThienPhu, 10);
```

Danh sách 14 chính tinh:

```
Tử Vi, Thiên Cơ, Thái Dương, Vũ Khúc, Thiên Đồng, Liêm Trinh, Thiên Phủ,
Thái Âm, Tham Lang, Cự Môn, Thiên Tướng, Thiên Lương, Thất Sát, Phá Quân
```

---

## 9. Bước 7: An sao phụ

**File:** `src/utils/starPlacement.ts`

Hiện tại code chỉ an 3 sao phụ: **Lộc Tồn**, **Văn Khúc**, **Văn Xương**.

### 9.1. Lộc Tồn

Vị trí theo Can năm (bảng 1-based từ Python):

```ts
const locTonVitri1 = [null, 3, 4, 6, 7, 6, 7, 9, 10, 12, 1][canNam1];
```

| Can năm | Vị trí Lộc Tồn (1-based) |
|---------|--------------------------|
| Giáp | 3 (Dần) |
| Ất | 4 (Mão) |
| Bính | 6 (Tỵ) |
| Đinh | 7 (Ngọ) |
| Mậu | 6 (Tỵ) |
| Kỷ | 7 (Ngọ) |
| Canh | 9 (Thân) |
| Tân | 10 (Dậu) |
| Nhâm | 12 (Hợi) |
| Quý | 1 (Tý) |

### 9.2. Văn Khúc

```ts
const viTriVanKhuc = dichCung(4, hourChiIndex);  // xuất phát Thìn
```

### 9.3. Văn Xương

```ts
const viTriVanXuong = dichCung(1, 1 - viTriVanKhuc);  // đối xứng với Văn Khúc
```

---

## 10. Bước 8: Áp Tứ Hóa

**File:** `src/utils/tuHoa.ts`

Dựa vào **Can năm**, mỗi sao trong bảng sẽ được gán Hóa Lộc / Hóa Quyền / Hóa Khoa / Hóa Kỵ.

```ts
export const TU_HOA_TABLE: Record<Can, [string, string, string, string]> = {
  'Giáp': ['Liêm Trinh', 'Phá Quân', 'Vũ Khúc', 'Thái Dương'],
  'Ất': ['Thiên Cơ', 'Thiên Lương', 'Tử Vi', 'Thái Âm'],
  'Bính': ['Thiên Đồng', 'Thiên Cơ', 'Văn Xương', 'Liêm Trinh'],
  'Đinh': ['Thái Âm', 'Thiên Đồng', 'Thiên Cơ', 'Cự Môn'],
  'Mậu': ['Tham Lang', 'Thái Âm', 'Hữu Bật', 'Thiên Cơ'],
  'Kỷ': ['Vũ Khúc', 'Tham Lang', 'Thiên Lương', 'Văn Khúc'],
  'Canh': ['Thái Dương', 'Vũ Khúc', 'Thiên Lương', 'Thiên Đồng'],
  'Tân': ['Cự Môn', 'Thái Dương', 'Văn Khúc', 'Văn Xương'],
  'Nhâm': ['Thiên Lương', 'Tử Vi', 'Thiên Phủ', 'Vũ Khúc'],
  'Quý': ['Phá Quân', 'Cự Môn', 'Thái Âm', 'Tham Lang'],
};
```

Mỗi phần tử là `[Hóa Lộc, Hóa Quyền, Hóa Khoa, Hóa Kỵ]`.

---

## 11. Bước 9: Đại Vận và Tiểu Hạn

**File:** `src/utils/palaceCalc.ts`

### 11.1. Đại Vận

Đại vận bắt đầu từ Mệnh cung, đi theo chiều thuận/nghịch do giới tính và Âm/Dương của Chi năm sinh quyết định.

```ts
export function calculateDaiVan(
  menhCungIndex: number,
  cucSo: number,
  chiNam0: number,
  gender: 'Nam' | 'Nữ'
): number[] {
  const gioiTinh = gender === 'Nam' ? 1 : -1;
  const amDuongChiNamSinh = chiNam0 % 2 === 0 ? 1 : -1;  // Tý=0 dương, Sửu=1 âm, ...
  const chieu = gioiTinh * amDuongChiNamSinh;

  for (let i = 0; i < 12; i++) {
    const khoangCach = khoangCachCung(i, menhCungIndex, chieu);
    result.push(cucSo + khoangCach * 10);
  }
}
```

**Quy tắc chiều:**
- Nam + Chi năm Dương → thuận (cùng chiều kim đồng hồ)
- Nam + Chi năm Âm → nghịch
- Nữ + Chi năm Âm → thuận
- Nữ + Chi năm Dương → nghịch

Mỗi cung cách nhau 10 năm, bắt đầu từ số cục.

### 11.2. Tiểu Hạn

```ts
export function calculateTieuHan(
  chiNam0: number,
  gender: 'Nam' | 'Nữ'
): number[] {
  const gioiTinh = gender === 'Nam' ? 1 : -1;

  const khoiTieuHan = dichCung(10, -3 * chiNam0);       // xuất phát Tuất
  const viTriCungTy = dichCung(khoiTieuHan, -gioiTinh * chiNam0);

  for (let i = 0; i < 12; i++) {
    const khoangCach = khoangCachCung(i, viTriCungTy, gioiTinh);
    result.push(khoangCach);  // 0–11
  }
}
```

Tiểu hạn là số thứ tự cung (0–11) theo chiều Nam thuận / Nữ nghịch.

---

## 12. Bước 10: Xây dựng 12 cung

**File:** `src/utils/chartBuilder.ts`

12 cung được đặt theo 12 Chi cố định trên địa bàn. Mỗi cung có:

- `index`: 0–11 (theo Chi)
- `name`: tên cung lấy từ `CUNG_NAMES` dựa trên khoảng cách từ Mệnh cung
- `can`: Thiên Can của cung, tính từ Dần = Giáp
- `chi`: Chi cố định
- `isMenh`, `isThan`: đánh dấu cung Mệnh / Thân
- `daiVan`: số tuổi bắt đầu đại vận
- `stars`: các sao trong cung

```ts
const palaces: Palace[] = CHI.map((chi, index) => {
  const cungIndex = (index - menhCungIndex + 12) % 12;  // tên cung
  const cungName = CUNG_NAMES[cungIndex];
  const canCung0 = ((index - 2 + 12) % 12) % 10;         // Dần=Giáp
  return {
    index,
    name: cungName,
    can: CAN[canCung0],
    chi,
    isMenh: index === menhCungIndex,
    isThan: index === thanCungIndex,
    daiVan: daiVan[index],
    stars: starsByPalace[index] || [],
  };
});
```

Lưu ý: `canCung0` lấy modulo 10 nên sau Quý lại quay về Giáp.

---

## 13. Âm Dương Nam Nữ

**File:** `src/utils/palaceCalc.ts`

```ts
export function getAmDuongNamNu(can: Can, gender: 'Nam' | 'Nữ'): string {
  const amDuong = getAmDuong(can);  // Giáp/Bính/Mậu/Canh/Nhâm = Dương
  const isThuan = (amDuong === 'Dương' && gender === 'Nam')
               || (amDuong === 'Âm' && gender === 'Nữ');
  return `${amDuong} ${gender} ${isThuan ? 'Thuận Lý' : 'Nghịch Lý'}`;
}
```

---

## 14. Logic Lộc / Kỵ (tiên thiên – đại vận – năm)

> Phần này nằm chủ yếu trong `src/components/TuViBoard.tsx` và `src/components/Palace.tsx`. Đây là logic **phân tích** (analysis), không phải logic **an sao** cơ bản.

### 14.1. Nguyên lý chung

Trong code này, Lộc/Kỵ được xác định thông qua bảng **Tứ Hóa**:

- **Hóa Lộc** của một Can → cung đóng **Lộc** (`L1`)
- **Hóa Kỵ** của một Can → cung đóng **Kỵ** (`K1`)
- `L2 = L1 + 6` (đối cung)
- `L3 = L1 + 11` (lục hợp / hại theo cách tính trong code)
- `K2`, `K3` tương tự

```ts
function calculateLocKy(can: Can, palaces: Palace[]) {
  const [hoaLoc, , , hoaKy] = TU_HOA_TABLE[can];
  const loc1 = palaces.findIndex((p) => p.stars.some((s) => s.name === hoaLoc));
  const ky1 = palaces.findIndex((p) => p.stars.some((s) => s.name === hoaKy));
  return {
    loc: [loc1, (loc1 + 6) % 12, (loc1 + 11) % 12],
    ky:  [ky1, (ky1 + 6) % 12, (ky1 + 11) % 12],
  };
}
```

### 14.2. Ba tầng Lộc/Kỵ

Code phân biệt 3 tầng khi phân tích một cung:

| Tầng | Can dùng để tính | Ngữ cảnh |
|------|------------------|----------|
| **Tiên thiên** | Can gốc của cung vai trò trong lá số gốc | Vận mệnh bẩm sinh |
| **Đại Vận** | Can gốc của cung vai trò trong Đại Vận đang chọn | 10 năm một vận |
| **Năm** | Can của cung vai trò theo năm đang xem | Từng năm cụ thể |

Vai trò của cung (Mệnh, Quan Lộc, Tài Bạch, …) được xác định bằng khoảng cách từ **Mệnh cung đang active**:

```ts
const clickRoleIndex = (selectedCungIndex - activeMenhIndex + 12) % 12;
```

- `activeMenhIndex` là Mệnh cung gốc khi xem tiên thiên, là Mệnh Vận khi xem Đại Vận, là Chi năm khi xem năm.

### 14.3. Tính Can của cung theo năm

Khi xem năm, địa bàn 12 cung được "quay" sao cho cung Tý năm đó trở thành Mệnh năm. Can của mỗi cung theo năm được tính qua `NGU_HO_DON`:

```ts
const NGU_HO_DON: Record<string, Can> = {
  'Giáp': 'Bính', 'Kỷ': 'Bính',
  'Ất': 'Mậu', 'Canh': 'Mậu',
  'Bính': 'Canh', 'Tân': 'Canh',
  'Đinh': 'Nhâm', 'Nhâm': 'Nhâm',
  'Mậu': 'Giáp', 'Quý': 'Giáp',
};
```

Can năm → Can của cung Dần (`canDau`), sau đó tăng dần theo chiều kim đồng hồ qua 12 cung:

```ts
function getYearCanMap(yearCan: Can): Record<number, Can> {
  const canDau = NGU_HO_DON[yearCan];
  const canIndex = CAN.indexOf(canDau);
  const map: Record<number, Can> = {};
  for (let i = 0; i < 12; i++) {
    map[i] = CAN[(canIndex + (i - 2 + 12) % 12) % 10];
  }
  return map;
}
```

### 14.4. Lộc/Kỵ mở rộng

Khi `L1/L2/L3` (hoặc `K1/K2/K3`) của một tầng rơi vào cung có **Hóa Lộc / Hóa Kỵ gốc theo Can năm sinh**, thì trigger thêm một chuỗi Lộc/Kỵ mới từ Can của cung đó.

```ts
function calculateExtendedLocKy(
  startCan: Can,
  palaces: Palace[],
  gocLocPalaces: Set<number>,   // cung có Hóa Lộc gốc
  gocKyPalaces: Set<number>,    // cung có Hóa Kỵ gốc
  getCan: (index: number) => Can,
  maxDepth = 10
) {
  // Tìm L1/K1 của startCan
  // Nếu L1/L2/L3 nằm trong gocLocPalaces → lấy Can của cung trigger
  // → tìm tiếp Kỵ của triggerCan (vì Kỵ sinh Lộc theo quy tắc trong code)
  // → thêm L4, L5, L6, … cho đến khi không còn trigger hoặc gặp vòng lặp
}
```

**Lưu ý quan trọng:** Trong `calculateExtendedLocKy`, logic mở rộng lộc dùng `nextKyStar` (sao Hóa Kỵ của Can trigger), không phải Hóa Lộc. Đây là một quy tắc riêng của code, cần kiểm chứng với thầy/cách tính truyền thống.

### 14.5. Kết luận tổng hợp (độ mạnh Lộc/Kỵ)

Khi một cung đang xem có Lộc/Kỵ xung vào **Mệnh** hoặc **chính cung vai trò đang xem**, code ghi nhận mức độ:

```ts
const score = level - distance + (isMenh ? 0.5 : 0);
```

| Score | Mức Lộc | Mức Kỵ |
|-------|---------|--------|
| ≥ 3.5 | Cực mạnh | Cực nặng |
| ≥ 2.5 | Rất mạnh | Rất nặng |
| ≥ 1.5 | Mạnh | Nặng |
| ≥ 0.5 | Vừa | Vừa |
| < 0.5 | Nhẹ | Nhẹ |

Trong đó:
- `level`: 1, 2, 3 cho L1/L2/L3; 4, 5, 6… cho mở rộng
- `distance`: khoảng cách giữa tầng nguồn và tầng đích (0 = cùng tầng, 1 = liền kề, 2 = cách xa)
- `isMenh`: cộng 0.5 nếu tác động lên Mệnh

### 14.6. Ảnh hưởng Đại Vận bởi Lộc/Kỵ tiên thiên

Khi chọn một cung, code kiểm tra xem trong các Đại Vận, cung Mệnh Vận hoặc cung cùng vai trò với cung đang chọn có rơi vào `L1/L2/L3` hay `K1/K2/K3` của tầng đang active không. Nếu có, highlight số Đại Vận đó.

### 14.7. Xếp hạng năm đẹp/xấu trong Đại Vận

Trong tab **Đại Vận**, code duyệt từng năm trong 10 năm của Đại Vận đang chọn:

1. Tính Can năm và `yearCanMap`
2. Xác định Mệnh năm (`chiIndex`) và vai trò năm (`namRoleIndex`)
3. Tính Lộc/Kỵ của **Đại Vận** và của **năm** đó
4. Cộng điểm cho các tác động Lộc/Kỵ vào Mệnh/Vai trò
5. Phân loại: `very-good`, `good`, `neutral`, `bad`, `very-bad`

Các cặp tác động được xét:
- Đại Vận → Đại Vận (tự xung)
- Đại Vận → Năm
- Năm → Đại Vận
- Năm → Năm (tự xung)

### 14.8. Những điểm cần kiểm tra về Lộc/Kỵ

1. **Cách xác định L2, L3**: code dùng `+6` và `+11`. Truyền thống thường dùng đối cung (`+6`) và lục hợp (`+5` trong 0-based) hoặc lục hại (`+7`). `+11` tương đương `-1`, cần xác nhận đúng ý nghĩa gì.
2. **Mở rộng dùng `nextKyStar`**: tại sao trigger từ Hóa Kỵ chứ không phải Hóa Lộc? Cần đối chiếu với cách tính truyền thống.
3. **Can năm theo `NGU_HO_DON`**: cần kiểm tra Can cung Dần của từng năm có đúng không.
4. **Mệnh năm = Chi năm**: code dùng `chiIndex` của năm làm `activeMenhIndex`. Có nghĩa là Mệnh năm luôn ở cung Tý năm đó — điều này đúng với cách "xem năm" theo Tý làm Mệnh.
5. **Component bị cắt xén**: `TuViBoard.tsx` đã được khôi phục phần đầu nhưng vẫn cần build để kiểm tra lỗi còn sót.

---

## 15. Các vấn đề cần kiểm tra chung

### 15.1. Mệnh Cục

Logic `timCuc` dựa vào `canThangGieng = (canNam1 * 2 + 1) % 10` rồi tìm Can của tháng tại Mệnh cung. Cần đối chiếu với Python để đảm bảo không nhầm lẫn 0-based/1-based, đặc biệt chỗ normalize `% 12` và `% 10`.

### 15.2. Tử Vi

Cần kiểm tra nhiều ngày sinh khác nhau, đặc biệt ngày lớn (gần 30) và các cục khác nhau.

### 15.3. Sao phụ

Hiện chỉ có 3 sao phụ: Lộc Tồn, Văn Khúc, Văn Xương. Các sao phụ khác trong `PHU_TINH` chưa được an.

### 15.4. Chất lượng sao (`quality`)

Type `Star` có trường `quality` (+1 miếu vượng, -1 hãm địa) nhưng hiện code chưa tính toán giá trị này.

### 15.5. Build

`src/components/TuViBoard.tsx` từng bị cắt xén ở đầu file. Cần chạy `npm run build` để kiểm tra lỗi compile còn sót.

---

## 16. Cách validate

Dùng script Python tham chiếu:

```bash
python temp_check.py
python temp_validate.py
```

Nên kiểm tra ít nhất 2–3 ngày sinh khác nhau (nam/nữ, tháng nhuận, giờ khác nhau) và đối chiếu kết quả Mệnh cung, Thân cung, vị trí Tử Vi, Đại Vận, Tiểu Hạn.

---

## 17. Tóm tắt các file

| File | Nhiệm vụ |
|------|----------|
| `src/types/tuVi.ts` | Định nghĩa type: Can, Chi, CungName, Star, Palace, TuViChart |
| `src/data/constants.ts` | Hằng số: CAN, CHI, CUNG_NAMES, NAP_AM, MENH_CUC, CHINH_TINH, TU_HOA_TABLE, PHU_TINH |
| `src/utils/calendar.ts` | Dương lịch → âm lịch |
| `src/utils/canChi.ts` | Can Chi năm/tháng/ngày/giờ |
| `src/utils/palaceCalc.ts` | Mệnh cung, Thân cung, Mệnh Cục, Tử Vi, Đại Vận, Tiểu Hạn, Âm Dương |
| `src/utils/starPlacement.ts` | An 14 chính tinh + Lộc Tồn/Văn Khúc/Văn Xương |
| `src/utils/tuHoa.ts` | Áp Tứ Hóa theo Can năm |
| `src/utils/chartBuilder.ts` | Ghép tất cả thành `TuViChart` |
| `src/components/TuViBoard.tsx` | Render bảng 12 cung + logic phân tích Lộc/Kỵ tiên thiên / Đại Vận / Năm |
| `src/components/Palace.tsx` | Render một cung, hiển thị badge Lộc/Kỵ, Mệnh Vận, Mệnh năm |
