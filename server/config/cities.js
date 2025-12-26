/**
 * Danh sách thành phố chuẩn cho hệ thống đặt vé xe khách
 * Sử dụng tên tiếng Việt có dấu chính thống
 */

export const VIETNAM_CITIES = [
  // Miền Bắc
  'Hà Nội',
  'Hải Phòng',
  'Hạ Long',
  'Ninh Bình',
  'Hải Dương',
  'Bắc Ninh',
  'Bắc Giang',
  'Lạng Sơn',
  'Sapa',
  'Lào Cai',
  'Yên Bái',
  'Thái Nguyên',
  'Vinh',
  'Thanh Hóa',

  // Miền Trung
  'Đông Hới',
  'Huế',
  'Đà Nẵng',
  'Hội An',
  'Tam Kỳ',
  'Quảng Ngãi',
  'Quy Nhơn',
  'Tuy Hòa',
  'Nha Trang',
  'Cam Ranh',
  'Phan Rang',
  'Phan Thiết',

  // Miền Nam
  'Hồ Chí Minh',
  'Biên Hòa',
  'Vũng Tàu',
  'Đà Lạt',
  'Bảo Lộc',
  'Mỹ Tho',
  'Vĩnh Long',
  'Cần Thơ',
  'Sóc Trăng',
  'Cà Mau',
  'Rạch Giá',
  'Hà Tiên',
  'Long Xuyên',
  'Châu Đốc',
];

/**
 * Helper function to validate if a city name exists in the standard list
 * @param {string} cityName - Name of the city to validate
 * @returns {boolean} - True if city exists in standard list
 */
export function isValidCity(cityName) {
  return VIETNAM_CITIES.includes(cityName);
}

/**
 * Helper function to get city suggestion if name is slightly different
 * @param {string} cityName - Name of the city
 * @returns {string|null} - Suggested city name or null
 */
export function getCitySuggestion(cityName) {
  const normalized = cityName.toLowerCase().trim();

  const cityMap = {
    hanoi: 'Hà Nội',
    'ha noi': 'Hà Nội',
    'hai phong': 'Hải Phòng',
    haiphong: 'Hải Phòng',
    'ha long': 'Hạ Long',
    halong: 'Hạ Long',
    'ho chi minh': 'Hồ Chí Minh',
    'ho chi minh city': 'Hồ Chí Minh',
    hcm: 'Hồ Chí Minh',
    saigon: 'Hồ Chí Minh',
    'sài gòn': 'Hồ Chí Minh',
    'da nang': 'Đà Nẵng',
    danang: 'Đà Nẵng',
    hue: 'Huế',
    'nha trang': 'Nha Trang',
    nhatrang: 'Nha Trang',
    'vung tau': 'Vũng Tàu',
    vungtau: 'Vũng Tàu',
    'da lat': 'Đà Lạt',
    dalat: 'Đà Lạt',
    'can tho': 'Cần Thơ',
    cantho: 'Cần Thơ',
    'bien hoa': 'Biên Hòa',
    bienhoa: 'Biên Hòa',
    'my tho': 'Mỹ Tho',
    mytho: 'Mỹ Tho',
    'vinh long': 'Vĩnh Long',
    vinhlong: 'Vĩnh Long',
    'bao loc': 'Bảo Lộc',
    baoloc: 'Bảo Lộc',
    'dong hoi': 'Đông Hới',
    donghoi: 'Đông Hới',
  };

  return cityMap[normalized] || null;
}

export default VIETNAM_CITIES;
