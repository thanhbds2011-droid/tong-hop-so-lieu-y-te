# CHECKLIST KIỂM THỬ PRODUCTION v8.6.0

## A. Đăng nhập và phân quyền

- [ ] Đăng nhập Google thành công.
- [ ] Người chỉ có quyền Tổng hợp vào được Tổng hợp nhưng không có thao tác Báo cáo ngoài quyền.
- [ ] Người chỉ có quyền Báo cáo vào được Báo cáo.
- [ ] Viewer không thấy/thực hiện action ghi dữ liệu.
- [ ] Admin/nhaplieu thao tác đúng quyền.
- [ ] HSBA vẫn đăng nhập/phân quyền/đọc ghi như trước; không thay Rules HSBA.

## B. Chuyển viện và dashboard

### TEST 01 — Lập chuyển viện
- [ ] Lập 1 hành trình hôm nay.
- [ ] `Đang ngoài Trung tâm` tăng 1.
- [ ] `Lượt chuyển viện` hôm nay tăng 1.
- [ ] Tổng hợp số liệu → Chuyển viện tự động tăng 1 realtime.
- [ ] Không cần F5.

### TEST 02 — Chuyển tiếp bệnh viện
- [ ] Cập nhật `Chuyển tiếp bệnh viện khác`.
- [ ] Hành trình có chặng mới.
- [ ] `Lượt chuyển viện` KHÔNG tăng thêm.

### TEST 03 — Đã về Trung tâm
- [ ] Chọn `Đã về Trung tâm`.
- [ ] Hành trình OPEN → CLOSED.
- [ ] Biến mất khỏi Đang theo dõi.
- [ ] Xuất hiện trong Lịch sử.
- [ ] Lượt chuyển viện không tăng thêm.

### TEST 04 — Tử vong tại bệnh viện
- [ ] Trên hành trình OPEN chọn `Tử vong tại bệnh viện`.
- [ ] Hành trình CLOSED.
- [ ] Tử vong hôm nay tăng 1 theo NGÀY KẾT THÚC/TỬ VONG.
- [ ] Lượt chuyển viện không tăng thêm.
- [ ] Lịch sử hiển thị `Tử vong tại bệnh viện`.
- [ ] Không tạo thêm báo cáo tử vong độc lập.

## C. Tử vong tại Trung tâm

### TEST 05 — Ghi nhận từ Lịch sử
- [ ] Không còn tab riêng `Tử vong tại Trung tâm`.
- [ ] Vào Lịch sử → bấm `Ghi nhận tử vong tại Trung tâm`.
- [ ] Lưu thành công và vẫn ở Lịch sử.
- [ ] Record xuất hiện trong danh sách hợp nhất.
- [ ] Tử vong hôm nay tăng 1.
- [ ] Lượt chuyển viện không tăng.
- [ ] Nếu đối tượng đang có hành trình OPEN, hệ thống chặn và hướng dẫn cập nhật `Tử vong tại bệnh viện` trên hành trình.

### TEST 06 — Chỉnh sửa/xóa mềm tử vong Trung tâm
- [ ] Sửa ngày tử vong: marker ngày cũ được bỏ, ngày mới được thêm.
- [ ] Admin xóa mềm: record biến khỏi lịch sử active và marker tử vong giảm tương ứng.
- [ ] Lịch sử audit vẫn còn.

## D. Lịch sử

- [ ] Không còn 3 KPI nhỏ `Đã về / Tử vong BV / Tử vong TT`.
- [ ] Bộ lọc hiển thị số lượng trong option.
- [ ] Tìm kiếm được tên/BHYT/nơi đến/nguyên nhân.
- [ ] `Xem hành trình` mở timeline đúng.
- [ ] Tử vong tại Trung tâm có Xem/Sửa; Xóa chỉ đúng quyền.

## E. Chống trùng và chuẩn hóa họ tên

### TEST 07 — Chuẩn hóa tên
- [ ] `nguyễn văn a` → `Nguyễn Văn A`.
- [ ] `NGUYỄN VĂN A` → `Nguyễn Văn A`.
- [ ] `  nguyễn   văn   a  ` → `Nguyễn Văn A`.

### TEST 08 — Cùng tên khác năm sinh
- [ ] Nguyễn Văn A / Nam / 1958 được tạo.
- [ ] Nguyễn Văn A / Nam / 1970 vẫn được tạo như đối tượng khác.

