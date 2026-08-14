# SCHEMA REALTIME DATABASE — Production 8.5.1

Tài liệu này mô tả phần dữ liệu liên quan trực tiếp đến Ứng dụng Phòng Y tế. Các node HSBA và nghiệp vụ khác dùng chung Firebase project không thuộc phạm vi thay đổi của 8.5.1.

## 1. Tổng hợp số liệu

```text
tongHopYTe/
  phanQuyen/{uid}/...
  danhMucChiTieu/{code}/...
  soLieuTheoNgay/YYYY-MM-DD/{code}/...
  lichSu/{month}/{historyId}/...
  nhatKy/{month}/{logId}/...
  congKhai/
    danhMucChiTieu/{code}/...
    soLieuTheoNgay/YYYY-MM-DD/{code}/...
```

Chỉ tiêu Chuyển viện/Tử vong được giao diện ghép từ thống kê dẫn xuất; không cần ghi chéo dữ liệu bệnh nhân vào node này. Khi chưa có điều chỉnh, giá trị dẫn xuất được dùng trực tiếp. Nếu người nhập liệu sửa sau khi đối soát, bản ghi chính thức được lưu tại `tongHopYTe/soLieuTheoNgay/{date}/{code}` và bản công khai tương ứng; lần điều chỉnh được ghi vào `tongHopYTe/lichSu/{month}`.

Từ 8.5.1, người dùng Tổng hợp Y tế có `active = true` được đọc `tongHopYTe/lichSu` để xem lịch sử điều chỉnh ngay trong màn hình Nhập liệu. Quyền ghi lịch sử vẫn chỉ phát sinh qua thao tác của tài khoản `admin`/`nhaplieu` hợp lệ và mỗi record lịch sử gắn UID/email từ Firebase Authentication.

## 2. Danh bạ ứng dụng

```text
yTeApp/
  nguoiDung/{uid}/
    email
    displayName
    photoURL
    provider
    active
    createdAt
    updatedAt
    lastLoginAt
```

## 3. Phân quyền Báo cáo

```text
baoCaoYTe/
  phanQuyen/{uid}/
    email
    displayName
    role: admin | nhaplieu | viewer
    active
    createdAt
    updatedAt
```

## 4. Hành trình chuyển viện — nguồn nghiệp vụ chính

```text
baoCaoYTe/
  hanhTrinhChuyenVien/{caseId}/
    thongTin/
      id
      doiTuong
      doiTuongNorm
      gioiTinh                 # optional với dữ liệu cũ, bắt buộc hành trình mới
      namSinh                  # optional với dữ liệu cũ, bắt buộc hành trình mới
      theBHYT
      theBHYTNorm
      doiTuongKey
      hinhThucChuyen: CAP_CUU | TAI_KHAM | CHUYEN_VIEN | KHAC
      hinhThucChuyenKhac
      noiDiBanDau
      noiHienTai
      lyDoHienTai
      tinhTrangChanDoanHienTai
      ghiChu
      trangThaiHienTai:
        DANG_THEO_DOI |
        TAI_KHAM |
        DANG_DIEU_TRI |
        CHUYEN_TIEP_BENH_VIEN_KHAC |
        TU_VONG_TAI_BENH_VIEN |
        DA_VE_TRUNG_TAM
      trangThaiKyThuat: OPEN | CLOSED
      ngayGioDi
      ngayGioVe
      tinhTrangKhiVe
      thuTuChang
      version
      createdAt / createdBy*
      updatedAt / updatedBy*

    chang/{stageId}/
      id
      caseId
      thuTu
      noiDi
      noiDen
      hinhThucChuyen
      hinhThucChuyenKhac
      lyDo
      tinhTrangChanDoan
      ghiChu
      trangThaiSauChang
      thoiDiem
      uid / email / displayName

    lichSu/{historyId}/
      id
      caseId
      loaiSuKien:
        MO_HANH_TRINH |
        CAP_NHAT_TRANG_THAI |
        CHUYEN_TIEP |
        DA_VE_TRUNG_TAM |
        TU_VONG_TAI_BENH_VIEN
      trangThaiTruoc
      trangThaiSau
      noiTruoc
      noiSau
      hinhThucChuyen
      hinhThucChuyenKhac
      lyDo
      tinhTrangChanDoan
      ghiChu
      tinhTrangKhiVe
      uid / email / displayName
      createdAt
```

`TU_VONG_TAI_BENH_VIEN` là trạng thái kết thúc của chính hành trình; không tạo thêm một report tử vong độc lập cho cùng trường hợp.

## 5. Chỉ mục chống mở trùng

```text
baoCaoYTe/
  hanhTrinhDangMo/{doiTuongKey}: {caseId}
```

Được claim bằng Firebase Transaction. Khi hành trình kết thúc, chỉ mục được giải phóng.

## 6. Tử vong tại Trung tâm

`baoCaoYTe/baoCao` được giữ để tương thích dữ liệu cũ. Từ 8.5.1, bản ghi độc lập mới chỉ được tạo cho trường hợp **Tử vong tại Trung tâm**:

```text
baoCaoYTe/
  baoCao/{reportId}/
    id
    loaiBaoCao: TU_VONG
    source: CENTER_DEATH
    hoTenBenhNhan
    hoTenNorm
    gioiTinh
    namSinh
    diaChi
    ngayBaoCao
    ngayTuVong
    noiTuVong: Trung tâm Bảo trợ xã hội Tân Hiệp
    nguyenNhan
    ghiChu
    trangThai
    version
    createdAt / createdBy*
    updatedAt / updatedBy*
```

Bản ghi cũ `CHUYEN_VIEN` hoặc tử vong ngoài Trung tâm không bị xóa. Ứng dụng không tạo mới `CHUYEN_VIEN` standalone.

## 7. Thống kê dẫn xuất dùng chung

```text
baoCaoYTe/
  congKhaiThongKe/
    chuyenVienTheoNgay/
      YYYY-MM-DD/
        {caseId}: true

    tuVongTheoNgay/
      YYYY-MM-DD/
        HOSP_{caseId}: true
        CENTER_{reportId}: true
```

- Mỗi hành trình mới = 01 marker Chuyển viện.
- Hành trình kết thúc bằng tử vong tại bệnh viện = 01 marker Tử vong.
- Tử vong tại Trung tâm = 01 marker Tử vong.
- Marker không chứa dữ liệu cá nhân.
- Tổng hợp số liệu đọc marker để tạo giá trị tự động realtime. Nếu có bản ghi điều chỉnh thủ công cùng ngày/chỉ tiêu, bản ghi đã kiểm tra là giá trị chính thức và giá trị marker vẫn được hiển thị làm tham chiếu.

## 8. Lịch sử và nhật ký

```text
baoCaoYTe/
  lichSu/{reportId}/{historyId}/...
  nhatKy/{month}/{logId}/...
```

Hành trình có lịch sử riêng tại `hanhTrinhChuyenVien/{caseId}/lichSu`; nhật ký chung vẫn được ghi để phục vụ quản trị/audit.

## 9. Tương thích ngược

- Không migration hàng loạt hành trình cũ.
- Hành trình cũ thiếu `gioiTinh`, `namSinh`, `ghiChu` vẫn đọc được.
- Không xóa dữ liệu báo cáo/chuyển viện legacy.
- Không dùng Firestore.
- Không thay Firebase Authentication.
