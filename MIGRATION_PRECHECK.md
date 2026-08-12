# MIGRATION PRECHECK – TỔNG HỢP SỐ LIỆU PHÒNG Y TẾ

Nguồn kiểm tra: `TỔNG HỢP SỐ LIỆU PHÒNG Y TẾ.xlsx` do người dùng cung cấp.

## Số lượng hiện tại

- DANH MỤC: 20 chỉ tiêu.
- DỮ LIỆU: 53 bản ghi.
- NGƯỜI DÙNG: 2 tài khoản.
- LỊCH SỬ SỐ LIỆU: 15 bản ghi.
- NHẬT KÝ: 64 bản ghi.
- PHIÊN ĐĂNG NHẬP: 20 phiên cũ (không migration sang Firebase).

## Kiểm tra chính

- 53/53 ID trong sheet DỮ LIỆU là duy nhất; chưa phát hiện ID trùng.
- DANH MỤC đang có đồng thời cột `Đơn vị tính` và `Đơn vị`.
  Migration ưu tiên `Đơn vị`; nếu trống thì lấy `Đơn vị tính`.
- NGƯỜI DÙNG đang có đồng thời `ID người dùng` và `ID`.
  Migration ưu tiên `ID` làm `legacyUserId`; tuyệt đối không dùng ID cũ làm Firebase UID.
- Mật khẩu băm, muối và token phiên đăng nhập cũ không được chuyển sang Realtime Database.
- Có 1 email cần xác nhận: `lethihien88bp@gmai.com` (domain `gmai.com`).
- Ba chỉ tiêu ngoài bộ mặc định 17 mục đã tồn tại trong dữ liệu thật:
  `DI_CONG_TAC`, `TU_VONG`, `CHUYEN_TRUNG_TAM`.
  Vì vậy danh mục production phải tiếp tục hoàn toàn động.

## Điều kiện trước khi cutover

1. Chạy `YTE_dryRunMigration()` và kiểm tra `MIGRATION_BAO_CAO`.
2. Chỉ chạy `YTE_migrateToFirebase()` khi không còn lỗi chặn.
3. Chạy `YTE_verifyMigration()` và yêu cầu kết quả `success: true`.
4. Kiểm thử Tổng quan công khai, đăng nhập, chờ duyệt, nhập liệu, chỉnh sửa, quản trị và quyền chéo HSBA/Y tế.
5. Sau khi đạt mới chạy `YTE_markProductionActivated()`.
