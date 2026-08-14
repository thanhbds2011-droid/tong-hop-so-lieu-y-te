# CHANGELOG v8.6.0 — Ứng dụng Phòng Y tế

Ngày phát hành: 14/08/2026

## Mục tiêu

Hợp nhất nghiệp vụ **Tổng hợp số liệu + Chuyển viện + Tử vong** thành một luồng production duy nhất. Mỗi sự kiện chỉ nhập một lần, số liệu chuyển viện/tử vong được tạo từ chính dữ liệu nghiệp vụ, vẫn cho phép người phụ trách Tổng hợp kiểm tra và điều chỉnh số chính thức có lịch sử.

## Thay đổi nghiệp vụ chính

- Dashboard Báo cáo chỉ còn 3 KPI lớn: **Đang ngoài Trung tâm**, **Lượt chuyển viện**, **Tử vong**.
- Một hành trình mới chỉ tăng **Lượt chuyển viện** đúng 1 lần.
- Chuyển tiếp bệnh viện không tăng thêm lượt chuyển viện.
- Tử vong tại bệnh viện kết thúc chính hành trình đang mở và tăng **Tử vong**, không tạo báo cáo tử vong thứ hai.
- Bỏ tab riêng **Tử vong tại Trung tâm**; chuyển thành action **Ghi nhận tử vong tại Trung tâm** trong tab Lịch sử.
- Lịch sử hợp nhất hành trình CLOSED và tử vong tại Trung tâm thành một danh sách; bỏ dashboard KPI nhỏ trong Lịch sử.
- Marker thống kê được ghi tại `baoCaoYTe/congKhaiThongKe` và Tổng hợp số liệu đọc realtime từ đây.
- Bổ sung đối soát idempotent marker thống kê để tự bổ sung marker còn thiếu của dữ liệu hành trình/tử vong hiện hữu. Không thay đổi record nghiệp vụ gốc.

## Tổng hợp số liệu

- Chỉ tiêu Chuyển viện/Tử vong tự lấy số tự động từ Báo cáo.
- Người nhập liệu vẫn có **Sửa** và **Lịch sử**.
- Nếu có điều chỉnh thủ công: số đã điều chỉnh là số chính thức; số tự động vẫn được giữ để đối chiếu.
- Lịch sử lưu before/after, số tự động tại thời điểm điều chỉnh, lý do, UID, tên người thực hiện và thời gian.
- Gmail vẫn lưu nội bộ phục vụ xác thực/audit nhưng không hiển thị trong UI nghiệp vụ.

## Chống trùng và chuẩn hóa đối tượng

- Họ tên được chuẩn hóa Title Case tiếng Việt: `nguyễn   văn a` → `Nguyễn Văn A`.
- Nếu có BHYT, identity dùng: họ tên normalized + giới tính + năm sinh + BHYT normalized.
- Nếu không có BHYT, identity dùng: họ tên normalized + giới tính + năm sinh.
- Cùng tên nhưng khác năm sinh không còn bị chặn sai.
- BHYT trùng nhưng profile khác được cảnh báo để kiểm tra.
- Giữ cơ chế `hanhTrinhDangMo` chống mở hai hành trình OPEN.

## Danh tính người thực hiện

- Ưu tiên tên chuẩn tại `yTeApp/tenHienThi/{uid}`.
- Tên chuẩn được dùng trong Tổng hợp, chuyển viện, cập nhật hành trình, tử vong và lịch sử.
- Quản trị có chức năng đặt tên hiển thị chuẩn; Gmail chỉ xuất hiện ở khu vực Quản trị.

## UI/UX

- Áp dụng palette: `#D95B5B`, `#D98484`, `#F2B6B6`, `#5C7339`, `#59522C`.
- Bổ sung icon SVG nhỏ cho KPI, tab và action quan trọng; không dùng icon dày đặc.
- Modal Cập nhật hành trình bỏ eyebrow “HÀNH TRÌNH CHUYỂN VIỆN”.
- Notice kết thúc hành trình được nâng kích thước và độ tương phản.
- Giữ responsive desktop/PWA, bottom navigation và safe-area hiện có.

## Realtime / PWA

- Giữ Firebase Realtime Database listeners; không thêm Firestore.
- `reports.js` và `journeys.js` đã expose dirty-state cho Update Manager.
- Update Manager không tự reload khi form đang có dữ liệu chưa lưu.
- Version/cache/asset query đồng bộ `8.6.0`.

## Firebase Rules / HSBA

- **Không sửa luồng HSBA.**
- Release không chứa file Rules toàn Firebase/HSBA để tránh dán đè nhầm.
- File `firebase-yte-rules-fragment-v8.6.0.json` chỉ chứa 3 node Phòng Y tế: `tongHopYTe`, `yTeApp`, `baoCaoYTe` để đối chiếu.
- Nếu Firebase đang Publish đúng Rules fragment người dùng đã cung cấp (có `yTeApp/tenHienThi`, `baoCaoYTe/congKhaiThongKe`, `CENTER_DEATH`) thì **không cần sửa Rules** cho v8.6.0.

## Migration

- Không migration hàng loạt dữ liệu nghiệp vụ.
- Không xóa dữ liệu cũ.
- Chỉ có cơ chế tự đối soát/bổ sung marker thống kê dẫn xuất khi người có quyền nhập liệu/admin mở phân hệ Báo cáo.
