# ROLLBACK

## Trước khi đánh dấu productionActivated

Nếu migration có vấn đề và chưa có người dùng production ghi dữ liệu:

1. Chạy `YTE_rollbackMigrationBeforeCutover()`.
2. Node `tongHopYTe` sẽ bị xóa.
3. Các node HSBA không bị tác động.
4. GitHub/Apps Script V6.7 cũ vẫn tiếp tục dùng Google Sheet.

## Sau khi đã productionActivated

Không dùng hàm xóa migration.

Rollback an toàn:

1. Rollback GitHub repository về commit V6.7 (iframe Apps Script).
2. Sử dụng lại Apps Script + Google Sheet cũ.
3. Giữ nguyên `tongHopYTe` trên Firebase để bảo toàn dữ liệu mới phát sinh và phục vụ đối chiếu.
4. Không xóa Firebase Authentication user hoặc node HSBA.

Muốn nhập ngược dữ liệu mới từ Firebase về Sheet phải thực hiện một migration ngược riêng, không xóa dữ liệu thủ công.
