# TEST 8.3.5 — Minimal Journey UI

## Phạm vi
Phiên bản 8.3.5 chỉ tinh gọn giao diện Lịch sử/Hành trình và nâng version/cache. Không đổi nghiệp vụ, schema hoặc Firebase Rules.

## Kiểm tra bắt buộc
- JavaScript syntax hợp lệ.
- JSON hợp lệ.
- Không có DOM ID trùng.
- Service Worker APP_SHELL đầy đủ.
- Không còn chuỗi giao diện “LỊCH SỬ HÀNH TRÌNH”.
- Không còn helper/render icon người/xe cứu thương trong `journeys.js`.
- Tên đối tượng hiển thị trực tiếp làm tiêu đề modal.
- Lịch sử vẫn hiển thị tên, BHYT, lộ trình, thời gian, trạng thái và nút Xem hành trình.
- Firebase Rules giống byte-for-byte v8.3.4.
- Realtime Sync và Update Manager không thay đổi.
