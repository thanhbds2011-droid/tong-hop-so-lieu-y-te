# Tổng hợp số liệu Phòng Y tế — V6.2.0

Ứng dụng sử dụng ba lớp:

1. **GitHub Pages/PWA** làm cổng truy cập.
2. **Google Apps Script Web App** xử lý giao diện và nghiệp vụ.
3. **Google Sheet** lưu dữ liệu tập trung.

## Nội dung đã hoàn thiện

- Bỏ hoàn toàn mục Báo cáo và xuất CSV.
- Tài khoản Nhập liệu chỉ thấy **Tổng quan** và **Nhập liệu**.
- Chỉ tài khoản Quản trị thấy **Nhật ký** và **Quản trị**.
- Backend bắt buộc kiểm tra quyền Quản trị khi đọc nhật ký hoặc quản lý tài khoản.
- Nhật ký ghi thêm vai trò, đăng nhập và đăng xuất.
- Quản trị viên có thể khóa, mở khóa, đổi vai trò và xóa mềm tài khoản.
- Quy trình quên mật khẩu chuyển sang yêu cầu chờ Quản trị viên xác nhận.
- Sau khi duyệt, mật khẩu tạm chỉ hiển thị một lần và người dùng bị buộc đổi mật khẩu.
- Trang Tổng quan hiển thị `Xin chào, Họ và tên`.
- Không còn thông báo `Đăng nhập thành công`.
- Giao diện Quản trị hiển thị đúng trạng thái đang tải.
- Giữ nguyên cơ chế nhập bổ sung, chỉnh sửa tổng, chống ghi đè và `LockService`.

## Cấu trúc

```text
.
├── .github/workflows/deploy-pages.yml
├── apps-script/Code.gs
├── assets/
├── .nojekyll
├── app-config.js
├── app.js
├── index.html
├── manifest.webmanifest
├── offline.html
├── robots.txt
├── service-worker.js
└── styles.css
```

## Cập nhật Google Apps Script

1. Mở dự án Apps Script hiện tại.
2. Sao lưu mã cũ.
3. Mở `apps-script/Code.gs`, sao chép toàn bộ và dán đè vào `Code.gs` của dự án.
4. Chạy thủ công hàm `initializeApplication()` một lần và cấp quyền khi Google yêu cầu.
5. Hàm này chỉ tạo sheet/cột còn thiếu; không xóa dữ liệu hiện hữu.
6. Chọn **Triển khai → Quản lý quá trình triển khai → Chỉnh sửa**.
7. Chọn **Phiên bản mới** và triển khai lại Web App.
8. Giữ nguyên URL `/exec` nếu chỉnh sửa deployment hiện tại.

Các cột mới được thêm ở cuối sheet `NGƯỜI DÙNG`:

- Yêu cầu đổi mật khẩu
- Thời gian yêu cầu
- Trạng thái yêu cầu
- Người xác nhận
- Thời gian xác nhận

Sheet `NHẬT KÝ` được thêm cột `Vai trò` ở cuối.

## Cập nhật GitHub Pages

1. Tải toàn bộ nội dung thư mục này lên thư mục gốc repository.
2. Kiểm tra `APPS_SCRIPT_URL` trong `app-config.js` vẫn là URL `/exec` đúng.
3. Vào **Settings → Pages → Source**, chọn **GitHub Actions**.
4. Mở thẻ **Actions** và đợi workflow `Deploy GitHub Pages` hoàn tất.
5. Sau khi triển khai, nhấn `Ctrl + F5` để bỏ cache cũ.

Workflow dùng các action theo mẫu GitHub Pages: `checkout@v6`, `configure-pages@v5`, `upload-pages-artifact@v4`, `deploy-pages@v4`.

## Kiểm tra nghiệm thu

- Tài khoản Nhập liệu không thấy Nhật ký và Quản trị.
- Quản trị viên thấy đủ bốn mục Tổng quan, Nhật ký, Nhập liệu, Quản trị.
- Người dùng gửi yêu cầu quên mật khẩu; Quản trị viên thấy trạng thái Chờ duyệt.
- Quản trị viên xác nhận và nhận mật khẩu tạm một lần.
- Người dùng đăng nhập bằng mật khẩu tạm nhưng chưa thể nhập dữ liệu cho đến khi đổi mật khẩu.
- Xóa tài khoản không làm mất nhật ký hoặc dữ liệu đã nhập.
