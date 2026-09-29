# CHANGELOG 10.0.4

## Mục tiêu
- Hoàn thiện giao diện theo mẫu đã chốt.
- Bỏ phần Đối soát và toàn bộ luồng người dùng liên quan.

## Thay đổi chính
- Ẩn/loại bỏ menu Đối soát ở sidebar và thanh điều hướng mobile.
- Loại bỏ màn hình Đối soát khỏi giao diện production.
- Bỏ nút "Yêu cầu đối soát" ở màn hình Chuyển viện & tử vong.
- Các chỉ tiêu tự động ở Nhập liệu không còn mở luồng Đối soát; thay vào đó mở trực tiếp nguồn dữ liệu liên quan để xem/chỉnh sửa đúng nơi phát sinh.
- Khóa truy cập view reconciliation ở tầng điều hướng.
- Ngừng khởi tạo realtime listener cho yeuCauDoiSoat nhằm giảm tải và tránh phát sinh luồng nghiệp vụ thừa.
- Nâng version lên 10.0.4 và đồng bộ cache/PWA.

## Không thay đổi
- Firebase Realtime Database hiện hữu.
- Authentication / Google Sign-In.
- OneSignal / Apps Script gateway.
- Luồng Chuyển viện, Tử vong, Điều trị lao, Chuyển trung tâm, Quản trị và audit hiện có.
