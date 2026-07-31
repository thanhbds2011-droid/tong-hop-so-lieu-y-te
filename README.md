# Tổng hợp số liệu Phòng Y tế — bản tài khoản tự đăng ký

## Thành phần
- `Code.gs`: dán đè toàn bộ Apps Script. HTML đăng ký/đăng nhập/nhập liệu đã gộp trong file này.
- `index.html`, `styles.css`, `app.js`: dán đè vào GitHub Pages.

## Cấu hình duy nhất
Trong `app.js`, thay `DAN_URL_APPS_SCRIPT_EXEC_VAO_DAY` bằng URL Apps Script kết thúc `/exec`.

## Triển khai Apps Script
- Thực thi dưới dạng: **Tôi**.
- Người có quyền truy cập: **Bất kỳ ai**.
- Chạy `setupSheets()` một lần trước khi triển khai.

## Tài khoản
Người dùng tự đăng ký bằng họ tên, tài khoản và mật khẩu. Mật khẩu được băm SHA-256 với muối riêng; không lưu mật khẩu chữ rõ. Tài khoản mới mặc định ở trạng thái `Hoạt động`. Quản trị viên có thể đổi cột Trạng thái thành `Khóa` để chặn đăng nhập.

## Dữ liệu
Dữ liệu nhập theo ngày và được tổng hợp theo ngày, khoảng ngày, tháng, quý, năm. Bộ lọc khoảng ngày hỗ trợ tối đa 3 năm trong một lần tra cứu.
