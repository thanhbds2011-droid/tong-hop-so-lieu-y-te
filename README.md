# Tổng hợp số liệu Phòng Y tế — GitHub Pages V6

Bộ mã nguồn này là lớp giao diện GitHub Pages/PWA dùng để mở Web App Google Apps Script của **Trung tâm Bảo trợ xã hội Tân Hiệp**.

## Chức năng

- Hiển thị Web App Apps Script trong một khung toàn màn hình.
- Giao diện chờ nhẹ, rõ trạng thái kết nối.
- Tự phát hiện mất mạng và tự kết nối lại.
- Nút tải lại và mở Web App trực tiếp.
- Hỗ trợ cài lên màn hình chính dưới dạng PWA.
- Hoạt động tốt trên máy tính, máy tính bảng và điện thoại.
- Tự động triển khai bằng GitHub Actions.
- Không dùng thư viện ngoài, không cần cài Node.js hay chạy lệnh build.

## Bước 1 — Lấy URL Apps Script

1. Mở dự án Google Apps Script.
2. Chọn **Triển khai → Quản lý quá trình triển khai**.
3. Chỉnh sửa bản triển khai Web App hiện tại hoặc tạo bản mới.
4. Sao chép URL có dạng:

   ```text
   https://script.google.com/macros/s/MA_TRIEN_KHAI/exec
   ```

Luôn dùng URL kết thúc bằng `/exec`, không dùng URL `/dev` khi đưa vào sử dụng chính thức.

## Bước 2 — Cấu hình GitHub

Mở tệp `app-config.js` và thay:

```js
APPS_SCRIPT_URL: 'DAN_URL_WEB_APP_APPS_SCRIPT_VAO_DAY',
```

thành URL thật:

```js
APPS_SCRIPT_URL: 'https://script.google.com/macros/s/MA_TRIEN_KHAI/exec',
```

Chỉ cần thay đúng một dòng này. Không đưa mật khẩu, token hoặc thông tin bí mật vào mã GitHub.

## Bước 3 — Đưa toàn bộ mã lên GitHub

1. Tạo repository mới trên GitHub.
2. Đặt nhánh chính là `main`.
3. Tải **toàn bộ nội dung trong thư mục này** lên thư mục gốc của repository.
4. Vào **Settings → Pages**.
5. Tại **Build and deployment → Source**, chọn **GitHub Actions**.
6. Mở thẻ **Actions** và đợi quy trình `Deploy GitHub Pages` hoàn thành.

Địa chỉ ứng dụng thường có dạng:

```text
https://TEN_TAI_KHOAN.github.io/TEN_REPOSITORY/
```

Quy trình triển khai sử dụng các phiên bản action được tài liệu GitHub Pages hiện hành hướng dẫn: `checkout@v6`, `configure-pages@v5`, `upload-pages-artifact@v4`, `deploy-pages@v4`.

## Cấu trúc mã nguồn

```text
github-pages-v6/
├── .github/workflows/deploy-pages.yml  # Tự động triển khai GitHub Pages
├── apps-script/Code.gs                 # Bản Apps Script V6 đi kèm
├── assets/                             # Biểu tượng PWA
├── app-config.js                       # Nơi dán URL Apps Script
├── app.js                              # Điều khiển tải, mạng và khung ứng dụng
├── index.html                          # Trang chính GitHub Pages
├── manifest.webmanifest                # Cấu hình cài ứng dụng PWA
├── offline.html                        # Màn hình mất mạng
├── service-worker.js                   # Bộ nhớ đệm giao diện PWA
├── styles.css                          # Toàn bộ giao diện
├── robots.txt                          # Không cho máy tìm kiếm lập chỉ mục
└── .nojekyll                           # Tắt xử lý Jekyll không cần thiết
```

## Cập nhật phiên bản sau này

1. Cập nhật `apps-script/Code.gs` trong Apps Script và triển khai phiên bản mới.
2. Nếu sửa đúng bản triển khai hiện tại thì URL `/exec` không đổi, GitHub không cần sửa.
3. Nếu tạo một deployment hoàn toàn mới, cập nhật lại `APPS_SCRIPT_URL` trong `app-config.js`.
4. Đẩy thay đổi lên nhánh `main`; GitHub Actions tự triển khai.

## Xử lý lỗi thường gặp

### Trang báo “Chưa cấu hình URL Apps Script”

Kiểm tra `APPS_SCRIPT_URL` trong `app-config.js` và bảo đảm URL kết thúc bằng `/exec`.

### Khung ứng dụng trắng hoặc không đăng nhập được

- Kiểm tra Apps Script đã được triển khai dưới dạng **Web App**.
- Kiểm tra quyền truy cập của deployment phù hợp với người sử dụng.
- Bảo đảm `doGet()` trong Apps Script có `XFrameOptionsMode.ALLOWALL`.
- Mở URL `/exec` trực tiếp trong trình duyệt để xác nhận Web App hoạt động.

### GitHub Pages vẫn hiện giao diện cũ

- Đợi quy trình trong thẻ **Actions** hoàn thành.
- Nhấn `Ctrl + F5` trên máy tính.
- Với PWA trên điện thoại, đóng hoàn toàn ứng dụng rồi mở lại.

## Lưu ý bảo mật

GitHub Pages và URL Apps Script là công khai. Việc bảo vệ dữ liệu phải do phần Apps Script đảm nhiệm bằng tài khoản đăng nhập, phiên làm việc và phân quyền. Không lưu mật khẩu hoặc khóa bí mật trong repository.

Tài liệu tham khảo: [GitHub Pages — Using custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
