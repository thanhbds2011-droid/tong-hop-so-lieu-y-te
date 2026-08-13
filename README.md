## Phiên bản production 8.3.5

Phiên bản 8.3.5 giữ nguyên toàn bộ nghiệp vụ production của 8.3.4 và tinh gọn lại giao diện Lịch sử chuyển viện theo phản hồi người dùng cuối: bỏ icon người/xe cứu thương vì tạo nhiễu thị giác, bỏ nhãn “LỊCH SỬ HÀNH TRÌNH” trong cửa sổ chi tiết, chỉ giữ tên đối tượng làm tiêu đề chính. Realtime Sync, Update Manager, PWA, Authentication, phân quyền và Firebase Rules giữ nguyên.

# Ứng dụng Phòng Y tế — Firebase Production 8.3.5

Bản 8.1.1 giữ nguyên kiến trúc quyền hiện tại và bổ sung **Hành trình chuyển viện** cho phân hệ Báo cáo.

## Phân hệ

1. **Tổng hợp số liệu** — giữ nguyên `tongHopYTe` và nghiệp vụ production hiện có.
2. **Báo cáo** — quyền dùng chung tại `baoCaoYTe/phanQuyen`:
   - **Chuyển viện**: Đang theo dõi / Lập chuyển viện / Lịch sử.
   - **Tử vong**: giữ nguyên nghiệp vụ báo cáo hiện tại.

Firebase Authentication dùng chung. Người dùng có thể được cấp quyền Tổng hợp, Báo cáo, cả hai hoặc không có quyền.

## Nguyên tắc 8.1.1

- Không dùng Firestore.
- Không thay đổi node HSBA.
- Không thay đổi schema/rules `tongHopYTe`.
- Không tự động ghi Chuyển viện/Tử vong sang Tổng hợp số liệu.
- Không tự tạo Báo cáo tử vong khi hành trình kết thúc bằng `Tử vong tại bệnh viện`.
- Ngày giờ nghiệp vụ của Hành trình chuyển viện dùng Firebase Server Timestamp.
- Một đối tượng không được mở đồng thời hai hành trình chuyển viện.
- Chuyển tiếp bệnh viện tạo chặng mới; chặng/lịch sử cũ không bị sửa đè.
- Hành trình kết thúc khi `Đã về Trung tâm` hoặc `Tử vong tại bệnh viện`.
- Role `viewer` chỉ xem; `nhaplieu` và `admin` được lập/cập nhật.

## Node bổ sung 8.1.1

```text
baoCaoYTe/
  hanhTrinhChuyenVien/{caseId}/
    thongTin
    chang/{stageId}
    lichSu/{historyId}

  hanhTrinhDangMo/{doiTuongKey}: {caseId}
```

Các node cũ `baoCaoYTe/baoCao`, `phanQuyen`, `lichSu`, `nhatKy`, `cauHinh`, `_migration` giữ nguyên.

## Dữ liệu chuyển viện cũ

Dữ liệu Chuyển viện cũ vẫn có thể còn lưu tại `baoCaoYTe/baoCao` để bảo toàn dữ liệu, nhưng **không còn được đọc/hiển thị trong module Hành trình chuyển viện**. Phiên bản hiện tại không tự xóa dữ liệu cũ và không yêu cầu migration.

## File production chính

- `index.html`
- `styles.css`
- `ui-fixes.css`
- `reports.css`
- `journeys.css`
- `app.js`
- `reports.js`
- `journeys.js`
- `app-config.js`
- `service-worker.js`
- `manifest.webmanifest`
- `firebase-database.rules.json`

Xem `HUONG_DAN_NANG_CAP_8.1.1.txt` để triển khai và `TEST_HANH_TRINH_8.1.1.md` để kiểm thử.

## Nâng cấp 8.1.1 — giao diện & danh mục chuyển viện

- Giao diện Báo cáo/Hành trình được thu gọn theo mô hình workspace, giảm card lồng nhau và khoảng trắng dư.
- `Lập chuyển viện` dùng **Hình thức chuyển**: Cấp cứu, Tái khám, Chuyển viện, Khác. Chọn Khác sẽ mở ô nhập riêng.
- `Nơi đến` dùng danh mục chọn nhanh: Trung tâm Y tế KV Bình Long, Bệnh viện ĐK Bình Phước, Bệnh viện ĐK Bình Dương, Bệnh viện Chợ Rẫy, Bệnh viện Nhân Ái, hoặc Khác.
- Khi chọn `Khác`, người dùng nhập tên cơ sở thực tế.
- Trạng thái kỹ thuật khi mở hành trình là `DANG_THEO_DOI`; sau đó có thể cập nhật Tái khám, Đang điều trị, Chuyển tiếp bệnh viện khác, Tử vong tại bệnh viện hoặc Đã về Trung tâm.
- Không thay dữ liệu Tổng hợp số liệu, Báo cáo tử vong hoặc HSBA.
