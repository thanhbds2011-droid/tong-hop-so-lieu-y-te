# Ứng dụng Tổng hợp số liệu Phòng Y tế

Bộ mã gồm:

- `index.html`, `styles.css`, `app.js`: dán đè toàn bộ repository GitHub Pages.
- `Code.gs`: dán đè toàn bộ Apps Script. Không cần tạo file HTML riêng.

## Chức năng

- Xem số liệu không cần đăng nhập.
- Lọc theo ngày, từ ngày đến ngày, tháng, quý hoặc năm.
- Báo cáo chi tiết theo ngày hoặc theo tháng tùy độ dài khoảng thời gian.
- Nhật ký theo đúng khoảng thời gian đang lọc.
- Đăng ký tài khoản ngay trong ứng dụng.
- Đăng nhập bằng tài khoản hoặc email.
- Quên mật khẩu: gửi mã 6 chữ số đến email đăng ký.
- Nhập số liệu theo từng ngày.
- Đổi mật khẩu.
- Quản trị tài khoản: khóa/mở khóa, đổi vai trò, tạo mật khẩu tạm thời.
- Tài khoản đầu tiên đăng ký được cấp vai trò `Quản trị`.
- Mật khẩu được lưu dưới dạng băm có muối và bí mật máy chủ; không lưu mật khẩu rõ.

## 1. Sao lưu dữ liệu cũ

Trước khi chạy bản mới, nên sao chép file Google Sheet hoặc sao chép riêng các sheet cũ.

Khi chạy `setupSheets()`, nếu một sheet cũ không đúng cấu trúc, hệ thống sẽ đổi tên sheet đó thành dạng:

```text
NGƯỜI DÙNG CŨ 20260731-103000
```

sau đó tạo sheet mới đúng cấu trúc.

## 2. Cài Apps Script

1. Mở Google Sheet.
2. Chọn **Tiện ích mở rộng → Apps Script**.
3. Mở file `Mã.gs` hoặc `Code.gs`.
4. Xóa toàn bộ code cũ.
5. Dán toàn bộ nội dung file `Code.gs` mới.
6. Nếu còn file `Index.html`, có thể xóa vì HTML đã nằm trong `Code.gs`.
7. Lưu dự án.
8. Chọn hàm `setupSheets` và nhấn **Chạy**.
9. Cấp các quyền Google được yêu cầu.
10. Chọn hàm `authorizeMailService` và nhấn **Chạy** một lần để cấp quyền gửi email quên mật khẩu.

Sau khi chạy, có 5 sheet:

```text
DỮ LIỆU
DANH MỤC
NGƯỜI DÙNG
NHẬT KÝ
PHIÊN ĐĂNG NHẬP
```

## 3. Triển khai Web App

Chọn:

```text
Triển khai
→ Quản lý tùy chọn triển khai
→ Chỉnh sửa hoặc Lần triển khai mới
→ Ứng dụng web
```

Cấu hình:

| Mục | Giá trị |
|---|---|
| Thực thi dưới dạng | Tôi |
| Ai có quyền truy cập | Bất kỳ ai |

Chọn **Phiên bản mới**, nhấn **Triển khai**, rồi sao chép URL kết thúc bằng `/exec`.

## 4. Cập nhật GitHub

Dán đè toàn bộ 3 file:

```text
index.html
styles.css
app.js
```

Trong `app.js`, sửa hằng số đầu file:

```javascript
const APPS_SCRIPT_URL = 'DÁN_URL_APPS_SCRIPT_KẾT_THÚC_BẰNG_EXEC';
```

Ví dụ:

```javascript
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycb.../exec';
```

Sau khi commit, chờ GitHub Pages cập nhật rồi tải lại bằng `Ctrl + F5`.

## 5. Tài khoản đầu tiên

Người quản trị nên đăng ký tài khoản đầu tiên trước. Tài khoản đầu tiên tự động có vai trò:

```text
Quản trị
```

Các tài khoản đăng ký sau có vai trò:

```text
Nhập liệu
```

Theo cấu hình mặc định, tài khoản mới được kích hoạt ngay. Muốn tài khoản mới phải chờ duyệt, đổi trong `Code.gs`:

```javascript
AUTO_APPROVE_REGISTRATION: true
```

thành:

```javascript
AUTO_APPROVE_REGISTRATION: false
```

Khi đó quản trị viên đổi trạng thái trong sheet `NGƯỜI DÙNG` từ `Chờ duyệt` sang `Hoạt động`.

## 6. Quên mật khẩu

Người dùng:

1. Chọn **Quên mật khẩu**.
2. Nhập tài khoản hoặc email.
3. Nhấn **Gửi mã xác nhận**.
4. Kiểm tra email và nhập mã 6 chữ số.
5. Nhập mật khẩu mới.
6. Nhấn **Đặt lại mật khẩu**.

Mã có hiệu lực 10 phút.

Nếu không nhận được email:

- Kiểm tra thư rác.
- Kiểm tra email trong sheet `NGƯỜI DÙNG`.
- Kiểm tra hạn mức MailApp.
- Quản trị viên có thể mở **Quản lý tài khoản → Đặt lại mật khẩu**, nhận mật khẩu tạm và gửi riêng cho người dùng.

## 7. Quy tắc tài khoản và mật khẩu

Tài khoản:

- 4–40 ký tự.
- Chỉ dùng chữ không dấu, số, dấu chấm, gạch ngang hoặc gạch dưới.

Mật khẩu:

- 8–72 ký tự.
- Có ít nhất một chữ và một số.

## 8. Nhập số liệu theo ngày

1. Mở **Tài khoản / Nhập số liệu**.
2. Đăng nhập.
3. Chọn ngày cần nhập.
4. Nhấn **Tải dữ liệu ngày**.
5. Nhập số liệu.
6. Nhấn **Lưu số liệu**.

ID dữ liệu có dạng:

```text
2026-07-31-NOI_TRU
```

Mở lại cùng ngày và cùng chỉ tiêu sẽ cập nhật dòng cũ, không tạo trùng.

## 9. Bộ lọc từ ngày đến ngày

Chọn:

```text
Phạm vi → Từ ngày đến ngày
```

Ví dụ:

```text
Từ ngày: 01/07/2026
Đến ngày: 05/07/2026
```

Ứng dụng chỉ lấy, cộng, báo cáo, xuất CSV và hiển thị nhật ký trong khoảng đó.

Khoảng tối đa là 3 năm.

## 10. Bảo mật và vận hành

- Không gửi mật khẩu qua nhóm chat công khai.
- Mật khẩu tạm do quản trị tạo chỉ hiển thị một lần.
- Khi người dùng đổi hoặc đặt lại mật khẩu, các phiên đăng nhập cũ bị thu hồi.
- Sau 5 lần nhập sai, tài khoản bị khóa tạm 15 phút.
- Phiên đăng nhập có hiệu lực 8 giờ.
- Trang Apps Script được nhúng trong GitHub bằng iframe và có cơ chế bắt tay nguồn gốc. Nếu đổi tài khoản GitHub hoặc tên miền, cập nhật:

```javascript
ALLOWED_EMBED_ORIGINS: ['https://thanhbds2011-droid.github.io']
```

- Không xóa hoặc sửa thủ công cột mật khẩu băm, muối, token và phiên bản phiên.
