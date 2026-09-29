PHÒNG Y TẾ — PRODUCTION 10.0.5
DYNAMIC DASHBOARD · 4 PHÂN HỆ · VISUAL BASELINE

1. PHẠM VI
- Tổng quan hiển thị toàn bộ chỉ tiêu có phát sinh theo bộ lọc thời gian, không giới hạn bốn card.
- Bản ghi lịch sử có danh mục bị ẩn/mirror thiếu vẫn xuất hiện với nhãn cần kiểm tra; không tự bịa đơn vị.
- Chỉ tiêu không có phát sinh/chưa ghi nhận nằm ở phần thu gọn; 0 đã nhập khác chưa có dữ liệu.
- Sidebar và điều hướng điện thoại: Tổng quan, Nhập liệu, Báo cáo, Chuyển viện.
- Quản trị ở menu avatar đối với ADMIN.
- Báo cáo là phân hệ tổng hợp riêng; Chuyển viện/Tử vong dùng lại hành trình hiện hữu.
- Gỡ các luồng tạo/giải quyết Đối soát của frontend, giữ nguyên dữ liệu lịch sử trong Firebase.
- Giữ phân quyền, audit, Google avatar, OneSignal, Firebase Realtime Database và PWA.

2. CÁCH DÁN ĐÈ (CẢ HAI GITHUB REPO)
- Sao lưu ZIP/revision production cũ và giữ nguyên snapshot Rules/Data hiện hành.
- Giải nén ZIP này, mở thư mục tong-hop-so-lieu-y-te-main; chép TOÀN BỘ NỘI DUNG bên trong thư mục đó vào root mỗi repo, ghi đè file cùng tên.
- Repo 1: thanhbds2011-droid/tong-hop-so-lieu-y-te.
- Repo 2: khanhhuyen131093-pyt/tong-hop-so-lieu-y-te.
- Commit/Push từng repo; chờ GitHub Pages Actions thành công.
- Xem /version.json của TỪNG website; phải là 10.0.5.
- PWA nhận version mới qua cơ chế update hiện có; kiểm tra trực tiếp trên hai thiết bị.

3. FIREBASE/ON SIGNAL/APPS SCRIPT
- Release chỉ thay FRONTEND; không bao gồm hoặc thay Firebase Rules, database schema, Gateway, OneSignal App IDs, secrets.
- Không cần Publish lại Rules hoặc deploy Gateway vì riêng release này không sửa các thành phần đó.
- Không được Ctrl+A ghi đè Rules database dùng chung HSBA.
- Không xóa node yTeApp/yeuCauDoiSoat hay bất kỳ dữ liệu lịch sử nào.
- Hạn chế: Rules/Gateway production chưa được đọc/kiểm thử trực tiếp trong môi trường tạo ZIP; phải kiểm tra UAT.

4. UAT BẮT BUỘC TRƯỚC KHI BÀN GIAO
- Đăng nhập ADMIN, NHAPLIEU, VIEWER, tài khoản chưa được cấp; kiểm tra quyền thực tế.
- Ngày có ít nhất 6 chỉ tiêu phát sinh: phải hiện toàn bộ; 0 đã lưu khác Chưa ghi nhận.
- Thêm danh mục mới + nhập dữ liệu -> card tự có; danh mục đã ẩn nhưng có số liệu cũ vẫn có dấu hiệu cần kiểm tra.
- Chuyển tới 4 tab trên Desktop và Mobile; ADMIN vào Quản trị từ avatar.
- Xem Báo cáo, Xuất Excel với cùng thời gian/chỉ tiêu, đối chiếu từng số.
- Chuyển viện/Tử vong: xem chi tiết, sửa ngày chặng, xóa đúng quyền, kiểm tra marker và audit.
- Máy A nhập -> máy B realtime; mạng ngắt/kết nối lại; PWA cập nhật khi form đang có dữ liệu chưa lưu.
- Thử thông báo Push cũ dạng view=reports + resourceId; phải mở đúng Chuyển viện.
- Kiểm thử cả hai hostname và OneSignal App tương ứng.

5. ROLLBACK
- Nếu phát hiện lỗi, revert commit/copy lại source ZIP v10.0.4 trên CẢ HAI repo theo thứ tự đã deploy.
- Không xóa/chuyển dữ liệu Firebase và không rollback Rules/Gateway vì bản này không sửa backend.
- Kiểm tra /version.json = 10.0.4 và thử lại các thao tác dữ liệu.

6. TRẠNG THÁI
- Đã tạo ZIP và kiểm tra tĩnh local.
- Chưa deploy hai GitHub site, chưa Publish Rules, chưa test Firebase/OneSignal thật, chưa xác nhận PWA trên thiết bị.
