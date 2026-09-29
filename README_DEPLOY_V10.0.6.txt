TRIỂN KHAI v10.0.6

1. Sao lưu source v10.0.5 và Firebase Rules production hiện tại.
2. Dán đè toàn bộ source trong thư mục tong-hop-so-lieu-y-te-main lên cả hai repo GitHub Pages.
3. Publish GitHub Pages và kiểm tra /version.json = 10.0.6.
4. Mở FIREBASE_RULES_PATCH_V10.0.6.md. Chỉ thay biểu thức .validate tại tongHopYTe/chiTietChiTieu/$date/$code/$detailId. KHÔNG dán đè toàn bộ Rules dùng chung HSBA.
5. Publish Firebase Rules.
6. Hard refresh hoặc để PWA auto-update nhận 10.0.6.
7. Kiểm tra: thêm mới Chuyển trung tâm, thêm mới Điều trị lao, sửa người, ADMIN xóa người, tổng số realtime cập nhật, thiết bị thứ hai nhận thay đổi.

Không cần deploy lại Apps Script Gateway.
Không cần thay OneSignal config.

ROLLBACK
- Frontend: dán lại ZIP v10.0.5.
- Rules: khôi phục bản Rules đã backup trước bước 4.
- Không xóa dữ liệu Firebase khi rollback.
