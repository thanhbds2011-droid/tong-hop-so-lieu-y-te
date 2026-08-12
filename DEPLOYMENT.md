# TRIỂN KHAI PRODUCTION 8.0.2

## Thứ tự bắt buộc

### Bước 1 — Backup
1. Export Rules hiện tại.
2. Export JSON node `tongHopYTe` nếu muốn có bản rollback nhanh.
3. Không chỉnh sửa HSBA.

### Bước 2 — Publish Rules
Dán toàn bộ file `firebase-rules.json` vào Realtime Database Rules rồi Publish.

Kiểm tra file mới chỉ bổ sung 2 node root:
- `yTeApp`
- `baoCaoYTe`

Các node HSBA và `tongHopYTe` phải giữ nguyên.

### Bước 3 — Upload source GitHub
Dán đè toàn bộ source production 8.0.2 lên repo hiện tại.

Các file mới:
- `reports.js`
- `reports.css`

### Bước 4 — Chờ GitHub Pages deploy
Mở cửa sổ ẩn danh hoặc Ctrl+Shift+R.

### Bước 5 — Kiểm thử owner
Đăng nhập Google bằng tài khoản owner.
Owner sẽ tự có quyền admin Báo cáo.

Kiểm tra:
- Trang chủ xuất hiện.
- Card Tổng hợp số liệu.
- Card Báo cáo chuyển viện – tử vong.
- Báo cáo > Phân quyền.

### Bước 6 — Kiểm thử người dùng
Người dùng khác đăng nhập Google ít nhất một lần.
Admin Báo cáo vào:
Báo cáo > Phân quyền > cấp Nhập liệu/Quản trị.

Kiểm tra người chỉ có quyền Báo cáo:
- vào được Báo cáo
- không thấy Nhập liệu Tổng hợp số liệu.

Kiểm tra người chỉ có quyền Tổng hợp:
- Tổng hợp hoạt động như trước
- không thấy Báo cáo.

### Bước 7 — Migration dữ liệu cũ (nếu cần)
Dùng thư mục `migration-bao-cao`.

Chạy:
1. `YTE_BAOCAO_dryRun()`
2. kiểm tra `MIGRATION_BAO_CAO`
3. `YTE_BAOCAO_migrate()`
4. `YTE_BAOCAO_verify()`

Không migration lại dữ liệu Tổng hợp số liệu.


## QUYỀN BÁO CÁO 8.0.2
Sau khi Publish Rules và deploy source, đăng nhập tài khoản Quản trị → **Quản trị → Quyền Báo cáo** để cấp `Nhập liệu` hoặc `Quản trị`. Một quyền Báo cáo dùng chung cho cả Chuyển viện và Tử vong.
