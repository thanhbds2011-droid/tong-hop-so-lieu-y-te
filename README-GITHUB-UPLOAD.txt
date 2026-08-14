ỨNG DỤNG PHÒNG Y TẾ - GITHUB UPLOAD v9.1.0
================================================

ĐÂY LÀ BỘ SOURCE DÙNG ĐỂ ĐƯA TRỰC TIẾP LÊN GITHUB PAGES.

CÁCH DÙNG
1. Giải nén file ZIP.
2. Đưa TOÀN BỘ file/thư mục bên trong vào thư mục gốc (root) của repository GitHub.
3. index.html phải nằm ngay ở root repository, không đặt cả thư mục ZIP thành một thư mục con.
4. Commit lên nhánh main và chờ GitHub Pages triển khai.

KHÔNG CẦN ĐƯA FIREBASE RULES LÊN GITHUB.
Firebase Realtime Database Rules được quản lý tại Firebase Console và không thuộc gói frontend này.

ĐIỂM MỚI v9.1.0
- Tổng quan ưu tiên “Cần xử lý”, giảm bộ lọc chiếm chỗ và thêm thao tác nhanh.
- Nhập liệu có bộ lọc Cần nhập / Đã có số liệu / Tất cả, mặc định ưu tiên việc còn thiếu.
- Chỉ tiêu tự động hiển thị rõ Tự động / Đã điều chỉnh và dùng hành động “Điều chỉnh”.
- Icon đồng bộ, trực quan hơn ở tiêu đề, số liệu, hành động và trạng thái.
- Danh sách chuyển viện gọn hơn, cảnh báo “Cần cập nhật” nổi bật hơn.
- Chi tiết hành trình sửa lại khoảng cách label/value, timeline dễ đọc hơn.
- Chi tiết tử vong tại Trung tâm chuyển sang dạng đọc thông tin, không giả dạng form nhập liệu.
- Sidebar/bottom navigation làm rõ đúng một mục đang active.
- Tối ưu touch target và bố cục cho PWA/mobile.

GIỮ NGUYÊN
- Firebase Authentication.
- Firebase Realtime Database.
- Realtime listener.
- Luồng nghiệp vụ chuyển viện/tử vong.
- Chống trùng đối tượng.
- Phân quyền hiện hành.
- PWA, service worker và cơ chế cập nhật an toàn.

Phiên bản: 9.1.0
Ngày phát hành: 14/08/2026
