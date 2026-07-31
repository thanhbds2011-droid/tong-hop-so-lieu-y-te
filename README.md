# Ứng dụng Tổng hợp số liệu Phòng Y tế — Giao diện chuyên nghiệp V3

## Thành phần

- `Code.gs`: dán đè toàn bộ vào Google Apps Script.
- `index.html`: dán đè toàn bộ vào GitHub Pages.

## Điểm mới

- Giao diện thẻ hiện đại, không trình bày giống bảng Excel.
- Bộ lọc theo ngày, từ ngày đến ngày, tháng, quý và năm.
- Bộ lọc nội dung: chọn một chỉ tiêu hoặc “Tất cả nội dung”.
- Tra cứu bằng thẻ trực quan; báo cáo theo từng ngày; nhật ký dạng dòng thời gian.
- Nhập liệu dạng thẻ 2 cột, tối ưu máy tính và điện thoại.
- Sau khi lưu thành công, toàn bộ số liệu về `0`, ghi chú trở về trống.
- Có nút “Nạp dữ liệu đã lưu” khi cần chỉnh sửa ngày cũ.
- Máy đang nhập đồng bộ ngay sau khi lưu; thiết bị khác tự kiểm tra dữ liệu mới mỗi 8 giây và khi quay lại tab.

## Cài đặt

1. Apps Script: mở `Mã.gs`/`Code.gs`, xóa toàn bộ, dán nội dung `Code.gs` mới.
2. Chạy `setupSheets()` một lần.
3. Triển khai → Quản lý tùy chọn triển khai → Chỉnh sửa → Phiên bản mới → Triển khai.
4. GitHub: dán đè file `index.html`.
5. Nếu URL `/exec` của Apps Script thay đổi, sửa thuộc tính `src` của iframe trong `index.html`.
6. Chờ GitHub Pages cập nhật rồi nhấn `Ctrl + F5`.

## Lưu ý vận hành

- “Làm trống biểu mẫu” chỉ xóa số đang hiển thị trên màn hình, không xóa dữ liệu trong Sheet.
- “Nạp dữ liệu đã lưu” dùng để sửa số liệu đã nhập của ngày được chọn.
- Bộ lọc nội dung ảnh hưởng tới Tổng quan, Báo cáo và file CSV.
