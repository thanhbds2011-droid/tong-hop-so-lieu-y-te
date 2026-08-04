# Tổng hợp số liệu Phòng Y tế — V6.4.1

Phiên bản 6.4.1 giữ nguyên kiến trúc:

1. **GitHub Pages/PWA** làm cổng truy cập.
2. **Google Apps Script Web App** xử lý giao diện và nghiệp vụ.
3. **Google Sheet** lưu dữ liệu tập trung.

## Nghiệp vụ số liệu

Ứng dụng có hai luồng rõ ràng:

### 1. Bổ sung số phát sinh

- Nhập số phát sinh mới.
- Hệ thống cộng vào tổng đang lưu.
- Số bổ sung phải là số nguyên lớn hơn 0.
- Chỉ các chỉ tiêu vừa nhập mới được cập nhật.
- Có kiểm tra phiên bản để tránh ghi đè khi dữ liệu vừa được cập nhật ở thiết bị khác.

### 2. Điều chỉnh số đã lưu

Tại mỗi chỉ tiêu đã có dữ liệu, chọn **Điều chỉnh** để:

- Tăng hoặc giảm tổng đang lưu, ví dụ từ 30 thành 10 hoặc 40.
- Nhập `0` nếu cần đưa số liệu của chỉ tiêu trong ngày về 0.
- Bắt buộc nhập lý do ít nhất 5 ký tự.
- Lưu giá trị trước, giá trị sau, lý do, người thực hiện và thời gian.

Không có nút xóa riêng. Giá trị `0` vẫn được giữ ở trạng thái `Hoạt động`, giúp tiếp tục điều chỉnh hoặc bổ sung lại thuận tiện.

## Lịch sử truy vết

Phiên bản này bổ sung sheet:

```text
LỊCH SỬ SỐ LIỆU
```

Các cột gồm:

- ID lịch sử
- Thời gian
- ID dữ liệu
- Ngày số liệu
- Mã chỉ tiêu
- Tên chỉ tiêu
- Thao tác
- Giá trị trước
- Giá trị sau
- Ghi chú trước
- Ghi chú sau
- Lý do
- Tài khoản
- Họ và tên
- Vai trò

Sheet `NHẬT KÝ` hiện hữu vẫn được giữ nguyên và tiếp tục ghi hoạt động. Nhật ký không hiển thị trên giao diện.

## Nguyên tắc bảo toàn dữ liệu

- Không xóa sheet hiện hữu.
- Không xóa cột hiện hữu.
- Không xóa vật lý bản ghi số liệu; điều chỉnh về 0 khi cần.
- Cột hoặc sheet mới chỉ được bổ sung khi còn thiếu.
- Dữ liệu cùng ngày và mã chỉ tiêu tiếp tục cập nhật tại dòng hiện hữu.

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
2. Sao chép toàn bộ `apps-script/Code.gs` và dán đè vào dự án Apps Script.
3. Lưu mã.
4. Chạy thủ công `initializeApplication()` một lần.
5. Chọn **Triển khai → Quản lý quá trình triển khai → Chỉnh sửa**.
6. Chọn **Phiên bản mới** và triển khai lại Web App.

`initializeApplication()` chỉ tạo sheet/cột còn thiếu; không xóa dữ liệu.

## Cập nhật GitHub Pages

1. Tải toàn bộ nội dung thư mục này lên thư mục gốc repository.
2. Kiểm tra `APPS_SCRIPT_URL` trong `app-config.js`.
3. Chờ GitHub Actions triển khai hoàn tất.
4. Mở ứng dụng và nhấn `Ctrl + F5` để nhận cache V6.4.1.

## Nghiệm thu nhanh

- Bổ sung 1 vào tổng 30 cho kết quả 31.
- Chọn **Điều chỉnh**, nhập tổng mới 10 và lý do; kết quả còn 10.
- Chọn **Điều chỉnh**, nhập `0` và lý do; chỉ tiêu được đưa về 0.
- Sau khi đưa về 0, có thể tiếp tục bổ sung hoặc điều chỉnh bình thường.
- Điều chỉnh không thành công nếu dữ liệu vừa bị người khác thay đổi.
- Sheet `LỊCH SỬ SỐ LIỆU` có đủ giá trị trước, sau, lý do và người thực hiện.
- Dữ liệu, tài khoản và các sheet cũ vẫn còn nguyên.
