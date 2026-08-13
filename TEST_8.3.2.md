# TEST 8.3.2

## Kết quả kiểm tra tĩnh

- `app.js`: JavaScript syntax OK.
- `journeys.js`: JavaScript syntax OK.
- `reports.js`: JavaScript syntax OK.
- `ui-fixes.js`: JavaScript syntax OK.
- `update-manager.js`: JavaScript syntax OK.
- `service-worker.js`: JavaScript syntax OK.
- `version.json`, manifest và Firebase Rules: JSON hợp lệ.
- 243 DOM ID, không có ID trùng.
- Các DOM ID được `app.js`, `journeys.js`, `reports.js` tham chiếu đều tồn tại, ngoại trừ `navHome` là tham chiếu tương thích cũ có null-check.
- CSS braces cân bằng.
- Tất cả tệp trong `APP_SHELL` của Service Worker tồn tại.
- Firebase Realtime Database Rules giống byte-for-byte với v8.3.1.

## Nghiệp vụ thay đổi

### Nhập liệu
- Không còn bảng hiển thị toàn bộ danh mục chưa nhập.
- Có nút `+ Nhập số liệu`.
- Dropdown lấy trực tiếp danh mục chỉ tiêu hiện hành.
- Chọn chỉ tiêu sẽ hiện Đơn vị + Số liệu hiện tại + ô nhập số.
- Cho phép ghi nhận 0.
- Nếu chỉ tiêu đã có số liệu, form nhanh cho phép cập nhật giá trị hiện tại và sử dụng `expectedVersion` hiện hữu để kiểm soát xung đột.
- Sau khi lưu, danh sách chỉ hiện các chỉ tiêu đã ghi nhận.
- Realtime listener hiện hữu tiếp tục cập nhật `dailyByCode` giữa nhiều máy.
- Dữ liệu người dùng đang gõ trong form nhanh không bị ghi đè khi một realtime event cập nhật danh sách.

### Tổng quan
- `renderSummary()` lọc `recordedCodeMap()` trước khi render.
- Chỉ chỉ tiêu có bản ghi mới được hiển thị.
- Giá trị 0 đã ghi nhận vẫn được hiển thị.

### Lịch sử hành trình
- Tên và BHYT tăng visual hierarchy.
- Lộ trình dùng place emphasis + accent arrow.
- Nhãn Đi/Về/Kết thúc đậm; thời gian nghiêng.
- Nút xem chi tiết tăng độ tương phản trên mobile.

### Cập nhật ứng dụng
- Version: `8.3.2`.
- Service Worker cache: `tong-hop-so-lieu-y-te-firebase-v8.3.2`.
- `version.json` công bố 8.3.2 để máy v8.3.1 phát hiện cập nhật.
