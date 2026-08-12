# TEST REPORT – BUILD 7.0.0

Các kiểm tra tĩnh đã chạy trên bộ build:

- `app.js`: JavaScript syntax OK (`node --check`).
- `service-worker.js`: JavaScript syntax OK.
- `migration/Code.gs`: V8 JavaScript syntax OK.
- `firebase-rules.json`: JSON syntax OK.
- `migration/appsscript.json`: JSON syntax OK.
- `manifest.webmanifest`: JSON syntax OK.
- Đối chiếu DOM: không có ID tĩnh nào mà JavaScript tham chiếu nhưng HTML bị thiếu.
- Đối chiếu Rules: tất cả node Rules HSBA cũ có nội dung giống 100% source đã cung cấp.
- Node Rules mới duy nhất ở cấp root: `tongHopYTe`.
- Frontend production không còn `google.script.run` hoặc `APPS_SCRIPT_URL`.
- Frontend production không sử dụng Cloud Firestore.

Lưu ý: kiểm thử runtime thực tế (Firebase Authentication provider, Authorized domains,
Rules publish, quyền IAM Apps Script migration và dữ liệu production) phải thực hiện trong
Firebase/GitHub của người dùng theo `DEPLOYMENT.md`.
