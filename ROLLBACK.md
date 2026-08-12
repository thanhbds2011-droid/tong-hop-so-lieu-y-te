# ROLLBACK 8.0.0

Nếu module Báo cáo gặp lỗi sau deploy:

1. Khôi phục source GitHub về commit trước 8.0.0.
2. Giữ nguyên dữ liệu `baoCaoYTe`; source cũ không đọc node này nên không ảnh hưởng Tổng hợp số liệu.
3. Nếu cần rollback Rules, chỉ bỏ hai node mới `yTeApp` và `baoCaoYTe` sau khi đã export dữ liệu của chúng.
4. Không thay đổi các node HSBA hoặc `tongHopYTe`.

Không xóa dữ liệu báo cáo production khi chưa export JSON.
