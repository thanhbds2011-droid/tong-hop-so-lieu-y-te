ỨNG DỤNG PHÒNG Y TẾ - GITHUB UPLOAD v9.3.0
================================================

BỘ SOURCE DÙNG ĐỂ ĐƯA TRỰC TIẾP LÊN GITHUB PAGES.

CÁCH DÙNG
1. Giải nén file ZIP.
2. Đưa TOÀN BỘ file/thư mục bên trong vào root repository GitHub.
3. index.html phải nằm ngay tại root repository.
4. Commit lên nhánh triển khai và chờ GitHub Pages cập nhật.
5. Sau khi deploy, mở ứng dụng và thực hiện hard refresh/PWA update nếu trình duyệt còn cache bản cũ.

KIẾN TRÚC
- Frontend: HTML/CSS/JavaScript.
- Firebase Authentication.
- Firebase Realtime Database.
- PWA/service worker/update manager.
- Không dùng Cloud Firestore.
- Không kèm Firebase Rules trong gói frontend này.

PHIÊN BẢN
- Business Stable baseline: v1.0.
- Runtime/PWA: 9.3.0.
- Ngày phát hành: 14/08/2026.

ĐIỂM MỚI 9.3.0
- Đổi hierarchy header: tên Trung tâm là nhận diện chính, “Ứng dụng Phòng Y tế” là phân hệ phụ.
- Sidebar desktop có tiêu đề “Chức năng” rõ ràng, active state nhẹ hơn.
- Nhập liệu được gom thành workflow gọn; record thủ công đã có hiển thị Sửa / Lịch sử / Xóa.
- Xóa số liệu thủ công dùng multi-location update: xóa private + public mirror, giữ history + audit/nhật ký.
- Không cho xóa chỉ tiêu Chuyển viện/Tử vong tự động từ màn hình Nhập liệu.
- Bỏ “Tái khám” khỏi Hình thức chuyển khi tạo hành trình mới; dữ liệu/status legacy TAI_KHAM vẫn được đọc.
- Chuyển điểm tạo “Tử vong tại Trung tâm” sang workspace Lập chuyển viện; History chỉ còn tra cứu.
- Sửa menu dấu ba chấm bằng popover định vị theo viewport để “Đã về Trung tâm” không bị che.
- Form Lập chuyển viện dùng grid cân đối hơn.
- Popup readonly có nút Đóng ở footer sẽ không hiển thị thêm dấu X.
- Runtime/cache đồng bộ 9.3.0.

LƯU Ý KIỂM THỬ PRODUCTION
- Cần smoke-test Firebase Rules thật cho thao tác xóa daily record.
- Cần test đầy đủ trên desktop và PWA/mobile sau deploy.
