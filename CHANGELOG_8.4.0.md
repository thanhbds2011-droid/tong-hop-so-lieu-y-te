# 8.4.0 — Professional Healthcare Workspace UI

## Mục tiêu
Chuẩn hóa giao diện thành phần mềm nghiệp vụ y tế/hành chính chuyên nghiệp mà không thay đổi luồng nghiệp vụ.

## Thay đổi giao diện
- Desktop >= 1024px: điều hướng chính chuyển thành sidebar trái; nội dung nghiệp vụ tập trung ở workspace bên phải.
- Mobile/PWA <= 767px: điều hướng chính chuyển xuống bottom navigation, có safe-area cho thiết bị di động.
- Header chuyển sang bordeaux phẳng, bỏ gradient và shadow nặng.
- Card giảm radius/shadow, dùng border và khoảng trắng để tạo phân cấp.
- Form/input/button dùng cùng một hệ kích thước, focus state và touch target.
- Tổng quan: filter và thẻ số liệu gọn, ưu tiên dữ liệu.
- Nhập liệu: page header, tiến độ, dữ liệu trong ngày và composer thống nhất với design system.
- Báo cáo: hai cấp navigation được phân biệt rõ; workspace gọn hơn.
- Hành trình: KPI, toolbar, card theo dõi, lịch sử, form lập chuyển viện và timeline dùng cùng ngôn ngữ thị giác.
- Quản trị: tab, toolbar, badge, bảng dữ liệu theo phong cách enterprise.
- Login: giảm trang trí, tập trung logo, tên ứng dụng và Google Sign-In.
- Màu semantic: xanh lá = đã về/hoàn tất; đỏ trầm = tử vong/lỗi; vàng = cảnh báo; bordeaux = brand/primary action.

## Kiến trúc thay đổi
- Thêm `professional-ui.css` làm design-system stylesheet tập trung, nạp sau các CSS cấu trúc hiện có.
- Version/cache nâng từ 8.3.6 lên 8.4.0.
- `professional-ui.css` đã được thêm vào Service Worker APP_SHELL.
- Theme color PWA đồng bộ sang `#671d3d`, canvas sang `#f5f4f5`.

## Không thay đổi
- Firebase Realtime Database Rules.
- Firebase Authentication.
- Cấu trúc dữ liệu và đường dẫn database.
- Phân quyền Tổng hợp/Báo cáo.
- Logic nhập số liệu.
- Logic báo cáo chuyển viện/tử vong.
- Logic hành trình OPEN/CLOSED và chống mở trùng hành trình.
- Lịch sử, nhật ký và audit.
- DOM ids mà JavaScript hiện tại đang sử dụng.
