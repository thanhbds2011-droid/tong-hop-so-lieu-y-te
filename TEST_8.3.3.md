# TEST v8.3.3 – Professional Data Entry UI

## Kiểm tra tĩnh
- JavaScript syntax: `app.js`, `reports.js`, `journeys.js`, `ui-fixes.js`, `update-manager.js`, `service-worker.js`.
- JSON: `version.json`, `manifest.json`, `manifest.webmanifest`, `firebase-database.rules.json`.
- DOM: không có ID trùng.
- Firebase Rules: giữ nguyên byte-for-byte so với v8.3.2.

## UI/UX Nhập liệu
- Không còn nhãn “NHẬP NHANH”, “SỐ LIỆU TRONG NGÀY”, “ĐÃ GHI NHẬN” trong giao diện Nhập liệu.
- Ngày chỉ hiển thị tại bộ chọn ngày, không lặp lại trong các card.
- Mobile ẩn thông tin tài khoản khỏi nội dung chính.
- Nút “+ Nhập số liệu” là primary action.
- Desktop mở form dạng dialog; mobile mở bottom sheet.
- ESC/backdrop/nút X/Hủy đóng form khi không trong trạng thái đang lưu.
- Khi form mở, scroll trang nền bị khóa.
- Mobile ẩn bottom navigation trong lúc bottom sheet mở.
- Danh sách dữ liệu đã nhập hiển thị tên chỉ tiêu, nhóm, số liệu lớn, đơn vị và nút “✎ Sửa”.

## Realtime
- Máy A lưu dữ liệu → Máy B đang mở đúng ngày nhận cập nhật tự động qua Realtime Database listener.
- Không yêu cầu F5/Sync/Làm mới.
- Draft đang nhập không bị realtime event ghi đè.

## PWA/Update
- Version: 8.3.3.
- Service Worker cache: v8.3.3.
- `version.json` thông báo Professional Data Entry UI.
