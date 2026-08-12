# SCHEMA REALTIME DATABASE — 8.0.1

## 1. Các node cũ
Toàn bộ Rules và dữ liệu của HSBA cùng `tongHopYTe` được giữ nguyên.

## 2. Danh bạ ứng dụng Y tế

```text
yTeApp/
  nguoiDung/
    {uid}/
      email
      displayName
      photoURL
      provider
      active
      createdAt
      updatedAt
      lastLoginAt
```

## 3. Quyền Báo cáo

```text
baoCaoYTe/
  phanQuyen/
    {uid}/
      email
      displayName
      role: admin | nhaplieu | viewer
      active: true | false
      source
      createdAt
      updatedAt
```

## 4. Báo cáo

```text
baoCaoYTe/
  baoCao/
    {reportId}/
      id
      loaiBaoCao: CHUYEN_VIEN | TU_VONG
      hoTenBenhNhan
      hoTenNorm
      gioiTinh
      namSinh
      diaChi
      ngayBaoCao
      ghiChu
      trangThai: active | deleted
      version

      # Chuyển viện
      chanDoan
      ngayChuyenVien
      noiChuyen
      noiDen

      # Tử vong
      nguyenNhan
      ngayTuVong
      noiTuVong

      createdAt
      createdByUid
      createdByEmail
      createdByName
      updatedAt
      updatedByUid
      updatedByEmail
      updatedByName
      source
```

`ngayBaoCao` luôn bằng `ngayChuyenVien` hoặc `ngayTuVong` để query chung.

## 5. Lịch sử

```text
baoCaoYTe/
  lichSu/
    {reportId}/
      {historyId}/
        reportId
        loaiBaoCao
        action: CREATE | UPDATE | DELETE
        beforeJson
        afterJson
        uid
        email
        displayName
        role
        createdAt
```

## 6. Nhật ký

```text
baoCaoYTe/
  nhatKy/
    YYYY-MM/
      {logId}/
        action
        content
        reportId
        loaiBaoCao
        dataDate
        uid
        email
        displayName
        role
        createdAt
```
