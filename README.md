# Tổng hợp số liệu Phòng Y tế — V6.7.0

Kiến trúc được giữ nguyên:

- GitHub Pages làm khung PWA.
- Google Apps Script xử lý giao diện và nghiệp vụ.
- Google Sheet lưu dữ liệu tập trung.

## Nội dung V6.7.0

- Bỏ thời gian “Đã đồng bộ/Cập nhật lúc” khỏi Tổng quan.
- Bỏ bốn thẻ dashboard thống kê; Tổng quan tập trung vào bộ lọc và danh sách chỉ tiêu.
- Không hiển thị thông báo thành công kỹ thuật “Dữ liệu đã sẵn sàng” hoặc “Danh sách đã sẵn sàng”.
- Quản trị được tách thành hai thẻ: Tài khoản và Chỉ tiêu.
- Quản trị viên có thể thêm, sửa, ngừng sử dụng và khôi phục chỉ tiêu.
- Mã chỉ tiêu được tự tạo từ tên nếu để trống; mã được khóa sau khi tạo để bảo toàn liên kết lịch sử.
- Xóa chỉ tiêu là xóa mềm: chỉ chuyển sang “Ngừng sử dụng”; số liệu lịch sử không bị xóa.

## Cập nhật

1. Dán đè toàn bộ `apps-script/Code.gs` vào dự án Apps Script.
2. Triển khai một phiên bản Web App mới nhưng giữ nguyên deployment `/exec` hiện tại.
3. Tải toàn bộ tệp GitHub lên thư mục gốc repository và ghi đè bản cũ.
4. Nhấn `Ctrl + F5`, hoặc đóng/mở lại PWA để nhận cache V6.7.0.

Không cần chạy lại `initializeApplication()` nếu các sheet hiện tại đã hoạt động bình thường.
