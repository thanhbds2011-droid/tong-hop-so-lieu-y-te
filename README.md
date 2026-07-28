# Tổng hợp số liệu Phòng Y tế

Ứng dụng tĩnh chạy trên GitHub Pages, dùng để nhập, tra cứu và tự động tổng hợp số liệu tháng, quý, 6 tháng, năm.

## Chức năng
- Nhập/cập nhật số liệu theo tháng.
- Tra cứu từng chỉ tiêu.
- Tự cộng Quý I, Quý II, 6 tháng và cả năm.
- Dashboard chỉ tiêu chính.
- Nhật ký cập nhật.
- Xuất CSV mở bằng Excel.
- Có sẵn dữ liệu mẫu năm 2026 lấy từ bảng Excel ban đầu.

## Chạy thử
Mở `index.html` bằng trình duyệt hoặc dùng GitHub Pages.

## Lưu ý dữ liệu
Phiên bản đầu lưu dữ liệu bằng `localStorage` trên trình duyệt. Dữ liệu chỉ tồn tại trên thiết bị đang nhập. Giai đoạn tiếp theo nên kết nối Firebase Firestore để nhiều máy cùng sử dụng và đồng bộ dữ liệu.

## Đưa lên GitHub Pages
1. Tạo repository mới, ví dụ `tong-hop-so-lieu-y-te`.
2. Upload toàn bộ các file trong thư mục này vào nhánh `main`.
3. Vào **Settings → Pages**.
4. Chọn **Deploy from a branch**.
5. Chọn nhánh `main`, thư mục `/ (root)`, rồi Save.
