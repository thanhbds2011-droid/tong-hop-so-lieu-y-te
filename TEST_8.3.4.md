# TEST 8.3.4 — Journey Visual Polish

## Phạm vi

Phiên bản 8.3.4 chỉ tinh chỉnh giao diện Báo cáo/Hành trình và version/cache. Không đổi nghiệp vụ, schema hoặc Firebase Rules.

## Kết quả kiểm tra tĩnh

- JavaScript syntax: OK cho `app.js`, `journeys.js`, `reports.js`, `ui-fixes.js`, `update-manager.js`, `service-worker.js`, `sw.js`, `app-config.js`.
- JSON: OK cho `version.json`, `manifest.json`, `manifest.webmanifest`, `firebase-database.rules.json`.
- DOM: 243 `id`, không có `id` trùng.
- `journeys.js`: không có DOM ID literal bị thiếu.
- `navHome` trong `app.js`/`reports.js` là tham chiếu compatibility cũ có kiểm tra null; không phải regression 8.3.4.
- CSS: cân bằng dấu `{}` cho `styles.css`, `reports.css`, `journeys.css`, `ui-fixes.css`.
- Service Worker APP_SHELL: tất cả file được tham chiếu đều tồn tại.
- Firebase Rules: giống byte-for-byte v8.3.3.

## Kiểm tra yêu cầu 8.3.4

- Không còn chuỗi UI `BÁO CÁO PHÒNG Y TẾ` trong production HTML/JS/CSS.
- Danh sách Lịch sử có icon người trước tên đối tượng.
- Lộ trình Lịch sử có icon xe cứu thương trước tuyến đi.
- Dialog `Lịch sử hành trình` có icon xe cứu thương ở nhãn tiêu đề.
- Tên đối tượng trong dialog có icon người.
- Icon dùng inline SVG, không thêm thư viện UI ngoài, không thêm dependency mạng.
- Realtime Sync, Update Manager, Authentication và phân quyền không bị thay đổi.

## Kiểm tra triển khai đề nghị

1. Deploy các file dán đè lên repo đang chạy v8.3.3.
2. Mở Báo cáo → Chuyển viện → Lịch sử trên desktop và mobile.
3. Xác nhận không còn `BÁO CÁO PHÒNG Y TẾ`.
4. Xác nhận tên người có icon người và lộ trình có icon xe cứu thương.
5. Mở `Xem hành trình` và kiểm tra icon ở header dialog.
6. Kiểm tra thông báo cập nhật v8.3.4 trên một máy đang chạy v8.3.3.
