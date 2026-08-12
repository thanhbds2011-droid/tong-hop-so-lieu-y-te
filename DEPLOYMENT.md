# HƯỚNG DẪN TRIỂN KHAI – TỔNG HỢP SỐ LIỆU PHÒNG Y TẾ 7.0.0

## Giai đoạn A – Sao lưu

1. Giữ nguyên repository GitHub hiện tại và deployment Apps Script V6.7.
2. Tải/giữ bản sao Google Sheet hiện tại.
3. Chưa xóa Apps Script cũ.

## Giai đoạn B – Firebase Authentication

Trong Firebase project `hsba-trung-tam-test`:

1. Giữ Google Sign-In đang dùng cho HSBA.
2. Nếu muốn cho đăng ký/đăng nhập Email + Password, bật Email/Password trong Authentication → Sign-in method.
3. Nếu GitHub Pages của Tổng hợp Y tế chạy trên domain GitHub Pages khác domain đã dùng cho HSBA, thêm domain đó vào Authentication → Settings → Authorized domains.

Không tạo UID thủ công.

## Giai đoạn C – Realtime Database Rules

1. Mở Firebase Console → Realtime Database → Rules.
2. Sao lưu Rules đang chạy.
3. Dán toàn bộ nội dung `firebase-rules.json`.
4. Kiểm tra lại các node HSBA cũ vẫn còn nguyên trong Rules.
5. Publish.

File Rules mới chỉ bổ sung `tongHopYTe`; không chuyển node HSBA vào nhánh khác.

## Giai đoạn D – Migration DRY RUN

Nên dùng một Apps Script riêng gắn với Google Sheet Tổng hợp Y tế hoặc thêm file `migration/Code.gs` vào project hiện tại.
Tất cả helper migration đã có tiền tố `YTE_MIG_` để không đụng helper V6.7.

1. Mở Project Settings → bật hiển thị `appsscript.json`.
2. Nếu dùng project Apps Script mới gắn với Sheet, dùng `migration/appsscript.json`. Nếu thêm `Code.gs` vào project V6.7 hiện tại, chỉ **bổ sung/merge** các OAuth scope còn thiếu; không ghi đè manifest cũ.
3. Chạy:
   `YTE_dryRunMigration()`
4. Cấp quyền OAuth khi Google yêu cầu.
5. Mở sheet `MIGRATION_BAO_CAO`.
6. Chỉ đi tiếp khi:
   - LỖI CHẶN = 0.
   - Đã kiểm tra cảnh báo email/domain.
   - Số lượng phù hợp dữ liệu nguồn.

DRY RUN không ghi dữ liệu lên Firebase.

## Giai đoạn E – Migration thật

1. Không sửa dữ liệu nguồn sau DRY RUN.
2. Chạy:
   `YTE_migrateToFirebase()`
3. Script kiểm tra fingerprint. Nếu Google Sheet đã thay đổi, migration tự dừng.
4. Script cũng dừng nếu `tongHopYTe` đã có dữ liệu không thuộc lần migration này.
5. Chạy:
   `YTE_verifyMigration()`
6. Kết quả phải có `success: true`.

Không chạy `YTE_markProductionActivated()` ở bước này.

## Giai đoạn F – Deploy GitHub Pages

Thay toàn bộ source repository Tổng hợp Y tế bằng bộ file production này, giữ `.github/workflows/deploy-pages.yml`.

Sau khi GitHub Pages deploy:

### Test công khai
- Không đăng nhập vẫn thấy Tổng quan.
- Lọc ngày/tháng/quý/năm.
- Tìm chỉ tiêu.
- Không thấy email/UID/người cập nhật trong dữ liệu công khai.

### Test đăng nhập
- Google Sign-In hoạt động.
- Email/Password hoạt động nếu provider đã bật.
- Người chưa có quyền thấy thông báo chờ duyệt.
- Người chưa có quyền Y tế nhưng có HSBA không tự được vào Y tế.
- Người có quyền Y tế nhưng không có HSBA vẫn dùng Y tế.

### Test quản trị
- Admin thấy yêu cầu chờ duyệt.
- Duyệt Nhập liệu.
- Duyệt Quản trị.
- Khóa/Mở quyền chỉ tác động Tổng hợp Y tế.
- Thu hồi quyền không xóa Firebase Authentication user.

### Test dữ liệu
- Ghi nhận mới.
- Điều chỉnh lên/xuống/0.
- Hai trình duyệt cùng sửa một chỉ tiêu: thao tác stale phải bị chặn.
- Thêm chỉ tiêu mới mà không sửa code.
- Ngừng sử dụng và khôi phục chỉ tiêu.

## Giai đoạn G – Cutover

Khi toàn bộ kiểm thử đạt:

1. Chạy `YTE_markProductionActivated()`.
2. Giữ Google Sheet và Apps Script V6.7 ở trạng thái backup, không xóa.
3. Từ thời điểm này frontend production dùng Firebase Realtime Database.

## Cảnh báo dữ liệu hiện tại

File Excel đã cung cấp có email:
`lethihien88bp@gmai.com`

Cần xác nhận đây có phải email thật hay lỗi gõ `gmail.com` trước khi người này đăng ký/liên kết Firebase.
