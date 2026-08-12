# Ứng dụng Phòng Y tế — Firebase Production 8.0.2

Bản 8.0.2 mở rộng ứng dụng hiện tại thành 2 phân hệ quyền độc lập:

1. **Tổng hợp số liệu** — giữ nguyên node `tongHopYTe` và nghiệp vụ production hiện có.
2. **Báo cáo chuyển viện – tử vong** — module mới tại node `baoCaoYTe`.

Firebase Authentication dùng chung. Một người có thể được cấp quyền Tổng hợp số liệu, Báo cáo, cả hai hoặc không có quyền.

## Nguyên tắc dữ liệu

- Không dùng Firestore.
- Không thay đổi các node HSBA hiện có.
- Không thay đổi cấu trúc `tongHopYTe` hiện có.
- Báo cáo chuyển viện/tử vong **không tự động cập nhật** Tổng hợp số liệu.
- Tên người nhập báo cáo lấy từ Firebase Authentication.
- Báo cáo chỉ xóa mềm (`trangThai = deleted`).
- Lịch sử và nhật ký của Báo cáo độc lập với Tổng hợp số liệu.

## File production chính

- `index.html`
- `styles.css`
- `ui-fixes.css`
- `reports.css`
- `app.js`
- `reports.js`
- `app-config.js`
- `service-worker.js`
- `manifest.webmanifest`
- `firebase-rules.json`

## Node mới

```text
yTeApp/
  nguoiDung/{uid}

baoCaoYTe/
  phanQuyen/{uid}
  baoCao/{reportId}
  lichSu/{reportId}/{historyId}
  nhatKy/{YYYY-MM}/{logId}
  cauHinh/
  _migration/
```

`yTeApp/nguoiDung` chỉ là danh bạ tài khoản đã đăng nhập Google. Quyền thực tế vẫn nằm tại từng phân hệ.

## Quyền Báo cáo

- `admin`: xem, lập, sửa, xóa mềm, quản lý quyền Báo cáo.
- `nhaplieu`: xem, lập, sửa.
- `viewer`: chỉ xem.

Người dùng phải đăng nhập Google ít nhất một lần để xuất hiện trong danh sách cấp quyền Báo cáo.

## Migration dữ liệu cũ

Thư mục `migration-bao-cao/` chứa Apps Script một lần để chuyển dữ liệu từ 2 sheet:
- `BÁO CÁO CHUYỂN VIỆN`
- `BÁO CÁO TỬ VONG`

Ứng dụng production không phụ thuộc Apps Script migration.


### Thay đổi 8.0.2
- Ẩn banner thông báo chờ cấp quyền phía trên; giữ thông báo trạng thái trong Trang chủ.
- Thêm Quản trị → Quyền Báo cáo để admin cấp một quyền chung cho Chuyển viện và Tử vong.
- Quản trị Tổng hợp hoặc Quản trị Báo cáo đều có thể quản lý quyền Báo cáo.
- Ẩn nút Trang chủ nếu tài khoản không có quyền Báo cáo.
