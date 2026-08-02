/**
 * CẤU HÌNH DUY NHẤT CẦN THAY ĐỔI
 *
 * 1. Triển khai Apps Script dưới dạng Web App.
 * 2. Sao chép URL kết thúc bằng /exec.
 * 3. Dán URL đó vào APPS_SCRIPT_URL bên dưới.
 *
 * Không đặt mật khẩu, token hoặc thông tin bí mật trong tệp này vì mã nguồn
 * GitHub Pages là công khai. URL Web App không phải là thông tin bí mật.
 */
window.YTE_APP_CONFIG = Object.freeze({
  APP_NAME: 'Tổng hợp số liệu Phòng Y tế',
  ORGANIZATION: 'Trung tâm Bảo trợ xã hội Tân Hiệp',
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbx0BHA-P1sAuGXEtrQatvEsMXMn3d7Pb024mCbu9tRTvaAr0xdy_cA0GPvJ_kFne6dOgw/exec',
  LOAD_TIMEOUT_MS: 30000,
  VERSION: '6.2.1'
});
