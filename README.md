# Tổng hợp số liệu Phòng Y tế — V6.5.0

Phiên bản V6.5.0 giữ nguyên kiến trúc:

- GitHub Pages làm khung PWA.
- Google Apps Script xử lý nghiệp vụ và giao diện chính.
- Google Sheet lưu dữ liệu tập trung.

## Điểm hoàn thiện giao diện V6.5.0

- Tổng quan không còn lặp bốn chỉ tiêu nổi bật với danh sách chi tiết.
- Bốn thẻ tổng hợp mới phân biệt rõ: Có phát sinh, Đã ghi nhận 0, Chưa ghi nhận và Tổng chỉ tiêu.
- Danh sách chỉ tiêu dùng dấu `—` cho mục chưa ghi nhận; số `0` chỉ dùng khi đã lưu xác nhận không phát sinh.
- Trang Nhập liệu có bốn trạng thái thống nhất: Có phát sinh, Đã ghi nhận 0, Chưa ghi nhận và Chưa lưu.
- Cột Đã lưu hiển thị đồng nhất, không dùng khung nét đứt gây nhầm là ô nhập.
- Nút Điều chỉnh chỉ xuất hiện khi chỉ tiêu đã có bản ghi.
- Thanh lưu thu gọn khi không có thay đổi và chỉ nổi bật khi có dữ liệu chưa lưu.
- Bộ lọc được rút gọn, nút `Áp dụng` ngắn gọn hơn.
- Tăng độ tương phản chữ phụ và tối ưu bố cục điện thoại theo dạng thẻ.

## Cập nhật Apps Script

1. Mở dự án Google Apps Script đang sử dụng.
2. Sao lưu `Code.gs` hiện tại.
3. Sao chép toàn bộ nội dung trong `apps-script/Code.gs` của gói này.
4. Dán đè toàn bộ `Code.gs` cũ và lưu.
5. Chọn **Triển khai → Quản lý quá trình triển khai → Chỉnh sửa**.
6. Chọn **Phiên bản mới** và triển khai trên deployment hiện tại để giữ nguyên URL `/exec`.

Không cần chạy lại `initializeApplication()` nếu Google Sheet đã hoạt động ổn định. Hàm này chỉ cần dùng khi thiếu sheet hoặc cột cấu trúc.

## Cập nhật GitHub Pages

1. Đưa toàn bộ tệp trong thư mục này lên thư mục gốc repository.
2. Ghi đè các tệp cũ.
3. Giữ nguyên URL Apps Script trong `app-config.js` nếu deployment `/exec` không đổi.
4. Commit và chờ GitHub Pages triển khai hoàn tất.
5. Mở ứng dụng và nhấn `Ctrl + F5` để nhận cache V6.5.0.

## Nguyên tắc dữ liệu được giữ nguyên

- Bổ sung số liệu sẽ cộng vào tổng đang lưu.
- Điều chỉnh cho phép tăng, giảm hoặc đưa tổng về 0.
- Chỉ tiêu chưa có bản ghi hiển thị `—` và trạng thái `Chưa ghi nhận`.
- Chỉ tiêu có bản ghi giá trị 0 hiển thị `0` và trạng thái `Đã ghi nhận 0`.
- Không xóa sheet, cột hoặc dữ liệu hiện hữu.
- Mọi điều chỉnh vẫn được lưu trong `LỊCH SỬ SỐ LIỆU`.
