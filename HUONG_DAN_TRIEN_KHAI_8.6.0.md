# HƯỚNG DẪN TRIỂN KHAI v8.6.0

## 1. Phạm vi release

v8.6.0 chỉ thay source **Ứng dụng Phòng Y tế**. Không thay source/Rules của HSBA.

Các node Phòng Y tế được sử dụng:

- `tongHopYTe`
- `yTeApp`
- `baoCaoYTe`

Các node HSBA không nằm trong gói Rules của release và không được dán đè.

## 2. Firebase Rules

### Trường hợp đang Publish đúng Rules hiện tại đã cung cấp

Nếu Rules Firebase hiện tại đã có đầy đủ:

- `tongHopYTe/lichSu` hỗ trợ `autoValue`;
- `yTeApp/tenHienThi`;
- `baoCaoYTe/congKhaiThongKe/chuyenVienTheoNgay`;
- `baoCaoYTe/congKhaiThongKe/tuVongTheoNgay`;
- quy tắc `CENTER_DEATH` cho tử vong tại Trung tâm;
- `baoCaoYTe/hanhTrinhChuyenVien` và `hanhTrinhDangMo`;

thì **KHÔNG CẦN PUBLISH RULES LẠI**.

File `firebase-yte-rules-fragment-v8.6.0.json` chỉ để đối chiếu 3 node Phòng Y tế. **Không dán file fragment này thay toàn bộ màn hình Firebase Rules**.

### Tuyệt đối không

- Không dán file Rules cũ trong source v8.5.1 đè toàn Firebase.
- Không sửa các node HSBA.
- Không mở `.read/.write` toàn database để chữa lỗi UI.

## 3. Deploy GitHub Pages

### Cách khuyên dùng: ZIP production

1. Giải nén `ung-dung-phong-y-te-v8.6.0-production.zip`.
2. Sao lưu repo hiện tại hoặc tạo tag/commit trước khi thay.
3. Dán toàn bộ nội dung release vào root repo GitHub Pages.
4. Commit và push lên nhánh đang dùng GitHub Pages.
5. Chờ GitHub Pages deploy xong.
6. Mở URL ứng dụng bằng tab ẩn danh để kiểm tra `version.json` = `8.6.0`.

### Nếu dùng ZIP patch

Dán đè đúng các file trong `ung-dung-phong-y-te-v8.6.0-patch.zip`. Không xóa file dữ liệu/asset khác trong repo.

## 4. PWA / Update Manager

Version đã được đồng bộ tại:

- `app-config.js`
- `version.json`
- query string asset trong `index.html`
- `service-worker.js`
- `sw.js`
- `offline.html`
- manifest/theme metadata

Các máy đã cài PWA:

1. Khi mở app/foreground/online/định kỳ, Update Manager kiểm tra `version.json`.
2. Khi phát hiện v8.6.0 sẽ hiển thị banner phiên bản mới.
3. Người dùng chọn `Cập nhật ngay` để activate Service Worker mới và reload một lần.
4. Không cần xóa cache, uninstall hoặc cài lại PWA.
5. Nếu form có draft chưa lưu, Update Manager cảnh báo trước khi reload.

## 5. Đối soát marker thống kê lần đầu

v8.6.0 có cơ chế tự đối soát marker thống kê dẫn xuất:

- Hành trình hiện hữu → marker Chuyển viện theo ngày bắt đầu.
- Hành trình kết thúc `TU_VONG_TAI_BENH_VIEN` → marker Tử vong theo ngày sự kiện kết thúc.
- Báo cáo `CENTER_DEATH` → marker Tử vong tại Trung tâm.

Cơ chế này:

- chỉ chạy khi người có quyền `admin/nhaplieu` hoặc owner mở phân hệ Báo cáo;
- idempotent (ghi cùng key, không nhân đôi);
- không sửa record hành trình/báo cáo gốc;
- không đụng HSBA;
- không ghi đè số chính thức đã được người Tổng hợp điều chỉnh thủ công.

Sau deploy, nên đăng nhập bằng một tài khoản Báo cáo có quyền ghi, mở mục Báo cáo một lần và kiểm tra ngày 14/08/2026 cùng các ngày đã có hành trình.

## 6. Kiểm thử sau deploy

Thực hiện tối thiểu TEST 01–15 trong `TEST_8.6.0.md`, đặc biệt:

- Lập chuyển viện → Dashboard + Tổng hợp tăng realtime.
- Tử vong tại bệnh viện → Tử vong tăng, không tăng thêm chuyển viện.
- Tử vong tại Trung tâm → vào Lịch sử, không quay về Đang theo dõi.
- Cùng tên nhưng khác năm sinh → không bị chặn sai.
- Tên admin gán được dùng trong timeline/lịch sử.
- HSBA hoạt động như trước.

## 7. Rollback

Nếu phát hiện lỗi production:

1. Revert commit GitHub về v8.5.1 trước release.
2. Không rollback/xóa dữ liệu Firebase nghiệp vụ.
3. Các marker trong `baoCaoYTe/congKhaiThongKe` là dữ liệu dẫn xuất; không can thiệp thủ công nếu chưa xác định nguyên nhân.
4. HSBA không cần rollback vì v8.6.0 không thay Rules/luồng HSBA.
