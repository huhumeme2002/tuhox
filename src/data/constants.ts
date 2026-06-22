import type { Can, Chi, CungName } from '../types/tuVi';

export const CAN: Can[] = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];

export const CHI: Chi[] = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];

// Thứ tự 12 cung theo chiều kim đồng hồ, bắt đầu từ Mệnh
export const CUNG_NAMES: CungName[] = [
  'Mệnh',
  'Phụ Mẫu',
  'Phúc Đức',
  'Điền Trạch',
  'Quan Lộc',
  'Nô Bộc',
  'Thiên Di',
  'Tật Ách',
  'Tài Bạch',
  'Tử Tức',
  'Phu Thê',
  'Huynh Đệ',
];

// Ngũ hành nạp âm của 60 hoa giáp
export const NAP_AM: Record<string, string> = {
  'Giáp Tý': 'Hải Trung Kim',
  'Ất Sửu': 'Hải Trung Kim',
  'Bính Dần': 'Lư Trung Hỏa',
  'Đinh Mão': 'Lư Trung Hỏa',
  'Mậu Thìn': 'Đại Lâm Mộc',
  'Kỷ Tỵ': 'Đại Lâm Mộc',
  'Canh Ngọ': 'Lộ Bàng Thổ',
  'Tân Mùi': 'Lộ Bàng Thổ',
  'Nhâm Thân': 'Kiếm Phong Kim',
  'Quý Dậu': 'Kiếm Phong Kim',
  'Giáp Tuất': 'Sơn Đầu Hỏa',
  'Ất Hợi': 'Sơn Đầu Hỏa',
  'Bính Tý': 'Giải Thủy',
  'Đinh Sửu': 'Giải Thủy',
  'Mậu Dần': 'Thành Đầu Thổ',
  'Kỷ Mão': 'Thành Đầu Thổ',
  'Canh Thìn': 'Bạch Lạp Kim',
  'Tân Tỵ': 'Bạch Lạp Kim',
  'Nhâm Ngọ': 'Dương Liễu Mộc',
  'Quý Mùi': 'Dương Liễu Mộc',
  'Giáp Thân': 'Tuyền Trung Thủy',
  'Ất Dậu': 'Tuyền Trung Thủy',
  'Bính Tuất': 'Ốc Thượng Thổ',
  'Đinh Hợi': 'Ốc Thượng Thổ',
  'Mậu Tý': 'Tích Lịch Hỏa',
  'Kỷ Sửu': 'Tích Lịch Hỏa',
  'Canh Dần': 'Tùng Bách Mộc',
  'Tân Mão': 'Tùng Bách Mộc',
  'Nhâm Thìn': 'Trường Lưu Thủy',
  'Quý Tỵ': 'Trường Lưu Thủy',
  'Giáp Ngọ': 'Sa Trung Kim',
  'Ất Mùi': 'Sa Trung Kim',
  'Bính Thân': 'Sơn Hạ Hỏa',
  'Đinh Dậu': 'Sơn Hạ Hỏa',
  'Mậu Tuất': 'Bình Địa Mộc',
  'Kỷ Hợi': 'Bình Địa Mộc',
  'Canh Tý': 'Bích Thượng Thổ',
  'Tân Sửu': 'Bích Thượng Thổ',
  'Nhâm Dần': 'Kim Bạc Kim',
  'Quý Mão': 'Kim Bạc Kim',
  'Giáp Thìn': 'Phú Đăng Hỏa',
  'Ất Tỵ': 'Phú Đăng Hỏa',
  'Bính Ngọ': 'Thiên Hà Thủy',
  'Đinh Mùi': 'Thiên Hà Thủy',
  'Mậu Thân': 'Đại Trạch Thổ',
  'Kỷ Dậu': 'Đại Trạch Thổ',
  'Canh Tuất': 'Thoa Xuyến Kim',
  'Tân Hợi': 'Thoa Xuyến Kim',
  'Nhâm Tý': 'Tang Đố Mộc',
  'Quý Sửu': 'Tang Đố Mộc',
  'Giáp Dần': 'Đại Khê Thủy',
  'Ất Mão': 'Đại Khê Thủy',
  'Bính Thìn': 'Sa Trung Thổ',
  'Đinh Tỵ': 'Sa Trung Thổ',
  'Mậu Ngọ': 'Thiên Thượng Hỏa',
  'Kỷ Mùi': 'Thiên Thượng Hỏa',
  'Canh Thân': 'Thạch Lựu Mộc',
  'Tân Dậu': 'Thạch Lựu Mộc',
  'Nhâm Tuất': 'Đại Hải Thủy',
  'Quý Hợi': 'Đại Hải Thủy',
};

// Mệnh cục theo ngũ hành nạp âm (số năm sinh cách tính)
export const MENH_CUC: Record<string, string> = {
  'Kim': 'Kim Tứ Cục',
  'Mộc': 'Mộc Tam Cục',
  'Thủy': 'Thủy Nhị Cục',
  'Hỏa': 'Hỏa Lục Cục',
  'Thổ': 'Thổ Ngũ Cục',
};

// 14 chính tinh theo thứ tự vòng sao chính
export const CHINH_TINH = [
  'Tử Vi',
  'Thiên Cơ',
  'Thái Dương',
  'Vũ Khúc',
  'Thiên Đồng',
  'Liêm Trinh',
  'Thiên Phủ',
  'Thái Âm',
  'Tham Lang',
  'Cự Môn',
  'Thiên Tướng',
  'Thiên Lương',
  'Thất Sát',
  'Phá Quân',
];

// Màu theo ngũ hành sao (để hiển thị)
export const STAR_COLORS: Record<string, string> = {
  'Tử Vi': '#8B0000',
  'Thiên Cơ': '#2E7D32',
  'Thái Dương': '#D32F2F',
  'Vũ Khúc': '#F9A825',
  'Thiên Đồng': '#2E7D32',
  'Liêm Trinh': '#D32F2F',
  'Thiên Phủ': '#F9A825',
  'Thái Âm': '#F57C00',
  'Tham Lang': '#2E7D32',
  'Cự Môn': '#1976D2',
  'Thiên Tướng': '#A52A2A',
  'Thiên Lương': '#2E7D32',
  'Thất Sát': '#D32F2F',
  'Phá Quân': '#1976D2',
  'Văn Xương': '#6A1B9A',
  'Văn Khúc': '#0D47A1',
};

// Bảng Tứ Hóa theo Can năm
// Mỗi Can: [Hóa Lộc, Hóa Quyền, Hóa Khoa, Hóa Kỵ]
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

// Các sao phụ cơ bản hay dùng trong lá số Tứ Hóa
export const PHU_TINH = [
  'Văn Xương',
  'Văn Khúc',
  'Tả Phù',
  'Hữu Bật',
  'Thiên Mã',
  'Hồng Loan',
  'Thiên Hỷ',
  'Không Vong',
  'Địa Không',
  'Địa Kiếp',
];
