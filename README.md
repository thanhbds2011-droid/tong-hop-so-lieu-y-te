# Bản giao diện V4 – chuyên nghiệp hơn cho desktop và điện thoại

## Điểm đã chỉnh
1. Chỉ còn **1 nút Đăng xuất** duy nhất ở góc phải trên.
2. Nút **Đồng bộ** đổi thành nút icon **↻** gọn hơn.
3. Font đổi sang **Be Vietnam Pro**.
4. Giao diện mobile chỉnh lại theo kiểu ứng dụng hơn:
   - header gọn hơn,
   - các tab nằm dạng lưới cố định dưới đáy màn hình,
   - nút thao tác lớn, dễ bấm.
5. GitHub Pages được nâng thành **PWA**:
   - có `manifest.json`,
   - có `sw.js`,
   - khi cài ra màn hình chính sẽ mở ở chế độ **standalone** (không hiện thanh địa chỉ như mở web thông thường, tùy thiết bị/trình duyệt hỗ trợ).

## File cần cập nhật
### Apps Script
- `Code.gs`

### GitHub
- `index.html`
- `manifest.json`
- `sw.js`
- `icon-192.png`
- `icon-512.png`

## Cách cập nhật
### 1) Apps Script
- Mở Apps Script.
- Xóa toàn bộ file `Code.gs` cũ.
- Dán file `Code.gs` mới.
- Lưu.
- Triển khai phiên bản mới.

### 2) GitHub Pages
Trong repo GitHub, thay/đưa thêm:
- `index.html`
- `manifest.json`
- `sw.js`
- `icon-192.png`
- `icon-512.png`

Commit thay đổi.

## Sau khi cập nhật
- Mở domain GitHub.
- Nhấn `Ctrl + F5` trên máy tính để xóa cache.
- Trên điện thoại, đóng tab cũ rồi mở lại.
- Nếu đã cài ứng dụng trước đó, nên gỡ bản cũ rồi cài lại từ GitHub Pages để nhận manifest/PWA mới.
