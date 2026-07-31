# Tổng hợp số liệu Phòng Y tế — phiên bản toàn màn hình

## Kiến trúc
- GitHub Pages chỉ chứa `index.html` và hiển thị toàn bộ Web App Apps Script dạng toàn màn hình.
- Apps Script chứa toàn bộ giao diện, đăng ký, đăng nhập, quên mật khẩu, nhập liệu, báo cáo, nhật ký và quản trị.
- Google Sheet là cơ sở dữ liệu tập trung.

## Cài đặt
1. Dán đè toàn bộ `Code.gs` vào Apps Script.
2. Chạy `setupSheets()`.
3. Chạy `authorizeMailService()` một lần để cấp quyền gửi mã quên mật khẩu.
4. Triển khai Web App: thực thi dưới dạng **Tôi**, truy cập **Bất kỳ ai**.
5. Nếu URL `/exec` thay đổi, sửa thuộc tính `src` của thẻ `iframe` trong `index.html`.
6. Trên GitHub chỉ cần dán đè `index.html` mới.

## Đồng bộ
- Sau khi lưu số liệu, màn hình tự tải dữ liệu mới ngay.
- Các máy khác tự kiểm tra dữ liệu mới mỗi 10 giây.
- Apps Script không hỗ trợ WebSocket; đây là cơ chế gần thời gian thực phù hợp nhất với Google Sheet + Apps Script.
