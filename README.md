# Tổng hợp số liệu Phòng Y tế — V6.3.1

> Bản 6.3.1 chỉ cho phép **bổ sung số phát sinh**; chức năng chỉnh sửa tổng đã bị loại bỏ ở cả giao diện và backend. Mục Nhật ký đã được bỏ khỏi giao diện, nhưng hệ thống vẫn ghi nhật ký nội bộ trong Google Sheet để bảo toàn truy vết.

Ứng dụng giữ nguyên ba lớp kiến trúc:

1. **GitHub Pages/PWA** làm cổng truy cập.
2. **Google Apps Script Web App** xử lý giao diện và nghiệp vụ.
3. **Google Sheet** lưu dữ liệu hiện hữu.

## Điểm hoàn thiện của V6.3.1

- Tổng quan được rút gọn, bỏ nhãn “Dữ liệu tập trung”.
- Hiển thị lời chào theo họ tên tài khoản đang đăng nhập.
- Nhập liệu chuyển sang giao diện danh sách/bảng gọn trên máy tính và thẻ trên điện thoại.
- Chế độ **Bổ sung trong ngày** hiển thị trước tổng sau khi lưu.
- Chế độ **Chỉnh sửa tổng** được phân biệt rõ và vẫn giữ chống ghi đè bằng phiên bản dữ liệu.
- Dữ liệu ngày hiện tại được nạp cùng phiên đăng nhập/khôi phục phiên và lưu trong bộ nhớ đệm.
- Bấm **Nhập liệu** hiển thị ngay, không bật lớp tải toàn màn hình.
- Đổi ngày hoặc làm mới dữ liệu chỉ hiển thị trạng thái tải nhỏ ngay trong khu vực nhập liệu.
- Tìm kiếm chỉ tiêu không làm mất nội dung đang nhập.
- Nhật ký chỉ dành cho Quản trị; bỏ tiêu đề lặp, giữ chức năng truy vết.
- Quản trị bỏ tiêu đề “Quản lý tài khoản”, dùng thanh công cụ gọn, tìm kiếm và bộ nhớ đệm.
- Chỉ hiện hướng dẫn quên mật khẩu khi thực sự có yêu cầu chờ duyệt.
- Giữ nguyên khóa/mở khóa, cấp/hạ quyền, xóa mềm và duyệt mật khẩu tạm.
- Không xóa sheet, cột hoặc dữ liệu hiện hữu; cột thiếu chỉ được thêm ở cuối.

## Cấu trúc bàn giao

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

## Cập nhật Apps Script

1. Sao lưu `Code.gs` đang dùng.
2. Mở `apps-script/Code.gs`, sao chép toàn bộ và dán đè vào dự án Apps Script.
3. Lưu mã và chạy thủ công `initializeApplication()` một lần.
4. Chọn **Triển khai → Quản lý quá trình triển khai → Chỉnh sửa**.
5. Chọn **Phiên bản mới** và triển khai lại Web App.
6. Giữ nguyên URL `/exec` nếu cập nhật deployment hiện tại.

`initializeApplication()` chỉ tạo sheet/cột còn thiếu và không xóa dữ liệu.

## Cập nhật GitHub Pages

1. Tải toàn bộ nội dung thư mục này lên thư mục gốc repository.
2. Kiểm tra `APPS_SCRIPT_URL` trong `app-config.js`.
3. Vào **Settings → Pages**, chọn nguồn **GitHub Actions**.
4. Chờ workflow `Deploy GitHub Pages` hoàn tất.
5. Mở ứng dụng và nhấn `Ctrl + F5` để nhận cache V6.3.1.

## Nghiệm thu nhanh

- Nhập liệu mở tức thời sau đăng nhập.
- Tìm kiếm chỉ tiêu không xóa nội dung chưa lưu.
- Bổ sung hiển thị đúng “đã lưu + số nhập”.
- Chỉnh sửa tổng chỉ cập nhật mục được thay đổi.
- Tài khoản Nhập liệu không thấy Nhật ký và Quản trị.
- Quản trị viên xem được Nhật ký, quản lý tài khoản và duyệt quên mật khẩu.
- Dữ liệu cũ trong Google Sheet không bị xóa hoặc đổi cấu trúc.