### TEST 09 — BHYT
- [ ] Cùng BHYT + cùng profile đang OPEN → chặn tạo trùng.
- [ ] Cùng BHYT nhưng họ tên/giới tính/năm sinh khác → cảnh báo dữ liệu không khớp.
- [ ] Không có BHYT → identity dùng họ tên + giới tính + năm sinh.

## F. Tổng hợp số liệu tự động + đối soát

### TEST 10 — Không điều chỉnh
- [ ] Chuyển viện tự động = 2 → Tổng hợp hiển thị chính thức 2.
- [ ] Có badge/metadata `Tự động`.
- [ ] Vẫn có nút `Sửa` và `Lịch sử`.

### TEST 11 — Điều chỉnh thủ công
- [ ] Tự động = 2, nhập chính thức = 1.
- [ ] Bắt buộc lý do tối thiểu hợp lệ.
- [ ] Tổng hợp hiển thị chính thức 1.
- [ ] Vẫn hiển thị tham chiếu tự động 2 và trạng thái `Đã điều chỉnh`.
- [ ] Marker/Báo cáo thay đổi về sau KHÔNG ghi đè số chính thức 1.
- [ ] Lịch sử có 2 → 1, autoValue=2, lý do, tên người và thời gian.
- [ ] Không hiển thị Gmail trong lịch sử nghiệp vụ.

### TEST 12 — Giá trị 0
- [ ] Record thủ công `0` vẫn được coi là đã ghi nhận.
- [ ] Không có record và auto=0 thì không sinh card `Chưa ghi nhận` thừa.

## G. Tên người chịu trách nhiệm

### TEST 13
- [ ] Quản trị đặt UID của tài khoản thành `Nguyễn Chí Thạnh`.
- [ ] Lập chuyển viện → Người nhập hiện `Nguyễn Chí Thạnh`.
- [ ] Cập nhật → timeline/card hiện đúng tên chuẩn.
- [ ] Tử vong tại Trung tâm → lịch sử hiện tên chuẩn.
- [ ] Điều chỉnh Tổng hợp → lịch sử hiện tên chuẩn.
- [ ] Gmail chỉ còn ở màn hình Quản trị phục vụ nhận diện tài khoản.

## H. Realtime nhiều thiết bị

### TEST 14
- [ ] Máy A lập chuyển viện → Máy B thấy ngay Đang ngoài + Lượt chuyển viện + Tổng hợp.
- [ ] Máy A cập nhật tử vong → Máy B thấy ngay tử vong/lịch sử.
- [ ] Không cần F5 hoặc Sync.
- [ ] Mất mạng rồi có lại → listener reconnect và nhận dữ liệu mới.

## I. Draft / Update Manager

### TEST 15
- [ ] Đang nhập Lập chuyển viện, chuyển tab/đóng → cảnh báo bỏ dữ liệu chưa lưu.
- [ ] Đang nhập tử vong tại Trung tâm, X/Quay lại/Esc → cảnh báo.
- [ ] Có phiên bản mới khi form dirty → `Cập nhật ngay` không reload âm thầm; cảnh báo trước.
- [ ] Sau lưu thành công form reset và đóng đúng luồng.

## J. PWA / responsive

- [ ] 320 / 375 / 390 / 430px không tràn ngang.
- [ ] Input/button >= 44px trên mobile.
- [ ] Bottom navigation không che nội dung, safe-area hoạt động.
- [ ] Modal phù hợp viewport và keyboard mobile.
- [ ] Desktop không quá rộng/rỗng; sidebar/workspace hiển thị ổn.
- [ ] Service Worker cache = v8.6.0.
- [ ] Update Manager phát hiện v8.6.0, không yêu cầu xóa cache/cài lại PWA.
- [ ] Offline shell mở được khi mất mạng (không kỳ vọng đọc/ghi Firebase khi offline).

## K. Đối soát dữ liệu hiện hữu

- [ ] Sau khi admin/nhaplieu mở Báo cáo lần đầu, marker thống kê còn thiếu được tự bổ sung từ hành trình/tử vong hiện hữu.
- [ ] Không sửa record nghiệp vụ gốc.
- [ ] Không tạo thêm hành trình/báo cáo giả.
- [ ] Số liệu tự động ngày cũ phản ánh đúng hành trình hiện có sau đối soát.
