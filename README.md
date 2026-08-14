# Ứng dụng Phòng Y tế — Firebase Production 8.5.1

Ứng dụng nghiệp vụ Phòng Y tế của Trung tâm Bảo trợ xã hội Tân Hiệp.

## Kiến trúc

- Frontend: HTML, CSS, JavaScript thuần trên GitHub Pages.
- Xác thực: Firebase Authentication / Google Sign-In.
- Cơ sở dữ liệu: Firebase Realtime Database.
- PWA: `manifest.webmanifest`, `service-worker.js`, offline shell và Update Manager.
- Không dùng Cloud Firestore.

## Phân hệ chính

1. **Tổng quan** — tổng hợp các chỉ tiêu theo ngày/khoảng thời gian.
2. **Nhập liệu** — nhập các chỉ tiêu thủ công còn lại.
3. **Báo cáo — Chuyển viện & tử vong** — một luồng nghiệp vụ thống nhất.
4. **Quản trị** — danh mục và phân quyền theo vai trò hiện có.

## Chuyển viện & tử vong — 8.5.1

Báo cáo được tổ chức thành bốn màn hình:

- **Đang theo dõi:** hành trình có `trangThaiKyThuat = OPEN`.
- **Lập chuyển viện:** mở hành trình mới; mỗi hành trình mới tương ứng đúng 01 lượt chuyển viện.
- **Tử vong tại Trung tâm:** chỉ dùng khi đối tượng tử vong tại Trung tâm.
- **Lịch sử:** Đã về Trung tâm, Tử vong tại bệnh viện và Tử vong tại Trung tâm.

Nếu đối tượng tử vong trong khi đang có hành trình ngoài Trung tâm, **không lập thêm báo cáo tử vong**. Người dùng cập nhật chính hành trình đó thành `TU_VONG_TAI_BENH_VIEN`; hành trình chuyển từ `OPEN` sang `CLOSED` và xuất hiện trong Lịch sử.

Dữ liệu báo cáo/chuyển viện cũ được giữ nguyên trong Realtime Database để tương thích ngược nhưng không được biến thành một luồng nghiệp vụ song song.

## Dashboard nghiệp vụ

Màn hình Chuyển viện & tử vong hiển thị:

- **Đang ngoài Trung tâm:** số hành trình đang `OPEN`.
- **Lượt chuyển viện hôm nay:** số hành trình được mở trong ngày.
- **Tử vong hôm nay:** tổng Tử vong tại bệnh viện + Tử vong tại Trung tâm trong ngày.

## Tích hợp tự động với Tổng hợp số liệu

Các chỉ tiêu **Chuyển viện** và **Tử vong** (nếu tồn tại trong danh mục Tổng hợp) được hệ thống tự động tính từ nghiệp vụ. **Số tự động là số tham chiếu mặc định**, nhưng người có quyền Tổng hợp Y tế vẫn được phép kiểm tra và **Sửa** số liệu chính thức khi phát hiện báo cáo nghiệp vụ sai/trùng/thiếu.

```text
baoCaoYTe/
  congKhaiThongKe/
    chuyenVienTheoNgay/
      YYYY-MM-DD/
        {caseId}: true
    tuVongTheoNgay/
      YYYY-MM-DD/
        HOSP_{caseId}: true
        CENTER_{reportId}: true
```

Marker chỉ chứa ID kỹ thuật ngẫu nhiên và boolean; không chứa tên, BHYT, chẩn đoán hay dữ liệu cá nhân. `app.js` đếm marker và ghép realtime vào Tổng quan/Nhập liệu.

Trong **Nhập số liệu**:

- nếu chưa có điều chỉnh, giá trị chính thức = giá trị tự động;
- người nhập liệu vẫn có nút **Sửa**;
- khi sửa chỉ tiêu tự động, phải nhập lý do;
- sau khi sửa, giá trị đã kiểm tra được dùng làm số liệu chính thức; giá trị tự động vẫn hiển thị để đối chiếu;
- mọi lần sửa được ghi `tongHopYTe/lichSu` với giá trị trước/sau, lý do, UID, Gmail, tên hiển thị, role và thời điểm;
- nút **Lịch sử** cho phép người dùng Tổng hợp Y tế đã được cấp quyền xem lại các lần điều chỉnh.

Tên người điều chỉnh không nhập bằng tay mà lấy từ tài khoản Firebase/Gmail đang đăng nhập và bản ghi phân quyền `tongHopYTe/phanQuyen/{uid}`.

## Quyền

Báo cáo dùng `baoCaoYTe/phanQuyen/{uid}` với các role hiện có:

- `admin`
- `nhaplieu`
- `viewer`

Không thay Authentication và không mở rộng quyền của các node HSBA hoặc `tongHopYTe`.

## Realtime và PWA

- Tổng quan, Nhập liệu và Chuyển viện/Tử vong tiếp tục dùng realtime listener.
- Không yêu cầu F5 để nhận dữ liệu mới.
- Update Manager kiểm tra `version.json` khi mở app, foreground, online trở lại và định kỳ.
- Nếu đang có dữ liệu chưa lưu, thao tác **Cập nhật ngay** sẽ cảnh báo trước khi reload.
- Phiên bản/cache production: **8.5.1**.

## File production chính

- `index.html`
- `styles.css`, `ui-fixes.css`, `reports.css`, `journeys.css`, `professional-ui.css`
- `app.js`, `reports.js`, `journeys.js`, `ui-fixes.js`
- `app-config.js`, `update-manager.js`
- `service-worker.js`, `sw.js`, `manifest.webmanifest`, `offline.html`, `version.json`
- `firebase-database.rules.json`

## Triển khai 8.5.1

Xem:

- `HUONG_DAN_NANG_CAP_8.5.1.txt`
- `TEST_8.5.1.md`
- `CHANGELOG_8.5.1.md`

Phiên bản này **không yêu cầu migration dữ liệu**. Firebase Rules có bổ sung tối thiểu cho node thống kê dẫn xuất và giới hạn báo cáo độc lập mới chỉ còn Tử vong tại Trung tâm; cần publish Rules trước hoặc đồng thời với source 8.5.1.
