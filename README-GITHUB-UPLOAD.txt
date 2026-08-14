ỨNG DỤNG PHÒNG Y TẾ - GITHUB UPLOAD v9.0.0

Đây là gói đã dọn sạch để đưa lên GitHub Pages.

ĐƯA TOÀN BỘ CÁC FILE/THƯ MỤC TRONG GÓI NÀY LÊN THƯ MỤC GỐC REPOSITORY.

KHÔNG CÓ FIREBASE RULES TRONG GÓI NÀY.
Firebase Realtime Database Rules phải được quản lý/publish trong Firebase Console và merge vào full Rules đang dùng chung với HSBA; không dán đè full Rules chỉ từ ứng dụng Phòng Y tế.

Nếu repo dùng GitHub Actions để deploy Pages, workflow đã nằm đúng tại:
.github/workflows/deploy-pages.yml

Nếu repo đang dùng Settings > Pages > Deploy from a branch thì workflow này không bắt buộc; có thể giữ nguyên cũng không ảnh hưởng source runtime, nhưng nên chọn một cơ chế deploy duy nhất.
