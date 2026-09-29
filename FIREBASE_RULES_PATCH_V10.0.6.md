# FIREBASE RULES PATCH — v10.0.6

## Mục tiêu
Sửa lỗi `permission_denied` khi thêm/sửa/xóa người trong danh sách **Điều trị lao** và **Chuyển Trung tâm**.

## Nguyên nhân
Rules hiện tại tại:

`tongHopYTe/chiTietChiTieu/$date/$code/$detailId/.validate`

chỉ cho phép khi **tên hiển thị** của danh mục bằng chính xác một trong các chuỗi như `Điều trị lao`, `Chuyển Trung tâm`, `Chuyển về Trung tâm`, `Chuyển vào Trung tâm`.
Frontend lại nhận dạng không phân biệt hoa/thường. Vì vậy tên thực tế `Chuyển trung tâm` vẫn mở đúng form nhưng Rules từ chối ghi.

## Cách sửa an toàn
KHÔNG dán đè toàn bộ Rules dùng chung HSBA.
Chỉ thay biểu thức `.validate` của node:

`tongHopYTe -> chiTietChiTieu -> $date -> $code -> $detailId`

bằng biểu thức dưới đây.

```json
".validate": "newData.exists() && (($code == 'DIEU_TRI_LAO' || $code == 'DIEUTRILAO' || $code == 'CHUYEN_TRUNG_TAM' || $code == 'CHUYENTRUNGTAM' || $code == 'CHUYEN_VE_TRUNG_TAM' || $code == 'CHUYENVETRUNGTAM' || $code == 'CHUYEN_VAO_TRUNG_TAM' || $code == 'CHUYENVAOTRUNGTAM') || root.child('tongHopYTe').child('danhMucChiTieu').child($code).child('ten').val() == 'Điều trị lao' || root.child('tongHopYTe').child('danhMucChiTieu').child($code).child('ten').val() == 'Chuyển Trung tâm' || root.child('tongHopYTe').child('danhMucChiTieu').child($code).child('ten').val() == 'Chuyển trung tâm' || root.child('tongHopYTe').child('danhMucChiTieu').child($code).child('ten').val() == 'Chuyển về Trung tâm' || root.child('tongHopYTe').child('danhMucChiTieu').child($code).child('ten').val() == 'Chuyển về trung tâm' || root.child('tongHopYTe').child('danhMucChiTieu').child($code).child('ten').val() == 'Chuyển vào Trung tâm' || root.child('tongHopYTe').child('danhMucChiTieu').child($code).child('ten').val() == 'Chuyển vào trung tâm') && newData.hasChildren(['id','date','code','metricName','hoTen','hoTenNorm','gioiTinh','namSinh','status','createdAt','createdByUid','createdByEmail','createdByName','updatedAt','updatedByUid','updatedByEmail','updatedByName','deletedAt','deletedByUid','deletedByEmail','deletedByName']) && newData.child('id').isString() && newData.child('id').val() == $detailId && newData.child('id').val().length > 0 && newData.child('id').val().length <= 180 && newData.child('date').isString() && newData.child('date').val() == $date && newData.child('date').val().matches(/^\\d{4}-\\d{2}-\\d{2}$/) && newData.child('code').isString() && newData.child('code').val() == $code && newData.child('metricName').isString() && newData.child('metricName').val().length >= 2 && newData.child('metricName').val().length <= 150 && newData.child('hoTen').isString() && newData.child('hoTen').val().length >= 2 && newData.child('hoTen').val().length <= 150 && newData.child('hoTenNorm').isString() && newData.child('hoTenNorm').val().length >= 2 && newData.child('hoTenNorm').val().length <= 200 && newData.child('gioiTinh').isString() && (newData.child('gioiTinh').val() == 'Nam' || newData.child('gioiTinh').val() == 'Nữ') && newData.child('namSinh').isNumber() && newData.child('namSinh').val() >= 1900 && newData.child('namSinh').val() <= 2100 && newData.child('status').isString() && (newData.child('status').val() == 'ACTIVE' || newData.child('status').val() == 'DELETED') && newData.child('createdAt').isNumber() && newData.child('createdByUid').isString() && newData.child('createdByEmail').isString() && newData.child('createdByName').isString() && newData.child('createdByName').val().length <= 150 && newData.child('updatedAt').isNumber() && newData.child('updatedByUid').isString() && newData.child('updatedByUid').val() == auth.uid && newData.child('updatedByEmail').isString() && newData.child('updatedByEmail').val() == auth.token.email && newData.child('updatedByName').isString() && newData.child('updatedByName').val().length <= 150 && newData.child('deletedAt').isNumber() && newData.child('deletedByUid').isString() && newData.child('deletedByEmail').isString() && newData.child('deletedByName').isString() && newData.child('deletedByName').val().length <= 150 && ((!data.exists() && newData.child('createdByUid').val() == auth.uid && newData.child('createdByEmail').val() == auth.token.email) || (data.exists() && newData.child('createdAt').val() == data.child('createdAt').val() && newData.child('createdByUid').val() == data.child('createdByUid').val() && newData.child('createdByEmail').val() == data.child('createdByEmail').val() && newData.child('createdByName').val() == data.child('createdByName').val())) && ((newData.child('status').val() == 'ACTIVE' && newData.child('deletedAt').val() == 0 && newData.child('deletedByUid').val() == '' && newData.child('deletedByEmail').val() == '' && newData.child('deletedByName').val() == '') || (newData.child('status').val() == 'DELETED' && (auth.token.email == 'thanhbds2011@gmail.com' || (root.child('tongHopYTe').child('phanQuyen').child(auth.uid).child('active').val() == true && root.child('tongHopYTe').child('phanQuyen').child(auth.uid).child('role').val() == 'admin') || (root.child('baoCaoYTe').child('phanQuyen').child(auth.uid).child('active').val() == true && root.child('baoCaoYTe').child('phanQuyen').child(auth.uid).child('role').val() == 'admin')) && newData.child('deletedAt').val() > 0 && newData.child('deletedByUid').val() == auth.uid && newData.child('deletedByEmail').val() == auth.token.email))"
```

## Lưu ý
- Không xóa node `yTeApp/yeuCauDoiSoat` hoặc Rules HSBA khác.
- Không thay các rule `soLieuTheoNgay`, `lichSu`, `nhatKy` trong hotfix này.
- Sau khi Publish Rules, hard refresh/PWA update rồi thử lại thêm một người vào `Chuyển trung tâm`.
