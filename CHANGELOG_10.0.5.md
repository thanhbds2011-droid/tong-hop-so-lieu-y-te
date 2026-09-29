# v10.0.5 — Dynamic Dashboard & Four-Module Navigation

## Thay đổi frontend
- Dashboard hiển thị mọi chỉ tiêu có phát sinh (không giới hạn 4 card); nhóm chỉ tiêu 0/chưa có bản ghi trong khu vực thu gọn; phân biệt chưa ghi nhận với đã nhập 0.
- Biểu đồ xu hướng giới hạn tối đa 4 chỉ tiêu trọng tâm với mô tả phạm vi rõ; so sánh cơ cấu trong cùng đơn vị.
- Menu: Tổng quan, Nhập liệu, Báo cáo, Chuyển viện. Quản trị chuyển vào menu tài khoản chỉ ADMIN.
- Báo cáo tổng hợp riêng (cùng phạm vi đã chọn) có bảng chỉ tiêu, xem báo cáo và xuất Excel, tái sử dụng hàm nguồn.
- Chuyển viện riêng dùng lại transferJourneyPanel và toàn bộ journey ID / Firebase nguồn hiện hữu.
- Gỡ dialog tạo/điều phối Đối soát và logic ghi dữ liệu Đối soát từ frontend; legacy notifications điều hướng an toàn về Tổng quan.
- Nâng version/query/cache thành 10.0.5; không sửa Firebase schema/Rules/Gateway.

## Bảo toàn
- Không xóa yTeApp/yeuCauDoiSoat hay dữ liệu audit và lịch sử.
- Giữ Chuyển viện/Tử vong từ nguồn -> marker -> Tổng hợp, không manual override.
- Không thay đổi Firebase credentials, OneSignal App selection hoặc Gateway.

## Cần UAT production
- Các thao tác Auth/Rules/Realtime đa thiết bị, OneSignal Push, PWA auto-update trên cả hai hostname phải kiểm tra trong môi trường được cấp quyền.

## An toàn dữ liệu và tương thích
- Hiển thị các bản ghi lịch sử có mã chỉ tiêu không còn xuất hiện trong danh mục công khai; nhãn "cần kiểm tra danh mục" và không bịa đơn vị.
- Bộ lọc chỉ tiêu áp dụng nhất quán cho xuất Excel; preview không xuất các chỉ tiêu chưa có bản ghi như thể đã nhập số 0.
- Deep-link cũ còn trong sessionStorage được chuẩn hóa, không điều hướng đến màn hình Đối soát đã bỏ.
