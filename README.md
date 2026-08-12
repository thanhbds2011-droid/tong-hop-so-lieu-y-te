# Tổng hợp số liệu Phòng Y tế – Firebase Production 7.0.0

## Kiến trúc

```text
GitHub Pages / PWA
        ↓
Firebase Authentication
        ↓
Firebase Realtime Database
        ↓
tongHopYTe/
```

Ứng dụng dùng chung Firebase project và Firebase Authentication với HSBA nhưng quyền nghiệp vụ tách riêng:

- HSBA: `phanQuyen/{UID}` — giữ nguyên.
- Tổng hợp Y tế: `tongHopYTe/phanQuyen/{UID}`.

Không sử dụng Cloud Firestore.

## Các file chính

- `index.html`: giao diện production.
- `styles.css`: giao diện hồng hiện hành, chuyển từ Apps Script sang GitHub.
- `app.js`: toàn bộ nghiệp vụ Firebase.
- `app-config.js`: Firebase Web config dùng chung với HSBA.
- `firebase-rules.json`: Rules hoàn chỉnh của cả project; phần HSBA giữ nguyên, chỉ bổ sung `tongHopYTe`.
- `migration/Code.gs`: migration Google Sheet → Realtime Database.
- `migration/appsscript.json`: OAuth scopes cho migration.
- `MIGRATION_PRECHECK.md`: kết quả kiểm tra file Excel đã cung cấp.
- `DEPLOYMENT.md`: trình tự triển khai.
- `ROLLBACK.md`: phương án quay lại hệ thống cũ.

## Nguyên tắc an toàn

1. Không sửa `accessAccounts`, `phanQuyen`, `doiTuong`, `quyenHoSo`, `hoSoTuVong`, `nhatKy`, `khoaThaoTac`, `congKhai` của HSBA.
2. Không xóa Firebase Authentication user khi thu hồi quyền Tổng hợp Y tế.
3. Không migration mật khẩu băm, muối, token phiên cũ.
4. Tổng quan công khai chỉ đọc `tongHopYTe/congKhai`.
5. Người dùng đăng ký Firebase không tự có quyền; admin phải duyệt.
6. Migration không ghi đè nếu `tongHopYTe` đã có dữ liệu ngoài migration hiện tại.
