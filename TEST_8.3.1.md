# TEST 8.3.1 – Mobile UX Refinement & Realtime Sync

## Kiểm tra tĩnh đã thực hiện
- JavaScript syntax: `app-config.js`, `app.js`, `reports.js`, `journeys.js`, `ui-fixes.js`, `update-manager.js`, `service-worker.js`, `sw.js` — OK.
- JSON: `manifest.json`, `manifest.webmanifest`, `version.json`, `firebase-database.rules.json` — OK.
- DOM: 231 ID, không có ID trùng.
- `journeys.js`: không có static DOM ID bị thiếu.
- Hai DOM ID `entryNoMatch` và `navHome` là tham chiếu tùy chọn đã tồn tại từ 8.3.0; không phải lỗi mới.
- CSS brace balance: `styles.css`, `reports.css`, `journeys.css`, `ui-fixes.css` — OK.
- Service Worker APP_SHELL: tất cả tài nguyên đều tồn tại.
- Firebase Rules: byte-for-byte không đổi so với 8.3.0.
- Không còn chuỗi version 8.3.0 trong production JS/CSS/HTML/JSON.

## Realtime listener đã bổ sung
- `tongHopYTe/congKhai/danhMucChiTieu`
- `tongHopYTe/congKhai/soLieuTheoNgay` theo khoảng lọc hiện tại
- `tongHopYTe/soLieuTheoNgay/{date}` theo ngày nhập liệu hiện tại
- `baoCaoYTe/baoCao`
- `baoCaoYTe/hanhTrinhChuyenVien`

Firebase Web SDK tự duy trì kết nối/reconnect; listener nhận cả thay đổi từ thiết bị khác.

## Update system
- `version.json` dùng `cache: no-store`.
- Service worker đăng ký `updateViaCache: none`.
- Kiểm tra update mỗi 60 giây khi app đang mở.
- Kiểm tra lại khi focus, visibility trở lại, online.
- Không auto reload khi có bản mới; người dùng bấm `Cập nhật ngay`.
- `SKIP_WAITING` chỉ được gửi sau khi người dùng chấp nhận cập nhật.

## Cần kiểm thử thủ công sau deploy
1. Hai thiết bị cùng mở app, cùng quyền.
2. Cập nhật số liệu ở thiết bị A; xác nhận B đổi tự động.
3. Tạo hành trình ở A; xác nhận B thấy card mới tự động.
4. Chuyển tiếp/đã về ở A; xác nhận B cập nhật/kết thúc tự động.
5. Tạo báo cáo tử vong ở A; xác nhận B thấy dữ liệu tự động.
6. Kiểm tra iPhone Safari/PWA và Chrome Android với bàn phím mở.
7. Khi có bản 8.3.2 thử nghiệm, đổi `version.json`, app-config, service-worker và asset version; xác nhận 8.3.1 hiển thị banner cập nhật.
