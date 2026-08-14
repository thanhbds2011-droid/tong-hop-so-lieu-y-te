# TEST v8.5.1 — Đối soát số liệu tự động

## 1. Chuyển viện tự động
- [ ] Lập 01 chuyển viện mới.
- [ ] Nhập số liệu hiển thị Chuyển viện = 1.
- [ ] Có nhãn `Tự động 1`.
- [ ] Vẫn có nút `Sửa`.
- [ ] Có nút `Lịch sử`.
- [ ] Nếu không sửa, Tổng quan/Tổng hợp sử dụng 1.

## 2. Sửa số Chuyển viện
- [ ] Bấm `Sửa`.
- [ ] Dialog hiển thị số đang dùng và số tự động tham chiếu.
- [ ] Không nhập lý do -> không cho lưu.
- [ ] Nhập giá trị khác + lý do -> lưu thành công.
- [ ] Giá trị đã sửa trở thành số chính thức.
- [ ] Giá trị tự động vẫn hiển thị cạnh số chính thức.
- [ ] Nếu nhập số bằng số hiện tại -> không tạo điều chỉnh thừa.

## 3. Lịch sử điều chỉnh
- [ ] Bấm `Lịch sử` trên Chuyển viện.
- [ ] Hiển thị giá trị trước -> sau.
- [ ] Hiển thị lý do.
- [ ] Hiển thị tên người điều chỉnh.
- [ ] Hiển thị Gmail đăng nhập.
- [ ] Hiển thị thời điểm.
- [ ] Tên/Gmail lấy từ tài khoản đang đăng nhập, không có ô nhập tay.
- [ ] Role `nhaplieu` Tổng hợp Y tế xem được lịch sử.
- [ ] Tài khoản không có quyền Tổng hợp Y tế không đọc được lịch sử.

## 4. Tử vong tự động
- [ ] Tạo Tử vong tại bệnh viện hoặc Tử vong tại Trung tâm.
- [ ] Chỉ tiêu Tử vong tự tăng.
- [ ] Vẫn có nút Sửa và Lịch sử.
- [ ] Sửa thủ công bắt buộc lý do và lưu audit giống Chuyển viện.

## 5. Realtime
- [ ] Máy A lập chuyển viện -> Máy B thấy số tự động tăng, không F5.
- [ ] Máy B sửa số chính thức -> Máy A/Tổng quan nhận số chính thức realtime.
- [ ] Sau điều chỉnh, phát sinh thêm báo cáo -> số tự động tham chiếu tiếp tục thay đổi nhưng số chính thức đã điều chỉnh không bị ghi đè ngoài ý muốn.

## 6. Dữ liệu khác
- [ ] Chỉ tiêu thủ công bình thường vẫn nhập/sửa như trước.
- [ ] Lịch sử chỉ tiêu thủ công vẫn xem được.
- [ ] Nhập 0 vẫn hợp lệ.
- [ ] Phân quyền admin/nhaplieu không thay đổi.

## 7. PWA/version
- [ ] version.json = 8.5.1.
- [ ] app-config VERSION = 8.5.1.
- [ ] Service Worker cache = 8.5.1.
- [ ] sw.js compatibility cache = 8.5.1.
- [ ] Asset query string = 8.5.1.
- [ ] PWA cũ nhận thông báo cập nhật mà không phải xóa cache.

## 8. Responsive
- [ ] 320px.
- [ ] 375px.
- [ ] 390px.
- [ ] 430px.
- [ ] tablet.
- [ ] desktop.
- [ ] Nút Tự động / Sửa / Lịch sử không tràn ngang.
- [ ] Modal lịch sử không vượt viewport mobile.
