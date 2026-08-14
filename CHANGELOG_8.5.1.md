# CHANGELOG 8.5.1

## Đối soát chỉ tiêu Chuyển viện/Tử vong
- Giữ cơ chế tự động tính Chuyển viện và Tử vong từ phân hệ nghiệp vụ.
- Không còn khóa nút Sửa đối với hai chỉ tiêu tự động trong màn hình Nhập số liệu.
- Giá trị tự động là số tham chiếu mặc định; nếu người nhập liệu không sửa thì hệ thống sử dụng nguyên giá trị đó.
- Khi người nhập liệu sửa, giá trị đã kiểm tra trở thành số liệu chính thức dùng cho Tổng quan/Tổng hợp số liệu.
- Giá trị tự động vẫn hiển thị cạnh số chính thức để đối chiếu.
- Nếu số mới bằng số hiện tại, hệ thống không tạo một lần điều chỉnh thừa.

## Lịch sử điều chỉnh
- Bổ sung nút `Lịch sử` ngay tại từng chỉ tiêu đã ghi nhận trong màn hình Nhập số liệu.
- Mỗi lần điều chỉnh lưu:
  - giá trị trước;
  - giá trị sau;
  - lý do;
  - UID Firebase;
  - Gmail đăng nhập;
  - tên hiển thị lấy từ tài khoản/phân quyền;
  - role;
  - thời điểm.
- Chỉ tiêu tự động bắt buộc nhập lý do khi sửa.
- Tên người điều chỉnh không nhập tay.

## Firebase Rules
- Cho phép tài khoản Tổng hợp Y tế có `active = true` đọc `tongHopYTe/lichSu` để xem lịch sử điều chỉnh.
- Quyền ghi `soLieuTheoNgay`, `lichSu`, `nhatKy` vẫn giữ theo role `admin/nhaplieu` hiện có.
- Record lịch sử của người dùng thường phải khớp `displayName` và `role` trong `tongHopYTe/phanQuyen/{uid}`; UID/email tiếp tục phải khớp Firebase Authentication.
- Không thay quyền của HSBA, `baoCaoYTe` hoặc Authentication.

## Realtime/PWA
- Realtime tự động vẫn chạy bình thường.
- Khi có bản ghi điều chỉnh thủ công, giá trị chính thức được ưu tiên; giá trị tự động vẫn tiếp tục cập nhật làm số tham chiếu.
- Nâng version/cache đồng bộ lên 8.5.1.
