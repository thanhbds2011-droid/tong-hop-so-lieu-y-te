# 9.5.6 — Personalized Greeting & UX Refinement

Business Stable v1.0 is unchanged. This release is UI-only.

- Personalized greeting after authentication: `Xin chào, <tên gọi>`.
- Greeting uses the preferred display name and takes the final Vietnamese name token.
- Desktop greeting is placed in the application header; PWA greeting is placed under `Phòng Y tế`.
- Removed the duplicate top `Đăng nhập` CTA while the dedicated login screen is active.
- Admin account cards now keep the primary role action visible and group secondary/destructive actions under `•••`.
- Mobile admin cards are more compact: role selector + primary action + `•••`.
- Desktop/PWA header treatment is visually consistent and neutral; pink remains the primary interaction accent.
- Dashboard metric cards are slightly more compact and metadata contrast is improved.
- Desktop quick-entry workspace is constrained to a more intentional reading width.
- No Firebase path, schema, permission model, realtime listener, journey logic, death logic, or database rule was changed.
