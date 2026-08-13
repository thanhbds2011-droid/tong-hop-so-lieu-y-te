# TEST 8.3.0 – Ứng dụng Phòng Y tế

## Kiểm tra tĩnh đã thực hiện

- `node --check`: `app.js`, `reports.js`, `journeys.js`, `ui-fixes.js`, `service-worker.js`, `sw.js` — đạt.
- JSON parse: `firebase-database.rules.json`, `manifest.json`, `manifest.webmanifest` — đạt.
- HTML: không có `id` trùng.
- Tất cả DOM ID được `journeys.js` gọi đều tồn tại trong `index.html`.
- `journeys.js` không còn đọc `baoCaoYTe/baoCao` để dựng lịch sử hành trình.
- Không còn các ID/KPI `journeyStaleCount`, `journeyOver24Count`, `journeyLegacyCount`.
- Không còn chuỗi giao diện “Dữ liệu chuyển viện cũ” / “Chuyển viện cũ”.
- Firebase Rules 8.3.0 giống byte-for-byte Rules 8.2.0.
- Service Worker dùng cache `v8.3.0`; toàn bộ file APP_SHELL được kiểm tra tồn tại.

## Kiểm thử nghiệp vụ cần chạy sau deploy

1. Lập chuyển viện mới → tự chuyển sang Đang theo dõi.
2. Xác nhận không thể mở đồng thời hai hành trình cho cùng đối tượng.
3. Cập nhật Tái khám / Đang điều trị / Chuyển tiếp bệnh viện khác.
4. Đã về Trung tâm → đóng hành trình, giảm KPI Đang ngoài Trung tâm, tăng KPI Đã về Trung tâm.
5. Tử vong tại bệnh viện → đóng hành trình và xuất hiện trong Lịch sử.
6. Timeline không lặp tiêu đề trạng thái; tiêu đề là lộ trình hoặc nơi cập nhật.
7. Ghi chú chỉ xuất hiện khi có nội dung.
8. Form có thay đổi chưa lưu phải cảnh báo trước khi rời/đóng.
9. Kiểm tra quyền admin / nhập liệu / viewer.
10. Kiểm tra Chrome desktop, màn hình <= 768px và PWA đã cài.
