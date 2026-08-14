# CHANGELOG — Runtime/PWA 9.3.0

**Hệ thống:** Tổng hợp số liệu Phòng Y tế  
**Business Stable baseline:** v1.0  
**Runtime/PWA:** 9.3.0  
**Ngày:** 14/08/2026

## UI/UX

- Header desktop: ưu tiên tên **Trung tâm Bảo trợ xã hội Tân Hiệp**; “Ứng dụng Phòng Y tế” là secondary label.
- Sidebar: “Chức năng” trở thành section heading rõ; active state giảm độ nặng.
- Nhập liệu: workspace gọn, giá trị hiện tại là visual focus; record đã có chuyển sang hành động rõ **Sửa / Lịch sử / Xóa**.
- Báo cáo: icon cạnh “Chuyển viện & tử vong” nhỏ hơn; mật độ desktop được cân lại.
- Form Lập chuyển viện: grid 5/2/2/3 cho nhân thân; các hàng chuyển viện cân đối; Hình thức chuyển/Nơi đi và Nơi đến/Lý do có nhịp rõ.
- History: bỏ action tạo “Tử vong tại Trung tâm” khỏi toolbar.
- Workspace “Lập chuyển viện”: bổ sung selector nghiệp vụ **Chuyển viện / Tử vong tại Trung tâm**; Center Death vẫn dùng form và schema cũ.
- Menu dấu `...`: popover dùng viewport positioning, tự lật lên trên khi gần đáy màn hình.
- Modal readonly có footer **Đóng**: ẩn nút X dư thừa.

## Business Change có chủ đích

### Xóa số liệu thủ công

- Thêm `deleteDailyDataFirebase()` và action `deleteDailyData`.
- Chỉ cho phép xóa daily record thủ công.
- Chặn xóa Chuyển viện/Tử vong tự động.
- Kiểm tra `expectedVersion` trước khi xóa.
- Multi-location update:
  - `tongHopYTe/soLieuTheoNgay/{date}/{code}` → `null`;
  - `tongHopYTe/congKhai/soLieuTheoNgay/{date}/{code}` → `null`;
  - thêm record `tongHopYTe/lichSu/{YYYY-MM}/{historyId}`;
  - thêm record `tongHopYTe/nhatKy/{YYYY-MM}/{logId}`.
- Bắt buộc lý do xóa tối thiểu 3 ký tự.
- History hiển thị rõ `giá trị cũ → Đã xóa`.

### Bỏ Tái khám khỏi tạo mới

- `TRANSFER_TYPES` của luồng create chỉ còn `CAP_CUU`, `CHUYEN_VIEN`, `KHAC`.
- Option `TAI_KHAM` bị loại khỏi select Hình thức chuyển khi tạo mới.
- `TAI_KHAM` vẫn giữ trong status/label/legacy rendering để dữ liệu cũ không bị hỏng.

## Không thay đổi

- Firebase roots.
- Google Authentication.
- Permission model.
- Identity/duplicate algorithm.
- Journey/death marker semantics.
- Center Death schema và duplicate logic.
- Public/private split.
- Audit/history cũ.
- HSBA.
- Không dùng Firestore.
