# CHANGELOG 10.0.6

## Sửa lỗi
- Sửa lỗi `permission_denied` khi thêm/sửa/xóa người ở Điều trị lao / Chuyển Trung tâm do Rules nhận dạng chỉ tiêu theo tên hiển thị phân biệt hoa thường.
- Bổ sung Rules patch nhận dạng theo mã chỉ tiêu ổn định, đồng thời giữ fallback tên legacy.
- Sửa lỗi version mirror: private `soLieuTheoNgay` và public `congKhai/soLieuTheoNgay` nay tăng version độc lập theo version hiện có của từng path.
- Thông báo lỗi Firebase chính xác hơn, không mặc định mọi `permission_denied` đều là thiếu quyền tài khoản.

## Không thay đổi
- Source of Truth Chuyển viện/Tử vong.
- Hành trình chuyển viện.
- Phân quyền role.
- OneSignal / Apps Script Gateway.
- Dữ liệu HSBA.
