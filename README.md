# Tổng hợp số liệu Phòng Y tế — Google Sheet

## Cấu trúc
- `index.html`, `styles.css`, `app.js`: dán đè toàn bộ repository GitHub Pages.
- `apps-script/Code.gs`, `apps-script/Index.html`: dán vào dự án Apps Script gắn với Google Sheet.

## Thiết lập nhanh
1. Mở Google Sheet → Tiện ích mở rộng → Apps Script.
2. Dán đè `Code.gs`, tạo file HTML tên `Index` và dán `Index.html`.
3. Chạy hàm `setupSheets()` một lần và cấp quyền.
4. Vào sheet `NGƯỜI DÙNG`, thêm email theo 5 cột: Email | Họ tên | Vai trò | Được nhập liệu | Trạng thái.
5. Giá trị hợp lệ: `TRUE` và `Hoạt động`.
6. Triển khai Apps Script thành Web App. Dùng URL kết thúc bằng `/exec`.
7. Nếu URL mới khác URL có sẵn, sửa duy nhất hằng số `APPS_SCRIPT_URL` ở đầu `app.js`.
8. Dán đè 4 file GitHub và chờ GitHub Pages cập nhật.

## Quyền sử dụng
- GitHub Pages: ai có đường link đều được xem dữ liệu.
- Trang Apps Script: chỉ email có trong sheet `NGƯỜI DÙNG` mới nhập được.
- Không còn localStorage và không còn dữ liệu mẫu cứng trong GitHub.
