# UI/UX REDESIGN — TỔNG HỢP SỐ LIỆU PHÒNG Y TẾ

- Baseline nghiệp vụ: BUSINESS STABLE v1.0
- Runtime/PWA: 9.2.1
- UI redesign build: 2026-08-14 / v1
- Phạm vi: presentation layer only

## Những phần đã thiết kế lại

1. App shell desktop: header sáng, sidebar 4 chức năng, khoảng trắng và chiều rộng nội dung tối ưu cho màn hình lớn.
2. Tổng quan: filter bar gọn, card chỉ tiêu hiện đại, hierarchy số liệu rõ hơn.
3. Nhập liệu: desktop 2 vùng Chọn chỉ tiêu / Chi tiết & giá trị; mobile 1 cột, action sticky.
4. Chuyển viện & tử vong: 3 KPI, tab nghiệp vụ dạng segmented control, danh sách ca và form rõ nhóm thông tin.
5. Quản trị: tab gọn, toolbar rõ, bảng desktop và card hóa trên mobile.
6. Modal/dialog: desktop modal tập trung; mobile chuyển cảm giác bottom-sheet.
7. Login / chờ cấp quyền / offline / update UI đồng bộ cùng design system.
8. Mobile/PWA: bottom navigation 4 mục, touch target lớn, giảm bảng ngang và tránh desktop thu nhỏ.

## Những phần không thay đổi

- app.js
- reports.js
- journeys.js
- app-config.js
- ui.js
- update-manager.js

Không thay Firebase path, schema, Authentication, permission model, role/status code, identity/dedup logic, reporting/counting rules, audit/history hay business dates.

## File UI mới / file presentation có thay đổi

- ui-redesign.css (mới)
- index.html (chỉ thêm stylesheet, body class và subtitle UI; giữ nguyên toàn bộ DOM ID)
- offline.html (đồng bộ theme)
- manifest.webmanifest (theme/background color)
- service-worker.js (cache thêm ui-redesign.css; business/runtime version vẫn 9.2.1)

## Regression tĩnh

- JavaScript syntax: PASS toàn bộ JS.
- JSON manifest/version: PASS.
- CSS parse: PASS.
- DOM IDs: 258, không trùng.
- So với baseline: không mất/thêm DOM ID.
- Static JavaScript -> DOM ID: không thiếu.
- Firestore scan: không phát hiện.
- Business core checksum: UNCHANGED.

## Triển khai

Có thể dán đè toàn bộ source lên nhánh thử nghiệm hoặc GitHub Pages staging trước. Do đây là UI CHANGE, nên nên smoke-test trên desktop + PWA mobile với tài khoản thật trước khi đưa vào production.
