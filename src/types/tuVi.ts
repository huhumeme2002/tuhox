export type Can = 'Giáp' | 'Ất' | 'Bính' | 'Đinh' | 'Mậu' | 'Kỷ' | 'Canh' | 'Tân' | 'Nhâm' | 'Quý';

export type Chi = 'Tý' | 'Sửu' | 'Dần' | 'Mão' | 'Thìn' | 'Tỵ' | 'Ngọ' | 'Mùi' | 'Thân' | 'Dậu' | 'Tuất' | 'Hợi';

export type CungName =
  | 'Mệnh'
  | 'Phụ Mẫu'
  | 'Phúc Đức'
  | 'Điền Trạch'
  | 'Quan Lộc'
  | 'Nô Bộc'
  | 'Thiên Di'
  | 'Tật Ách'
  | 'Tài Bạch'
  | 'Tử Tức'
  | 'Phu Thê'
  | 'Huynh Đệ';

export type StarType = 'chinh' | 'phu' | 'tuHoa';

export interface Star {
  name: string;
  type: StarType;
  // +1: vượng địa / miếu vượng, -1: hãm địa, 0: bình hòa
  quality?: number;
  // Nếu là sao Tứ Hóa, loại nào (Lộc, Quyền, Khoa, Kỵ)
  tuHoa?: 'Hóa Lộc' | 'Hóa Quyền' | 'Hóa Khoa' | 'Hóa Kỵ';
}

export interface Palace {
  index: number; // 0-11
  name: CungName;
  can: Can;
  chi: Chi;
  isMenh?: boolean;
  isThan?: boolean;
  // Cung này là cung mệnh hay cung thân
  daiVan?: number; // Đại vận (tuổi bắt đầu 10 năm hạn)
  stars: Star[];
}

export interface TuViChart {
  name: string;
  birthDate: string;
  lunarDate: { day: number; month: number; year: number; leap: boolean };
  canChi: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
  menhCung: { label: string; chi: Chi; position: string };
  thanCung: { label: string; chi: Chi; position: string };
  amDuong: string;
  menhCuc: string;
  palaces: Palace[];
}

export interface BirthInput {
  name: string;
  birthDate: string; // YYYY-MM-DD
  birthTime: string; // HH:mm
  gender: 'Nam' | 'Nữ';
}
