'use strict';

import { getApps, getApp, initializeApp } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js';
import {
  getDatabase,
  get,
  onValue,
  push,
  ref,
  runTransaction,
  serverTimestamp,
  update
} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js';

import { openReportPreview } from './report-preview.js';

const CFG = window.YTE_APP_CONFIG || {};
const OWNER_EMAIL = String(CFG.OWNER_EMAIL || '').trim().toLowerCase();
const REPORT_ROOT = 'baoCaoYTe';
const TONG_HOP_ROOT = 'tongHopYTe';
const YTE_APP_ROOT = 'yTeApp';
const REVIEW_ROOT = `${YTE_APP_ROOT}/yeuCauDoiSoat`;
const CENTER_NAME = 'Trung tâm Bảo trợ xã hội Tân Hiệp';
const OPEN_STATUSES = ['DANG_THEO_DOI', 'TAI_KHAM', 'DANG_DIEU_TRI', 'CHUYEN_TIEP_BENH_VIEN_KHAC'];
// TAI_KHAM vẫn được giữ trong OPEN_STATUSES/label để đọc dữ liệu legacy, nhưng không còn là hình thức được phép tạo mới.
const TRANSFER_TYPES = ['CAP_CUU', 'CHUYEN_VIEN', 'KHAC'];
const OTHER_DESTINATION = '__OTHER__';
const CLOSED_STATUSES = ['TU_VONG_TAI_BENH_VIEN', 'TU_VONG_TAI_NOI_KHAC', 'DA_VE_TRUNG_TAM'];
const ALL_STATUSES = [...OPEN_STATUSES, ...CLOSED_STATUSES];

const app = getApps().length ? getApp() : initializeApp(CFG.FIREBASE);
const auth = getAuth(app);
const db = getDatabase(app);

const state = {
  permission: null,
  tongHopPermission: null,
  subView: 'tracking',
  openCases: [],
  closedCases: [],
  selectedCase: null,
  selectedCaseRaw: null,
  loading: false,
  loadedAt: 0,
  initialized: false,
  refreshTimer: null,
  createBaseline: '',
  updateBaseline: '',
  lastFocus: null,
  liveUnsubscribe: null,
  transferStatsUnsubscribe: null,
  deathStatsUnsubscribe: null,
  displayNamesUnsubscribe: null,
  transferStatsToday: {},
  deathStatsToday: {},
  displayNames: {},
  reviewRequests: [],
  reviewUnsubscribe: null,
  reviewFocusId: '',
  reconcileTimer: null,
  reconciling: false
};

function $(id) { return document.getElementById(id); }
function notifyBusinessEvent(eventType, resourceId) {
  const api = window.YTE_NOTIFICATIONS;
  if (!api || typeof api.notifyBusinessEvent !== 'function') return;
  void api.notifyBusinessEvent(eventType, resourceId);
}
function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function normalizeEmail(value) { return String(value || '').trim().toLowerCase(); }
function normalizeText(value) {
  return String(value || '').trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/\s+/g, ' ');
}
function normalizeBHYT(value) {
  return String(value || '').toUpperCase().replace(/\s+/g, '').trim().slice(0, 40);
}
function formatPersonName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').split(' ').filter(Boolean).map((word) => {
    const lower = word.toLocaleLowerCase('vi-VN');
    return lower.charAt(0).toLocaleUpperCase('vi-VN') + lower.slice(1);
  }).join(' ');
}
function markerCount(raw, kind) {
  return Object.keys(raw || {}).filter((key) => {
    const active = raw[key] === true || raw[key] === 1 || raw[key] === '1';
    if (!active) return false;
    if (kind === 'death' && /^CENTER_/i.test(String(key))) return false;
    return true;
  }).length;
}
function preferredName(uid, fallback) {
  const custom = uid && state.displayNames && state.displayNames[uid] && state.displayNames[uid].displayName;
  return String(custom || fallback || '').trim() || '—';
}
function currentDisplayName() {
  const user = auth.currentUser;
  if (!user) return '—';
  return preferredName(user.uid, ((state.permission && state.permission.displayName) || (state.tongHopPermission && state.tongHopPermission.displayName)) || user.displayName || user.email || '—');
}
async function resolveCurrentDisplayName() {
  const user = auth.currentUser;
  if (!user) return '—';
  const cached = user.uid && state.displayNames && state.displayNames[user.uid] && String(state.displayNames[user.uid].displayName || '').trim();
  if (cached) return cached.slice(0, 150);
  try {
    const snap = await get(ref(db, `${YTE_APP_ROOT}/tenHienThi/${user.uid}`));
    if (snap.exists()) {
      const value = String(snap.child('displayName').val() || '').trim();
      if (value) {
        state.displayNames[user.uid] = { ...(state.displayNames[user.uid] || {}), displayName: value };
        return value.slice(0, 150);
      }
    }
  } catch (_) {}
  return currentDisplayName().slice(0, 150);
}
function validGender(value) { return value === 'Nam' || value === 'Nữ'; }
function validBirthYear(value) {
  const year = Number(value || 0);
  return Number.isInteger(year) && year >= 1900 && year <= new Date().getFullYear();
}
function iconSvg(name, className = 'journey-btn-icon') {
  const icons = {
    eye: '<path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6S2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.5"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
    home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
    pin: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    route: '<circle cx="6" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 6h4a4 4 0 0 1 4 4v0a4 4 0 0 1-4 4H8"/><path d="m10 12-2 2 2 2"/>',
    dots: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    activity: '<path d="M3 12h4l2-5 4 10 2-5h6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    person: '<circle cx="12" cy="7" r="3.5"/><path d="M5 21a7 7 0 0 1 14 0"/>'
  };
  const body = icons[name] || '';
  return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}
function patientFactsHtml(item) {
  const parts = [];
  if (validGender(item && item.gioiTinh)) parts.push(`<span>Giới tính: <b>${esc(item.gioiTinh)}</b></span>`);
  if (validBirthYear(item && item.namSinh)) parts.push(`<span>Sinh năm: <b>${esc(item.namSinh)}</b></span>`);
  return parts.length ? `<span class="journey-person-facts">${parts.join('<i aria-hidden="true">–</i>')}</span>` : '';
}
function isoDateAt(value) {
  const date = value instanceof Date ? value : new Date(Number(value || Date.now()));
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}
function todayIso() { return isoDateAt(Date.now()); }
function validIsoBusinessDate(value) {
  const text = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const [year, month, day] = text.split('-').map(Number);
  if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) return false;
  const probe = new Date(Date.UTC(year, month - 1, day));
  return probe.getUTCFullYear() === year && probe.getUTCMonth() === month - 1 && probe.getUTCDate() === day;
}
function formatBusinessDate(value) {
  const text = String(value || '').trim();
  if (!validIsoBusinessDate(text)) return '—';
  const [year, month, day] = text.split('-');
  return `${day}/${month}/${year}`;
}
function transferBusinessDate(item) {
  const explicit = String(item && item.ngayChuyenVien || '').trim();
  if (validIsoBusinessDate(explicit)) return explicit;
  return isoDateFromTimestamp(item && (item.ngayGioDi || item.createdAt) || 0);
}
function transferDateSortKey(item) {
  const value = transferBusinessDate(item);
  return validIsoBusinessDate(value) ? Number(value.replace(/-/g, '')) : 0;
}
async function serverTodayIso() {
  try {
    const offsetSnap = await get(ref(db, '.info/serverTimeOffset'));
    const offset = offsetSnap.exists() ? Number(offsetSnap.val() || 0) : 0;
    return isoDateAt(Date.now() + offset);
  } catch (_) {
    return todayIso();
  }
}
function isoDateFromTimestamp(value) {
  const n = Number(value || 0);
  if (!n) return '';
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(n));
  const getPart = (type) => parts.find((p) => p.type === type)?.value || '';
  return `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
}
function fmtDateTime(value) {
  const n = Number(value || 0);
  if (!n) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(n));
}
function durationText(from, to) {
  const start = Number(from || 0);
  if (!start) return '—';
  const end = Number(to || Date.now());
  const minutes = Math.max(0, Math.floor((end - start) / 60000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days > 0) return `${days} ngày ${hours} giờ`;
  if (hours > 0) return `${hours} giờ ${mins} phút`;
  return `${mins} phút`;
}
function hoursSince(value) {
  const n = Number(value || 0);
  return n ? Math.max(0, (Date.now() - n) / 3600000) : 0;
}
function statusLabel(status) {
  const map = {
    DANG_THEO_DOI: 'Đang theo dõi',
    TAI_KHAM: 'Tái khám',
    DANG_DIEU_TRI: 'Đang điều trị',
    CHUYEN_TIEP_BENH_VIEN_KHAC: 'Chuyển tiếp bệnh viện khác',
    TU_VONG_TAI_BENH_VIEN: 'Tử vong tại bệnh viện',
    TU_VONG_TAI_NOI_KHAC: 'Tử vong tại nơi khác',
    DA_VE_TRUNG_TAM: 'Đã về Trung tâm'
  };
  return map[status] || status || '—';
}
function transferTypeLabel(type, otherText) {
  const map = {
    CAP_CUU: 'Cấp cứu',
    TAI_KHAM: 'Tái khám',
    CHUYEN_VIEN: 'Chuyển viện',
    KHAC: 'Khác'
  };
  if (type === 'KHAC' && String(otherText || '').trim()) return String(otherText).trim();
  return map[type] || 'Chưa phân loại';
}
function inferLegacyTransferType(item) {
  if (item && item.hinhThucChuyen) return item.hinhThucChuyen;
  if (item && item.trangThaiHienTai === 'TAI_KHAM') return 'TAI_KHAM';
  return 'CHUYEN_VIEN';
}
function resolvedDestination(selectId, otherId) {
  const selected = String($(selectId)?.value || '').trim();
  if (!selected) return '';
  if (selected !== OTHER_DESTINATION) return selected;
  return String($(otherId)?.value || '').trim();
}
function toggleOtherDestination(selectId, fieldId, inputId) {
  const select = $(selectId);
  const field = $(fieldId);
  const input = $(inputId);
  if (!select || !field || !input) return;
  const isOther = select.value === OTHER_DESTINATION;
  field.hidden = !isOther;
  if (!isOther) input.value = '';
}
function eventLabel(type) {
  const map = {
    MO_HANH_TRINH: 'Lập chuyển viện',
    CAP_NHAT_TRANG_THAI: 'Cập nhật trạng thái',
    CHUYEN_TIEP: 'Chuyển tiếp bệnh viện khác',
    DA_VE_TRUNG_TAM: 'Đã về Trung tâm',
    TU_VONG_TAI_BENH_VIEN: 'Tử vong tại bệnh viện',
    TU_VONG_TAI_NOI_KHAC: 'Tử vong tại nơi khác'
  };
  return map[type] || type || 'Cập nhật';
}
function snapshotObject(snap) { return snap && snap.exists() ? (snap.val() || {}) : {}; }
function isOwner() {
  const user = auth.currentUser;
  return !!(user && normalizeEmail(user.email) === OWNER_EMAIL);
}
function validPermission(permission) {
  return !!(permission && permission.active === true && ['admin', 'nhaplieu', 'viewer'].includes(permission.role));
}
function isTongHopAdmin() {
  return !!(state.tongHopPermission && state.tongHopPermission.active === true && state.tongHopPermission.role === 'admin');
}
function isReportAdmin() {
  return !!(validPermission(state.permission) && state.permission.role === 'admin');
}
function isGlobalAdmin() {
  return isOwner() || isTongHopAdmin() || isReportAdmin();
}
function canView() {
  return isGlobalAdmin() || validPermission(state.permission);
}
function canEdit() {
  return isGlobalAdmin() || (validPermission(state.permission) && ['admin', 'nhaplieu'].includes(state.permission.role));
}
function canDelete() {
  return isGlobalAdmin();
}
function roleForLog() {
  if (isGlobalAdmin()) return 'admin';
  return state.permission && state.permission.role === 'nhaplieu' ? 'nhaplieu' : 'viewer';
}
function showToast(text, type) {
  const box = $('toast');
  if (!box) return;
  box.textContent = text;
  box.className = 'toast ' + (type || 'ok');
  box.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { box.hidden = true; }, 3800);
}
function showState(id, text, type, spinning) {
  const box = $(id);
  if (!box) return;
  box.hidden = !text;
  box.className = 'inline-state ' + (type || '');
  box.innerHTML = text ? `${spinning ? '<span class="spinner"></span>' : ''}<span>${esc(text)}</span>` : '';
}
function friendlyError(error, fallback) {
  const message = String(error && error.message ? error.message : error || '').trim();
  const technical = /(permission[_ -]?denied|firebase|network|failed to fetch|auth\/|database|internal|unavailable)/i.test(message);
  if (!message || technical) return fallback || 'Không thể thực hiện thao tác. Vui lòng kiểm tra kết nối hoặc quyền truy cập rồi thử lại.';
  return message;
}
function patientKey(name, gender, birthYear) {
  const raw = `${normalizeText(name)}|${String(gender || '').trim()}|${Number(birthYear || 0)}`;
  let hash = 2166136261;
  for (let i = 0; i < raw.length; i += 1) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return 'P_' + (hash >>> 0).toString(16).padStart(8, '0').toUpperCase();
}
function caseFromRaw(id, raw) {
  const info = raw && raw.thongTin ? raw.thongTin : {};
  return {
    id,
    ...info,
    chang: raw && raw.chang ? raw.chang : {},
    lichSu: raw && raw.lichSu ? raw.lichSu : {}
  };
}
function activeDuplicate(payload) {
  const n = normalizeText(payload.doiTuong);
  const g = String(payload.gioiTinh || '').trim();
  const y = Number(payload.namSinh || 0);
  for (const item of state.openCases) {
    const sameProfile = normalizeText(item.doiTuongNorm || item.doiTuong) === n
      && String(item.gioiTinh || '').trim() === g
      && Number(item.namSinh || 0) === y;
    if (sameProfile) return { duplicate: true, item };
  }
  return null;
}

function compareIdentity(payload, item) {
  const n = normalizeText(payload.doiTuong);
  const g = String(payload.gioiTinh || '').trim();
  const y = Number(payload.namSinh || 0);
  const sameProfile = normalizeText(item.doiTuongNorm || item.doiTuong || item.hoTenNorm || item.hoTenBenhNhan) === n
    && String(item.gioiTinh || '').trim() === g
    && Number(item.namSinh || 0) === y;
  return sameProfile ? 'same' : 'different';
}

async function deceasedDuplicate(payload) {
  for (const item of state.closedCases.filter((row) => row.trangThaiHienTai === 'TU_VONG_TAI_BENH_VIEN' || row.trangThaiHienTai === 'TU_VONG_TAI_NOI_KHAC')) {
    const match = compareIdentity(payload, item);
    if (match === 'same') return { deceased: true, label: item.trangThaiHienTai === 'TU_VONG_TAI_NOI_KHAC' ? 'tử vong tại nơi khác' : 'tử vong tại bệnh viện' };
  }
  return null;
}

function statusClass(status) {
  if (status === 'DA_VE_TRUNG_TAM') return 'is-returned';
  if (status === 'TU_VONG_TAI_BENH_VIEN' || status === 'TU_VONG_TAI_NOI_KHAC') return 'is-death';
  if (status === 'CHUYEN_TIEP_BENH_VIEN_KHAC') return 'is-transfer';
  if (status === 'DANG_DIEU_TRI') return 'is-treatment';
  if (status === 'DANG_THEO_DOI') return 'is-tracking';
  return 'is-followup';
}
function journeyRouteHtml(item) {
  const stages = Object.values(item.chang || {}).sort((a, b) => Number(a.thuTu || 0) - Number(b.thuTu || 0));
  if (!stages.length) return `<strong class="journey-route-place">${esc(CENTER_NAME)}</strong><b class="journey-route-arrow">→</b><strong class="journey-route-place">${esc(item.noiHienTai || '—')}</strong>`;
  const places = [stages[0].noiDi || CENTER_NAME];
  stages.forEach((stage) => {
    const place = stage.noiDen || '';
    if (place && normalizeText(place) !== normalizeText(places[places.length - 1])) places.push(place);
  });
  return places.map((place, index) => `${index ? '<b class="journey-route-arrow">→</b>' : ''}<strong class="journey-route-place">${esc(place)}</strong>`).join('');
}
function routeSearchText(item) {
  const stages = Object.values(item.chang || {});
  return stages.map((stage) => `${stage.noiDi || ''} ${stage.noiDen || ''}`).join(' ');
}
function formSignature(ids) {
  return ids.map((id) => {
    const el = $(id);
    if (!el) return '';
    return `${id}:${String(el.value || '')}`;
  }).join('|');
}
const CREATE_FIELD_IDS = ['journeyPatient','journeyGender','journeyBirthYear','journeyTransferType','journeyTransferDate','journeyTransferTypeOther','journeyTo','journeyToOther','journeyDiagnosis','journeyNote'];
const UPDATE_FIELD_IDS = ['journeyUpdateStatus','journeyUpdateBusinessDate','journeyUpdateDestination','journeyUpdateDestinationOther','journeyUpdateDiagnosis','journeyUpdateDeathPlace','journeyReturnCondition','journeyUpdateNote'];
function isCreateDirty() { return !!state.createBaseline && formSignature(CREATE_FIELD_IDS) !== state.createBaseline; }
function isUpdateDirty() { return !!state.updateBaseline && formSignature(UPDATE_FIELD_IDS) !== state.updateBaseline; }
async function confirmInApp(options) {
  const ui = window.YTE_APP_UI;
  if (!ui || typeof ui.confirm !== 'function') {
    showToast('Không mở được cửa sổ xác nhận. Vui lòng thử lại.', 'err');
    return false;
  }
  return ui.confirm(options || {});
}
async function confirmDiscard() {
  return confirmInApp({
    title: 'Bỏ thay đổi chưa lưu?',
    message: 'Bạn có thay đổi chưa lưu. Nếu tiếp tục, nội dung đang nhập sẽ bị bỏ.',
    confirmText: 'Bỏ thay đổi',
    cancelText: 'Tiếp tục nhập',
    danger: true
  });
}
function setBodyModalState(open) {
  document.body.style.overflow = open ? 'hidden' : '';
}
function restoreFocus() {
  const target = state.lastFocus;
  state.lastFocus = null;
  if (target && target.isConnected && typeof target.focus === 'function') window.setTimeout(() => target.focus(), 0);
}
function timelineBadge(event, item) {
  if (event.loaiSuKien === 'MO_HANH_TRINH') {
    return transferTypeLabel(event.hinhThucChuyen || inferLegacyTransferType(item), event.hinhThucChuyenKhac || item.hinhThucChuyenKhac);
  }
  if (event.loaiSuKien === 'CHUYEN_TIEP') return 'Chuyển tiếp';
  if (event.loaiSuKien === 'DA_VE_TRUNG_TAM') return 'Đã về Trung tâm';
  if (event.loaiSuKien === 'TU_VONG_TAI_BENH_VIEN') return 'Tử vong tại bệnh viện';
  if (event.loaiSuKien === 'TU_VONG_TAI_NOI_KHAC') return 'Tử vong tại nơi khác';
  return statusLabel(event.trangThaiSau);
}
function timelineTitle(event) {
  const from = String(event.noiTruoc || '').trim();
  const to = String(event.noiSau || '').trim();
  if (from && to && normalizeText(from) !== normalizeText(to)) return `${from} → ${to}`;
  const place = to || from;
  return place ? `Cập nhật tại ${place}` : 'Cập nhật hành trình';
}

async function refreshPermission() {
  const user = auth.currentUser;
  if (!user) {
    state.permission = null;
    state.tongHopPermission = null;
    return null;
  }
  const [reportSnap, tongHopSnap] = await Promise.all([
    get(ref(db, `${REPORT_ROOT}/phanQuyen/${user.uid}`)),
    get(ref(db, `${TONG_HOP_ROOT}/phanQuyen/${user.uid}`))
  ]);
  state.permission = reportSnap.exists() ? reportSnap.val() : null;
  state.tongHopPermission = tongHopSnap.exists() ? tongHopSnap.val() : null;
  return state.permission;
}

function latestDeathEvent(item) {
  const events = Object.values(item && item.lichSu || {}).filter((event) => event && (event.loaiSuKien === 'TU_VONG_TAI_BENH_VIEN' || event.loaiSuKien === 'TU_VONG_TAI_NOI_KHAC'));
  events.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
  return events[0] || null;
}
function deathBusinessDate(item) {
  const explicit = String(item && item.ngayTuVong || '').trim();
  if (validIsoBusinessDate(explicit)) return explicit;
  const event = latestDeathEvent(item);
  const eventDate = String(event && event.ngayTuVong || '').trim();
  if (validIsoBusinessDate(eventDate)) return eventDate;
  return isoDateFromTimestamp(event && event.createdAt || item && item.updatedAt || 0);
}
function eventBusinessDate(event, item) {
  if (!event) return '';
  const direct = String(event.ngaySuKien || '').trim();
  if (validIsoBusinessDate(direct)) return direct;
  const transferDate = String(event.ngayChuyenVien || '').trim();
  if (validIsoBusinessDate(transferDate)) return transferDate;
  const deathDate = String(event.ngayTuVong || '').trim();
  if (validIsoBusinessDate(deathDate)) return deathDate;
  return isoDateFromTimestamp(event.createdAt || 0) || transferBusinessDate(item);
}
function latestBusinessEventDate(item) {
  if (!item) return '';
  const explicit = String(item.ngaySuKienHienTai || '').trim();
  if (validIsoBusinessDate(explicit)) return explicit;
  const events = Object.values(item.lichSu || {}).filter(Boolean)
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
  const latest = events.length ? eventBusinessDate(events[0], item) : '';
  return validIsoBusinessDate(latest) ? latest : transferBusinessDate(item);
}
function historyBusinessDate(item) {
  if (!item) return '';
  if (item.trangThaiHienTai === 'TU_VONG_TAI_BENH_VIEN' || item.trangThaiHienTai === 'TU_VONG_TAI_NOI_KHAC') return deathBusinessDate(item);
  const latest = latestBusinessEventDate(item);
  if (validIsoBusinessDate(latest)) return latest;
  return transferBusinessDate(item);
}
function scheduleStatisticsReconciliation() {
  if (!canEdit()) return;
  clearTimeout(state.reconcileTimer);
  state.reconcileTimer = setTimeout(() => reconcileStatisticsMarkers().catch((error) => console.warn('Đối soát thống kê:', error)), 250);
}
async function reconcileStatisticsMarkers() {
  if (state.reconciling || !canEdit()) return;
  state.reconciling = true;
  try {
    const updates = {};
    [...state.openCases, ...state.closedCases].forEach((item) => {
      const transferDate = transferBusinessDate(item);
      if (transferDate && item.id) updates[`${REPORT_ROOT}/congKhaiThongKe/chuyenVienTheoNgay/${transferDate}/${item.id}`] = true;
      if (item.trangThaiHienTai === 'TU_VONG_TAI_BENH_VIEN' || item.trangThaiHienTai === 'TU_VONG_TAI_NOI_KHAC') {
        const deathDate = deathBusinessDate(item);
        const deathPrefix = item.trangThaiHienTai === 'TU_VONG_TAI_NOI_KHAC' ? 'OTHER_' : 'HOSP_';
        if (deathDate && item.id) updates[`${REPORT_ROOT}/congKhaiThongKe/tuVongTheoNgay/${deathDate}/${deathPrefix}${item.id}`] = true;
      }
    });
    if (Object.keys(updates).length) await update(ref(db), updates);
  } finally {
    state.reconciling = false;
  }
}

function applyJourneySnapshot(journeySnap) {
  const rawJourneys = snapshotObject(journeySnap);
  const all = Object.keys(rawJourneys).map((id) => caseFromRaw(id, rawJourneys[id]));
  state.openCases = all.filter((item) => item.trangThaiKyThuat === 'OPEN')
    .sort((a, b) => transferDateSortKey(a) - transferDateSortKey(b) || Number(a.createdAt || a.ngayGioDi || 0) - Number(b.createdAt || b.ngayGioDi || 0));
  state.closedCases = all.filter((item) => item.trangThaiKyThuat === 'CLOSED')
    .sort((a, b) => String(historyBusinessDate(b) || '').localeCompare(String(historyBusinessDate(a) || '')) || Number(b.updatedAt || b.ngayGioVe || 0) - Number(a.updatedAt || a.ngayGioVe || 0));
  state.loadedAt = Date.now();
  renderTracking();
  renderHistory();
  showState('journeyTrackingLoadState', '', '', false);
  scheduleStatisticsReconciliation();
}

function stopJourneyRealtime() {
  ['liveUnsubscribe','transferStatsUnsubscribe','deathStatsUnsubscribe','displayNamesUnsubscribe','reviewUnsubscribe'].forEach((key) => {
    if (typeof state[key] === 'function') state[key]();
    state[key] = null;
  });
}

function startJourneyRealtime() {
  if (!canView()) {
    stopJourneyRealtime();
    return;
  }
  if (!state.liveUnsubscribe) {
    state.liveUnsubscribe = onValue(ref(db, `${REPORT_ROOT}/hanhTrinhChuyenVien`), (snap) => {
      applyJourneySnapshot(snap);
    }, (error) => {
      console.error('Realtime hành trình:', error);
      showState('journeyTrackingLoadState', friendlyError(error, 'Mất kết nối đồng bộ trực tiếp. Ứng dụng sẽ tự kết nối lại khi mạng ổn định.'), 'err', false);
    });
  }
  if (!state.transferStatsUnsubscribe) {
    state.transferStatsUnsubscribe = onValue(ref(db, `${REPORT_ROOT}/congKhaiThongKe/chuyenVienTheoNgay/${todayIso()}`), (snap) => {
      state.transferStatsToday = snapshotObject(snap); renderDashboardStats();
    }, (error) => console.warn('Realtime thống kê chuyển viện:', error));
  }
  if (!state.deathStatsUnsubscribe) {
    state.deathStatsUnsubscribe = onValue(ref(db, `${REPORT_ROOT}/congKhaiThongKe/tuVongTheoNgay/${todayIso()}`), (snap) => {
      state.deathStatsToday = snapshotObject(snap); renderDashboardStats();
    }, (error) => console.warn('Realtime thống kê tử vong:', error));
  }
  if (!state.displayNamesUnsubscribe) {
    state.displayNamesUnsubscribe = onValue(ref(db, `${YTE_APP_ROOT}/tenHienThi`), (snap) => {
      state.displayNames = snapshotObject(snap);
      renderTracking(); renderHistory();
      if ($('journeyReporter') && auth.currentUser) $('journeyReporter').textContent = currentDisplayName();
      if ($('journeyUpdateReporter') && auth.currentUser && !$('journeyUpdateLayer')?.hidden) $('journeyUpdateReporter').textContent = currentDisplayName();
    }, (error) => console.warn('Realtime tên hiển thị:', error));
  }
  if (canEdit() && !state.reviewUnsubscribe) {
    state.reviewUnsubscribe = onValue(ref(db, REVIEW_ROOT), (snap) => {
      const raw = snapshotObject(snap);
      state.reviewRequests = Object.keys(raw).map((id) => ({ id, ...(raw[id] || {}) }));
      renderReviewBadge();
      if (!$('reviewInboxLayer')?.hidden) renderReviewInbox();
    }, (error) => console.warn('Realtime yêu cầu đối soát:', error));
  }
}

async function loadJourneys(force) {
  if (!canView()) return false;
  startJourneyRealtime();
  if (!force && state.loadedAt) { renderTracking(); renderHistory(); return true; }
  if (state.loading && !force) return true;
  state.loading = true;
  showState('journeyTrackingLoadState', 'Đang tải hành trình chuyển viện...', '', true);
  try {
    const journeySnap = await get(ref(db, `${REPORT_ROOT}/hanhTrinhChuyenVien`));
    applyJourneySnapshot(journeySnap);
    return true;
  } catch (error) {
    console.error(error);
    showState('journeyTrackingLoadState', friendlyError(error, 'Không tải được hành trình chuyển viện. Vui lòng thử lại.'), 'err', false);
    return false;
  } finally {
    state.loading = false;
  }
}

function renderTracking() {
  const search = normalizeText($('journeyTrackingSearch')?.value || '');
  const rows = state.openCases.filter((item) => {
    if (!search) return true;
    return normalizeText([
      item.doiTuong, item.gioiTinh, item.namSinh, item.noiHienTai, statusLabel(item.trangThaiHienTai),
      transferTypeLabel(inferLegacyTransferType(item), item.hinhThucChuyenKhac),
      item.tinhTrangChanDoanHienTai, item.ghiChu
    ].join(' ')).includes(search);
  });
  if ($('journeyOpenCount')) $('journeyOpenCount').textContent = String(state.openCases.length);
  if ($('journeyTrackingBadge')) $('journeyTrackingBadge').textContent = String(state.openCases.length);

  const box = $('journeyTrackingList');
  if (!box) return;
  if (!rows.length) {
    box.innerHTML = '<div class="journey-empty"><strong>Không có đối tượng đang ngoài Trung tâm.</strong></div>';
    return;
  }

  box.innerHTML = rows.map((item) => {
    const canWrite = canEdit();
    const note = String(item.ghiChu || '').trim();
    return `<article class="journey-card journey-card-compact">
      <div class="journey-card-main">
        <div class="journey-card-title">
          <div class="journey-person-head">
            <div class="journey-person-name-line">${iconSvg('person','journey-person-icon')}<strong>${esc(item.doiTuong || 'Chưa có tên')}</strong>${patientFactsHtml(item)}</div>
          </div>
          <div class="journey-card-badges">
            <span class="journey-status ${statusClass(item.trangThaiHienTai)}">${esc(statusLabel(item.trangThaiHienTai))}</span>
            <span class="journey-type-pill">${esc(transferTypeLabel(inferLegacyTransferType(item), item.hinhThucChuyenKhac))}</span>
          </div>
        </div>
        <div class="journey-location journey-location-compact journey-location-italic">
          <span class="journey-location-label">${iconSvg('pin','journey-inline-icon')}Nơi hiện tại</span>
          <strong>${esc(item.noiHienTai || '—')}</strong>
        </div>
        <div class="journey-card-bottom-row">
          <details class="journey-card-details">
            <summary>Thông tin chi tiết</summary>
            <div class="journey-detail-grid-inline">
              <div><span>Ngày chuyển viện</span><strong>${esc(formatBusinessDate(transferBusinessDate(item)))}</strong></div>
              <div><span>Tình trạng/chẩn đoán</span><strong>${esc(item.tinhTrangChanDoanHienTai || '—')}</strong></div>
              ${note ? `<div class="journey-detail-note"><span>Ghi chú</span><strong>${esc(note)}</strong></div>` : ''}
              <div><span>Người cập nhật</span><strong>${esc(preferredName(item.updatedByUid || item.createdByUid, item.updatedByName || item.createdByName))}</strong></div>
            </div>
          </details>
          <div class="journey-card-actions">
            ${canWrite ? `<button class="small-btn btn-primary journey-action journey-primary-action" data-kind="update" data-id="${esc(item.id)}" type="button">${iconSvg('edit')}<span>Cập nhật</span></button>
            <details class="journey-action-menu"><summary aria-label="Thao tác khác">${iconSvg('dots')}</summary><div class="journey-action-popover"><button class="journey-action" data-kind="view" data-id="${esc(item.id)}" type="button">${iconSvg('eye')}<span>Xem</span></button><button class="journey-action journey-menu-return" data-kind="return" data-id="${esc(item.id)}" type="button">${iconSvg('home')}<span>Đã về Trung tâm</span></button>${canDelete() ? `<button class="journey-action journey-menu-delete" data-kind="delete" data-id="${esc(item.id)}" type="button"><span>Xóa</span></button>` : ''}</div></details>` : `<button class="small-btn btn-soft journey-action" data-kind="view" data-id="${esc(item.id)}" type="button">${iconSvg('eye')}<span>Xem</span></button>`}
          </div>
        </div>
      </div>
    </article>`;
  }).join('');
}

function combinedHistoryRows() {
  return state.closedCases
    .map((item) => ({ ...item, kind: 'JOURNEY' }))
    .sort((a, b) => {
      const dateOrder = String(historyBusinessDate(b) || '').localeCompare(String(historyBusinessDate(a) || ''));
      return dateOrder || Number(b.updatedAt || b.ngayGioVe || 0) - Number(a.updatedAt || a.ngayGioVe || 0);
    });
}

function updateHistoryFilterLabels(allRows) {
  const select = $('journeyHistoryStatus');
  if (!select) return;
  const counts = {
    all: allRows.length,
    DA_VE_TRUNG_TAM: allRows.filter((x) => x.trangThaiHienTai === 'DA_VE_TRUNG_TAM').length,
    TU_VONG_TAI_BENH_VIEN: allRows.filter((x) => x.trangThaiHienTai === 'TU_VONG_TAI_BENH_VIEN').length,
    TU_VONG_TAI_NOI_KHAC: allRows.filter((x) => x.trangThaiHienTai === 'TU_VONG_TAI_NOI_KHAC').length
  };
  const labels = {
    all: 'Tất cả',
    DA_VE_TRUNG_TAM: 'Đã về Trung tâm',
    TU_VONG_TAI_BENH_VIEN: 'Tử vong tại bệnh viện',
    TU_VONG_TAI_NOI_KHAC: 'Tử vong tại nơi khác'
  };
  Array.from(select.options).forEach((option) => {
    option.textContent = `${labels[option.value] || option.textContent} (${counts[option.value] || 0})`;
  });
}

function renderDashboardStats() {
  if ($('journeyTodayTransferCount')) $('journeyTodayTransferCount').textContent = String(markerCount(state.transferStatsToday));
  if ($('journeyTodayDeathCount')) $('journeyTodayDeathCount').textContent = String(markerCount(state.deathStatsToday, 'death'));
}

function latestJourneyStage(item) {
  const stages = Object.values(item && item.chang || {}).sort((a, b) => Number(a.thuTu || 0) - Number(b.thuTu || 0));
  return stages.length ? stages[stages.length - 1] : null;
}
function historyTreatmentPlace(item) {
  if (!item) return '—';
  if (item.trangThaiHienTai === 'TU_VONG_TAI_NOI_KHAC' && String(item.noiTuVong || '').trim()) return String(item.noiTuVong).trim();
  const stages = Object.values(item.chang || {}).sort((a, b) => Number(a.thuTu || 0) - Number(b.thuTu || 0));
  for (let i = stages.length - 1; i >= 0; i -= 1) {
    const place = String(stages[i] && stages[i].noiDen || '').trim();
    if (place && normalizeText(place) !== normalizeText(CENTER_NAME)) return place;
  }
  return String(item.noiHienTai || CENTER_NAME || '—');
}
function historyDiagnosis(item) {
  if (!item) return '—';
  const latest = latestJourneyStage(item);
  return String(
    latest && latest.tinhTrangChanDoan ||
    item.tinhTrangChanDoanHienTai ||
    item.tinhTrangKhiVe ||
    item.ghiChu ||
    '—'
  );
}
function historyActionHtml(item) {
  const menu = canDelete() ? `<details class="journey-action-menu"><summary aria-label="Thao tác khác">${iconSvg('dots')}</summary><div class="journey-action-popover"><button class="journey-history-action journey-menu-delete" data-kind="journey-delete" data-id="${esc(item.id)}" type="button"><span>Xóa</span></button></div></details>` : '';
  return `<div class="journey-history-actions"><button class="small-btn btn-soft journey-history-action" data-kind="view" data-id="${esc(item.id)}" type="button">${iconSvg('eye')}<span>Xem</span></button>${menu}</div>`;
}

function filteredHistoryRows() {
  const search = normalizeText($('journeyHistorySearch')?.value || '');
  const filter = $('journeyHistoryStatus')?.value || 'all';
  const from = String($('journeyHistoryFrom')?.value || '').trim();
  const to = String($('journeyHistoryTo')?.value || '').trim();
  const allRows = combinedHistoryRows();
  updateHistoryFilterLabels(allRows);
  if (from && to && from > to) return [];
  return allRows.filter((item) => {
    if (filter !== 'all' && item.trangThaiHienTai !== filter) return false;
    const businessDate = historyBusinessDate(item);
    if (from && (!businessDate || businessDate < from)) return false;
    if (to && (!businessDate || businessDate > to)) return false;
    if (!search) return true;
    return normalizeText([
      item.doiTuong, item.gioiTinh, item.namSinh, statusLabel(item.trangThaiHienTai),
      item.tinhTrangKhiVe, item.ghiChu, item.noiTuVong, historyTreatmentPlace(item), historyDiagnosis(item), routeSearchText(item), businessDate
    ].join(' ')).includes(search);
  });
}

function previewClinicalReport() {
  const allCases = [
    ...state.openCases.map((item) => ({ ...item, kind: 'JOURNEY' })),
    ...state.closedCases.map((item) => ({ ...item, kind: 'JOURNEY' }))
  ].sort((a, b) => transferDateSortKey(b) - transferDateSortKey(a) || Number(b.updatedAt || b.createdAt || 0) - Number(a.updatedAt || a.createdAt || 0));
  const rows = allCases.map((item, index) => ({
    stt: index + 1,
    hoTen: item.doiTuong || '',
    namSinh: validBirthYear(item.namSinh) ? Number(item.namSinh) : '',
    gioiTinh: validGender(item.gioiTinh) ? item.gioiTinh : '',
    noiDieuTri: historyTreatmentPlace(item),
    tinhTrang: historyDiagnosis(item),
    trangThai: statusLabel(item.trangThaiHienTai),
    ngayNghiepVu: formatBusinessDate(item.trangThaiKyThuat === 'CLOSED' ? historyBusinessDate(item) : transferBusinessDate(item))
  }));
  openReportPreview({
    title: 'Báo cáo chuyển viện & tử vong',
    subtitle: 'Tất cả dữ liệu hiện có',
    filename: 'Bao-cao-chuyen-vien-tu-vong_' + todayIso() + '.xlsx',
    sheetName: 'Chuyển viện tử vong',
    columns: [
      {key:'stt',label:'STT',width:8},
      {key:'hoTen',label:'Họ và tên',width:28},
      {key:'namSinh',label:'Năm sinh',width:12},
      {key:'gioiTinh',label:'Giới tính',width:12},
      {key:'noiDieuTri',label:'Nơi điều trị / nơi tử vong',width:32},
      {key:'tinhTrang',label:'Tình trạng / chẩn đoán',width:38},
      {key:'trangThai',label:'Trạng thái',width:24},
      {key:'ngayNghiepVu',label:'Ngày',width:18}
    ],
    rows
  });
}

function renderHistory() {
  const rows = filteredHistoryRows();
  const box = $('journeyHistoryList');
  if (!box) return;
  if (!rows.length) {
    box.innerHTML = '<div class="journey-empty"><strong>Không có lịch sử phù hợp.</strong><span>Hãy thay đổi khoảng ngày, trạng thái hoặc nội dung tìm kiếm.</span></div>';
    return;
  }

  const body = rows.map((item, index) => {
    const status = statusLabel(item.trangThaiHienTai);
    const statusClassName = statusClass(item.trangThaiHienTai);
    const businessDate = historyBusinessDate(item);
    return `<tr>
      <td class="history-col-stt" data-label="STT">${index + 1}</td>
      <td class="history-col-name" data-label="Họ và tên">
        <div class="history-name-row"><span class="history-mobile-field-label">Họ và tên:</span><strong>${esc(item.doiTuong || 'Chưa có tên')}</strong></div>
      </td>
      <td class="history-col-birth" data-label="Năm sinh">${validBirthYear(item.namSinh) ? esc(item.namSinh) : '—'}</td>
      <td class="history-col-gender" data-label="Giới tính">${validGender(item.gioiTinh) ? esc(item.gioiTinh) : '—'}</td>
      <td class="history-col-date" data-label="Ngày">${businessDate ? esc(formatBusinessDate(businessDate)) : '—'}</td>
      <td class="history-col-status" data-label="Trạng thái"><span class="journey-status ${statusClassName}">${esc(status)}</span></td>
      <td class="history-col-actions" data-label="Thao tác">${historyActionHtml(item)}</td>
    </tr>`;
  }).join('');

  box.innerHTML = `<div class="journey-history-table-wrap"><table class="journey-history-table journey-history-table-compact">
    <thead><tr>
      <th>STT</th><th>Họ và tên</th><th>Năm sinh</th><th>Giới tính</th><th>Ngày</th><th>Trạng thái</th><th>Thao tác</th>
    </tr></thead>
    <tbody>${body}</tbody>
  </table></div>`;
}

function positionActionPopover(details) {
  if (!details || !details.open) return;
  const summary = details.querySelector('summary');
  const popover = details.querySelector('.journey-action-popover');
  if (!summary || !popover) return;
  popover.style.position = 'fixed';
  popover.style.right = 'auto';
  popover.style.bottom = 'auto';
  popover.style.zIndex = '1400';
  requestAnimationFrame(() => {
    if (!details.open) return;
    const rect = summary.getBoundingClientRect();
    const margin = 8;
    const width = Math.min(220, Math.max(180, window.innerWidth - margin * 2));
    popover.style.width = `${width}px`;
    popover.style.left = `${Math.max(margin, Math.min(window.innerWidth - width - margin, rect.right - width))}px`;
    popover.style.top = `${rect.bottom + 6}px`;
    const menuRect = popover.getBoundingClientRect();
    if (menuRect.bottom > window.innerHeight - margin) {
      popover.style.top = `${Math.max(margin, rect.top - menuRect.height - 6)}px`;
    }
  });
}
function refreshOpenActionPopovers() {
  document.querySelectorAll('details.journey-action-menu[open]').forEach(positionActionPopover);
}
function initializeActionPopoverPositioning() {
  document.addEventListener('toggle', (event) => {
    const details = event.target && event.target.matches && event.target.matches('details.journey-action-menu') ? event.target : null;
    if (!details || !details.open) return;
    document.querySelectorAll('details.journey-action-menu[open]').forEach((other) => { if (other !== details) other.open = false; });
    positionActionPopover(details);
  }, true);
  window.addEventListener('resize', refreshOpenActionPopovers);
  window.addEventListener('scroll', refreshOpenActionPopovers, true);
  document.addEventListener('click', (event) => {
    if (event.target.closest('details.journey-action-menu')) return;
    document.querySelectorAll('details.journey-action-menu[open]').forEach((details) => { details.open = false; });
  });
}

async function requestSubView(name) {
  if (state.subView === 'create' && name !== 'create' && isCreateDirty()) {
    if (!(await confirmDiscard())) return;
    resetCreateForm();
  }
  setSubView(name);
}

function setSubView(name) {
  name = ['tracking', 'create', 'history'].includes(name) ? name : 'tracking';
  if (name === 'create' && !canEdit()) name = 'tracking';
  state.subView = name;
  const reportsView = $('reportsView');
  if (reportsView) reportsView.setAttribute('data-journey-view', name);
  document.querySelectorAll('.journey-subtab').forEach((button) => {
    button.classList.toggle('active', button.getAttribute('data-journey-view') === name);
  });
  ['tracking', 'create', 'history'].forEach((key) => {
    const panel = $('journey' + key[0].toUpperCase() + key.slice(1) + 'Panel');
    if (panel) panel.hidden = key !== name;
  });
  if (name === 'tracking') loadJourneys(false);
  if (name === 'history') loadJourneys(false);
  if (name === 'create' && !state.createBaseline) resetCreateForm();
}

function updateCreateDynamicFields() {
  const transferType = String($('journeyTransferType')?.value || '');
  const otherTypeField = $('journeyTransferTypeOtherField');
  if (otherTypeField) otherTypeField.hidden = transferType !== 'KHAC';
  if (transferType !== 'KHAC' && $('journeyTransferTypeOther')) $('journeyTransferTypeOther').value = '';
  toggleOtherDestination('journeyTo', 'journeyToOtherField', 'journeyToOther');
}

function resetCreateForm() {
  if (!$('journeyCreateForm')) return;
  $('journeyPatient').value = '';
  $('journeyGender').value = '';
  $('journeyBirthYear').value = '';
  $('journeyBirthYear').max = String(new Date().getFullYear());
  if ($('journeyBHYT')) $('journeyBHYT').value = '';
  const transferDate = $('journeyTransferDate');
  if (transferDate) { transferDate.max = todayIso(); transferDate.value = todayIso(); }
  $('journeyFrom').value = CENTER_NAME;
  $('journeyTo').value = '';
  $('journeyToOther').value = '';
  $('journeyTransferType').value = '';
  $('journeyTransferTypeOther').value = '';
  if ($('journeyReason')) $('journeyReason').value = '';
  $('journeyDiagnosis').value = '';
  $('journeyNote').value = '';
  $('journeyCreateError').textContent = '';
  updateCreateDynamicFields();
  const user = auth.currentUser;
  $('journeyReporter').textContent = user ? currentDisplayName() : '—';
  state.createBaseline = formSignature(CREATE_FIELD_IDS);
}

function createPayload() {
  const doiTuong = formatPersonName($('journeyPatient').value || '');
  const gioiTinh = String($('journeyGender').value || '').trim();
  const namSinh = Number($('journeyBirthYear').value || 0);
  const theBHYT = '';
  const noiDen = resolvedDestination('journeyTo', 'journeyToOther');
  const tinhTrang = String($('journeyDiagnosis').value || '').trim();
  // Field legacy lyDo được giữ trong Firebase để tương thích dữ liệu cũ, nhưng UI chỉ nhập Chẩn đoán.
  const lyDo = tinhTrang;
  const ghiChu = String($('journeyNote').value || '').trim();
  const hinhThucChuyen = String($('journeyTransferType').value || '');
  const ngayChuyenVien = String($('journeyTransferDate')?.value || '').trim();
  const hinhThucChuyenKhac = hinhThucChuyen === 'KHAC' ? String($('journeyTransferTypeOther').value || '').trim() : '';
  if (doiTuong.length < 2 || doiTuong.length > 150) throw new Error('Vui lòng nhập Họ và tên từ 2 đến 150 ký tự.');
  if (!validGender(gioiTinh)) throw new Error('Vui lòng chọn Giới tính.');
  if (!validBirthYear(namSinh)) throw new Error(`Năm sinh phải từ 1900 đến ${new Date().getFullYear()}.`);
  if (!TRANSFER_TYPES.includes(hinhThucChuyen)) throw new Error('Vui lòng chọn Hình thức chuyển.');
  if (!validIsoBusinessDate(ngayChuyenVien)) throw new Error('Vui lòng chọn Ngày chuyển viện.');
  if (ngayChuyenVien > todayIso()) throw new Error('Ngày chuyển viện không được lớn hơn ngày hiện tại.');
  if (hinhThucChuyen === 'KHAC' && (hinhThucChuyenKhac.length < 2 || hinhThucChuyenKhac.length > 120)) throw new Error('Vui lòng nhập Hình thức chuyển khác.');
  if (!noiDen || noiDen.length > 300) throw new Error('Vui lòng chọn hoặc nhập Nơi đến.');
  if (!tinhTrang || tinhTrang.length > 1500) throw new Error('Vui lòng nhập Tình trạng/chẩn đoán.');
  if (ghiChu.length > 2000) throw new Error('Ghi chú không được vượt quá 2.000 ký tự.');
  return {
    doiTuong,
    doiTuongNorm: normalizeText(doiTuong),
    gioiTinh,
    namSinh,
    theBHYT,
    theBHYTNorm: theBHYT,
    doiTuongKey: patientKey(doiTuong, gioiTinh, namSinh),
    noiDen,
    lyDo,
    tinhTrang,
    ghiChu,
    hinhThucChuyen,
    hinhThucChuyenKhac,
    ngayChuyenVien,
    trangThai: 'DANG_THEO_DOI'
  };
}

async function claimOpenIndex(key, caseId) {
  const indexRef = ref(db, `${REPORT_ROOT}/hanhTrinhDangMo/${key}`);
  const result = await runTransaction(indexRef, (current) => {
    if (current == null) return caseId;
    return undefined;
  }, { applyLocally: false });
  if (!result.committed) throw new Error('Đối tượng đang có hành trình chuyển viện chưa kết thúc.');
}

async function releaseOpenIndex(key, expectedCaseId) {
  const indexRef = ref(db, `${REPORT_ROOT}/hanhTrinhDangMo/${key}`);
  await runTransaction(indexRef, (current) => current === expectedCaseId ? null : current, { applyLocally: false }).catch(() => {});
}

async function createJourney() {
  if (!canEdit()) return;
  let payload;
  try { payload = createPayload(); }
  catch (error) { $('journeyCreateError').textContent = friendlyError(error); return; }
  const user = auth.currentUser;
  if (!user) { $('journeyCreateError').textContent = 'Vui lòng đăng nhập lại.'; return; }
  $('journeyCreateError').textContent = '';
  $('journeyCreateSave').disabled = true;
  $('journeyCreateSave').textContent = 'Đang lưu...';
  try {
    const refreshed = await loadJourneys(true);
    if (!refreshed) throw new Error('Không thể kiểm tra dữ liệu hành trình mới nhất. Vui lòng kiểm tra kết nối và thử lại để tránh tạo trùng hồ sơ.');
    const duplicate = activeDuplicate(payload);
    if (duplicate && duplicate.conflict) throw new Error(duplicate.message);
    if (duplicate && duplicate.duplicate) throw new Error(`Đối tượng đang có hành trình chưa kết thúc tại ${duplicate.item.noiHienTai || 'cơ sở y tế'}.`);
    const deceased = await deceasedDuplicate(payload);
    if (deceased && deceased.conflict) throw new Error(deceased.message);
    if (deceased && deceased.deceased) throw new Error(`Đối tượng đã được ghi nhận ${deceased.label}. Không thể lập hành trình chuyển viện mới.`);

    const caseId = 'HTCV_' + push(ref(db, `${REPORT_ROOT}/hanhTrinhChuyenVien`)).key;
    await claimOpenIndex(payload.doiTuongKey, caseId);
    const stageId = push(ref(db, `${REPORT_ROOT}/hanhTrinhChuyenVien/${caseId}/chang`)).key;
    const historyId = push(ref(db, `${REPORT_ROOT}/hanhTrinhChuyenVien/${caseId}/lichSu`)).key;
    const businessDate = payload.ngayChuyenVien;
    const logId = push(ref(db, `${REPORT_ROOT}/nhatKy/${businessDate.slice(0, 7)}`)).key;
    const displayName = await resolveCurrentDisplayName();
    const email = normalizeEmail(user.email);
    const ts = serverTimestamp();
    const info = {
      id: caseId,
      doiTuong: payload.doiTuong,
      doiTuongNorm: payload.doiTuongNorm,
      gioiTinh: payload.gioiTinh,
      namSinh: payload.namSinh,
      theBHYT: payload.theBHYT,
      theBHYTNorm: payload.theBHYTNorm,
      doiTuongKey: payload.doiTuongKey,
      hinhThucChuyen: payload.hinhThucChuyen,
      hinhThucChuyenKhac: payload.hinhThucChuyenKhac,
      noiDiBanDau: CENTER_NAME,
      noiHienTai: payload.noiDen,
      lyDoHienTai: payload.lyDo,
      tinhTrangChanDoanHienTai: payload.tinhTrang,
      ghiChu: payload.ghiChu,
      trangThaiHienTai: payload.trangThai,
      trangThaiKyThuat: 'OPEN',
      ngayChuyenVien: businessDate,
      ngaySuKienHienTai: businessDate,
      // Giữ timestamp hệ thống để audit/ordering; không dùng làm ngày nghiệp vụ.
      ngayGioDi: ts,
      ngayGioVe: 0,
      tinhTrangKhiVe: '',
      thuTuChang: 1,
      version: 1,
      createdAt: ts,
      createdByUid: user.uid,
      createdByEmail: email,
      createdByName: displayName,
      updatedAt: ts,
      updatedByUid: user.uid,
      updatedByEmail: email,
      updatedByName: displayName
    };
    const updates = {};
    updates[`${REPORT_ROOT}/hanhTrinhChuyenVien/${caseId}/thongTin`] = info;
    updates[`${REPORT_ROOT}/hanhTrinhChuyenVien/${caseId}/chang/${stageId}`] = {
      id: stageId,
      caseId,
      thuTu: 1,
      noiDi: CENTER_NAME,
      noiDen: payload.noiDen,
      hinhThucChuyen: payload.hinhThucChuyen,
      hinhThucChuyenKhac: payload.hinhThucChuyenKhac,
      lyDo: payload.lyDo,
      tinhTrangChanDoan: payload.tinhTrang,
      ghiChu: payload.ghiChu,
      trangThaiSauChang: payload.trangThai,
      ngayChuyenVien: businessDate,
      ngaySuKien: businessDate,
      thoiDiem: ts,
      uid: user.uid,
      email,
      displayName
    };
    updates[`${REPORT_ROOT}/hanhTrinhChuyenVien/${caseId}/lichSu/${historyId}`] = {
      id: historyId,
      caseId,
      loaiSuKien: 'MO_HANH_TRINH',
      trangThaiTruoc: '',
      trangThaiSau: payload.trangThai,
      noiTruoc: CENTER_NAME,
      noiSau: payload.noiDen,
      hinhThucChuyen: payload.hinhThucChuyen,
      hinhThucChuyenKhac: payload.hinhThucChuyenKhac,
      lyDo: payload.lyDo,
      tinhTrangChanDoan: payload.tinhTrang,
      ghiChu: payload.ghiChu,
      tinhTrangKhiVe: '',
      ngayChuyenVien: businessDate,
      ngaySuKien: businessDate,
      uid: user.uid,
      email,
      displayName,
      createdAt: ts
    };
    updates[`${REPORT_ROOT}/congKhaiThongKe/chuyenVienTheoNgay/${businessDate}/${caseId}`] = true;
    updates[`${REPORT_ROOT}/nhatKy/${businessDate.slice(0, 7)}/${logId}`] = {
      action: 'Lập hành trình chuyển viện',
      content: `${payload.doiTuong} · ${CENTER_NAME} → ${payload.noiDen}`,
      reportId: caseId,
      loaiBaoCao: 'CHUYEN_VIEN',
      dataDate: businessDate,
      uid: user.uid,
      email,
      displayName,
      role: roleForLog(),
      createdAt: ts
    };
    try {
      await update(ref(db), updates);
    } catch (error) {
      await releaseOpenIndex(payload.doiTuongKey, caseId);
      throw error;
    }
    notifyBusinessEvent('TRANSFER_CREATED', caseId);
    showToast('Đã lập hành trình chuyển viện.', 'ok');
    resetCreateForm();
    await loadJourneys(true);
    setSubView('tracking');
  } catch (error) {
    console.error(error);
    $('journeyCreateError').textContent = friendlyError(error, 'Không thể lưu hành trình chuyển viện. Vui lòng thử lại.');
  } finally {
    $('journeyCreateSave').disabled = false;
    $('journeyCreateSave').textContent = 'Xác nhận chuyển viện';
  }
}

async function deleteJourney(id) {
  if (!canDelete()) {
    showToast('Chỉ tài khoản Quản trị mới được xóa dữ liệu hành trình.', 'warn');
    return;
  }
  const item = findCase(id);
  if (!item) return;
  const confirmed = await confirmInApp({
    title: 'Xóa hành trình chuyển viện?',
    message: `Bạn có chắc muốn xóa hành trình của ${item.doiTuong || 'đối tượng'}? Dữ liệu sẽ rời danh sách chính nhưng vẫn được lưu vết để Quản trị kiểm tra.`,
    confirmText: 'Xóa hành trình',
    cancelText: 'Hủy',
    danger: true
  });
  if (!confirmed) return;
  const user = auth.currentUser;
  if (!user) return;
  try {
    const snap = await get(ref(db, `${REPORT_ROOT}/hanhTrinhChuyenVien/${id}`));
    if (!snap.exists()) throw new Error('Hành trình không còn tồn tại.');
    const raw = snap.val() || {};
    const info = raw.thongTin || {};
    const displayName = await resolveCurrentDisplayName();
    const email = normalizeEmail(user.email);
    const deletedAt = Date.now();
    const transferDate = transferBusinessDate(info) || isoDateFromTimestamp(info.createdAt || info.ngayGioDi || deletedAt);
    const deathDate = (info.trangThaiHienTai === 'TU_VONG_TAI_BENH_VIEN' || info.trangThaiHienTai === 'TU_VONG_TAI_NOI_KHAC') ? deathBusinessDate(caseFromRaw(id, raw)) : '';
    const deathPrefix = info.trangThaiHienTai === 'TU_VONG_TAI_NOI_KHAC' ? 'OTHER_' : 'HOSP_';
    const logMonth = (transferDate || todayIso()).slice(0, 7);
    const logId = push(ref(db, `${REPORT_ROOT}/nhatKy/${logMonth}`)).key;
    const updates = {};
    updates[`${REPORT_ROOT}/hanhTrinhDaXoa/${id}`] = {
      caseId: id,
      deletedAt,
      deletedByUid: user.uid,
      deletedByEmail: email,
      deletedByName: displayName,
      data: raw
    };
    updates[`${REPORT_ROOT}/hanhTrinhChuyenVien/${id}`] = null;
    if (info.doiTuongKey) updates[`${REPORT_ROOT}/hanhTrinhDangMo/${info.doiTuongKey}`] = null;
    if (transferDate) updates[`${REPORT_ROOT}/congKhaiThongKe/chuyenVienTheoNgay/${transferDate}/${id}`] = null;
    if (deathDate) updates[`${REPORT_ROOT}/congKhaiThongKe/tuVongTheoNgay/${deathDate}/${deathPrefix}${id}`] = null;
    updates[`${REPORT_ROOT}/nhatKy/${logMonth}/${logId}`] = {
      action: 'Xóa hành trình chuyển viện',
      content: `${info.doiTuong || item.doiTuong || 'Đối tượng'} · ${info.noiDiBanDau || CENTER_NAME} → ${info.noiHienTai || item.noiHienTai || '—'}`,
      reportId: id,
      loaiBaoCao: 'CHUYEN_VIEN',
      dataDate: transferDate || todayIso(),
      uid: user.uid,
      email,
      displayName,
      role: 'admin',
      createdAt: deletedAt
    };
    await update(ref(db), updates);
    notifyBusinessEvent('TRANSFER_DELETED', id);
    showToast('Đã xóa hành trình và lưu bản lưu vết dành cho Quản trị.', 'ok');
    await loadJourneys(true);
  } catch (error) {
    console.error(error);
    showToast(friendlyError(error, 'Không thể xóa hành trình. Vui lòng kiểm tra quyền Quản trị và Firebase Rules.'), 'err');
  }
}

function findCase(id) {
  return [...state.openCases, ...state.closedCases].find((item) => item.id === id) || null;
}

function openUpdateDialog(id, preset) {
  if (!canEdit()) return;
  const item = findCase(id);
  if (!item || item.trangThaiKyThuat !== 'OPEN') return;
  state.selectedCase = item;
  $('journeyUpdatePatient').textContent = item.doiTuong || '—';
  $('journeyUpdateGender').textContent = validGender(item.gioiTinh) ? item.gioiTinh : 'Chưa ghi nhận';
  $('journeyUpdateBirthYear').textContent = validBirthYear(item.namSinh) ? String(item.namSinh) : 'Chưa ghi nhận';
  $('journeyUpdateCurrentPlace').textContent = item.noiHienTai || '—';
  $('journeyUpdateCurrentStatus').textContent = statusLabel(item.trangThaiHienTai);
  $('journeyUpdateStatus').value = preset === 'DA_VE_TRUNG_TAM' ? 'DA_VE_TRUNG_TAM' : item.trangThaiHienTai;
  $('journeyUpdateDestination').value = '';
  $('journeyUpdateDestinationOther').value = '';
  if ($('journeyUpdateReason')) $('journeyUpdateReason').value = '';
  $('journeyUpdateDiagnosis').value = '';
  const previousBusinessDate = latestBusinessEventDate(item) || transferBusinessDate(item) || todayIso();
  $('journeyUpdateBusinessDate').value = todayIso() < previousBusinessDate ? previousBusinessDate : todayIso();
  $('journeyUpdateBusinessDate').min = previousBusinessDate;
  $('journeyUpdateBusinessDate').max = todayIso();
  $('journeyUpdateDeathPlace').value = '';
  $('journeyReturnCondition').value = '';
  $('journeyUpdateNote').value = '';
  $('journeyUpdateError').textContent = '';
  $('journeyUpdateSystemTime').textContent = 'Tự động ghi khi xác nhận';
  const user = auth.currentUser;
  $('journeyUpdateReporter').textContent = user ? currentDisplayName() : '—';
  updateUpdateFields();
  state.updateBaseline = formSignature(UPDATE_FIELD_IDS);
  state.lastFocus = document.activeElement;
  $('journeyUpdateLayer').hidden = false;
  setBodyModalState(true);
  window.setTimeout(() => $('journeyUpdateStatus')?.focus(), 0);
}

function updateUpdateFields() {
  const status = $('journeyUpdateStatus').value;
  const transfer = status === 'CHUYEN_TIEP_BENH_VIEN_KHAC';
  const returned = status === 'DA_VE_TRUNG_TAM';
  const deathHospital = status === 'TU_VONG_TAI_BENH_VIEN';
  const deathOther = status === 'TU_VONG_TAI_NOI_KHAC';
  const death = deathHospital || deathOther;
  $('journeyUpdateDestinationField').hidden = !transfer;
  $('journeyUpdateReasonField').hidden = true;
  $('journeyUpdateDiagnosisField').hidden = returned;
  $('journeyReturnConditionField').hidden = !returned;
  $('journeyUpdateDeathPlaceField').hidden = !deathOther;
  const dateLabel = death ? 'Ngày tử vong *'
    : returned ? 'Ngày về Trung tâm *'
    : transfer ? 'Ngày chuyển tiếp *'
    : 'Ngày cập nhật *';
  if ($('journeyUpdateBusinessDateLabel')) $('journeyUpdateBusinessDateLabel').textContent = dateLabel;
  if (!$('journeyUpdateBusinessDate').value) $('journeyUpdateBusinessDate').value = todayIso();
  $('journeyUpdateBusinessDate').max = todayIso();
  const lastDate = latestBusinessEventDate(state.selectedCase);
  if (validIsoBusinessDate(lastDate)) $('journeyUpdateBusinessDate').min = lastDate;
  if (!deathOther) $('journeyUpdateDeathPlace').value = '';
  if (!transfer) {
    $('journeyUpdateDestination').value = '';
    $('journeyUpdateDestinationOther').value = '';
    $('journeyUpdateDestinationOtherField').hidden = true;
  } else {
    toggleOtherDestination('journeyUpdateDestination', 'journeyUpdateDestinationOtherField', 'journeyUpdateDestinationOther');
  }
}

async function closeUpdateDialog(force = false) {
  if (!force && isUpdateDirty() && !(await confirmDiscard())) return false;
  $('journeyUpdateLayer').hidden = true;
  setBodyModalState(false);
  state.selectedCase = null;
  state.updateBaseline = '';
  $('journeyUpdateError').textContent = '';
  restoreFocus();
  return true;
}

function updatePayload() {
  const item = state.selectedCase;
  if (!item) throw new Error('Không xác định được hành trình cần cập nhật.');
  const status = String($('journeyUpdateStatus').value || '');
  const ghiChu = String($('journeyUpdateNote').value || '').trim();
  const ngaySuKien = String($('journeyUpdateBusinessDate').value || '').trim();
  if (!ALL_STATUSES.includes(status)) throw new Error('Trạng thái hiện tại chưa hợp lệ.');
  if (ghiChu.length > 2000) throw new Error('Ghi chú không được vượt quá 2.000 ký tự.');
  if (!validIsoBusinessDate(ngaySuKien)) throw new Error('Vui lòng chọn ngày nghiệp vụ.');
  if (ngaySuKien > todayIso()) throw new Error('Ngày nghiệp vụ không được lớn hơn ngày hiện tại.');
  const previousBusinessDate = latestBusinessEventDate(item);
  if (validIsoBusinessDate(previousBusinessDate) && ngaySuKien < previousBusinessDate) {
    throw new Error('Ngày nghiệp vụ không được nhỏ hơn ngày của bước trước (' + formatBusinessDate(previousBusinessDate) + ').');
  }

  if (status === 'DA_VE_TRUNG_TAM') {
    const tinhTrangKhiVe = String($('journeyReturnCondition').value || '').trim();
    if (!tinhTrangKhiVe || tinhTrangKhiVe.length > 1500) throw new Error('Vui lòng nhập Tình trạng khi về.');
    return { status, tinhTrangKhiVe, lyDo: '', tinhTrang: '', noiDen: CENTER_NAME, ghiChu, ngaySuKien, ngayTuVong: '', noiTuVong: '' };
  }

  const tinhTrang = String($('journeyUpdateDiagnosis').value || '').trim();
  if (!tinhTrang || tinhTrang.length > 1500) throw new Error('Vui lòng nhập Tình trạng/chẩn đoán.');
  const lyDo = tinhTrang;

  let noiDen = item.noiHienTai;
  if (status === 'CHUYEN_TIEP_BENH_VIEN_KHAC') {
    noiDen = resolvedDestination('journeyUpdateDestination', 'journeyUpdateDestinationOther');
    if (!noiDen || noiDen.length > 300) throw new Error('Vui lòng chọn hoặc nhập Nơi đến khi chuyển tiếp bệnh viện khác.');
    if (normalizeText(noiDen) === normalizeText(item.noiHienTai)) throw new Error('Nơi đến mới phải khác nơi hiện tại.');
  }

  let ngayTuVong = '';
  let noiTuVong = '';
  if (status === 'TU_VONG_TAI_BENH_VIEN' || status === 'TU_VONG_TAI_NOI_KHAC') {
    ngayTuVong = ngaySuKien;
    if (status === 'TU_VONG_TAI_NOI_KHAC') {
      noiTuVong = String($('journeyUpdateDeathPlace').value || '').trim();
      if (!noiTuVong || noiTuVong.length > 300) throw new Error('Vui lòng nhập Nơi tử vong.');
    } else {
      noiTuVong = String(item.noiHienTai || '').trim();
    }
  }

  return { status, tinhTrangKhiVe: '', lyDo, tinhTrang, noiDen, ghiChu, ngaySuKien, ngayTuVong, noiTuVong };
}

async function saveJourneyUpdate() {
  if (!canEdit() || !state.selectedCase) return;
  let payload;
  try { payload = updatePayload(); }
  catch (error) { $('journeyUpdateError').textContent = friendlyError(error); return; }
  const user = auth.currentUser;
  if (!user) { $('journeyUpdateError').textContent = 'Vui lòng đăng nhập lại.'; return; }
  $('journeyUpdateSave').disabled = true;
  $('journeyUpdateSave').textContent = 'Đang lưu...';
  try {
    const caseId = state.selectedCase.id;
    const latestSnap = await get(ref(db, `${REPORT_ROOT}/hanhTrinhChuyenVien/${caseId}`));
    if (!latestSnap.exists()) throw new Error('Không tìm thấy hành trình.');
    const latest = caseFromRaw(caseId, latestSnap.val());
    if (latest.trangThaiKyThuat !== 'OPEN') throw new Error('Hành trình này đã kết thúc và không thể cập nhật thêm.');

    const historyId = push(ref(db, `${REPORT_ROOT}/hanhTrinhChuyenVien/${caseId}/lichSu`)).key;
    const businessDate = payload.ngaySuKien;
    const logId = push(ref(db, `${REPORT_ROOT}/nhatKy/${businessDate.slice(0, 7)}`)).key;
    const displayName = await resolveCurrentDisplayName();
    const email = normalizeEmail(user.email);
    const ts = serverTimestamp();
    const isTransfer = payload.status === 'CHUYEN_TIEP_BENH_VIEN_KHAC';
    const isReturn = payload.status === 'DA_VE_TRUNG_TAM';
    const isDeathHospital = payload.status === 'TU_VONG_TAI_BENH_VIEN';
    const isDeathOther = payload.status === 'TU_VONG_TAI_NOI_KHAC';
    const isDeath = isDeathHospital || isDeathOther;
    const isClosed = isReturn || isDeath;
    const nextOrder = Number(latest.thuTuChang || 1) + (isTransfer || isReturn ? 1 : 0);
    const nextInfo = {
      id: latest.id,
      doiTuong: latest.doiTuong,
      doiTuongNorm: latest.doiTuongNorm,
      theBHYT: latest.theBHYT || '',
      theBHYTNorm: latest.theBHYTNorm || '',
      doiTuongKey: latest.doiTuongKey,
      hinhThucChuyen: latest.hinhThucChuyen || inferLegacyTransferType(latest),
      hinhThucChuyenKhac: latest.hinhThucChuyenKhac || '',
      noiDiBanDau: latest.noiDiBanDau || CENTER_NAME,
      noiHienTai: isReturn ? CENTER_NAME : (isTransfer ? payload.noiDen : latest.noiHienTai),
      ngayChuyenVien: String(latest.ngayChuyenVien || transferBusinessDate(latest) || ''),
      ngaySuKienHienTai: businessDate,
      ngayTuVong: isDeath ? payload.ngayTuVong : String(latest.ngayTuVong || ''),
      noiTuVong: isDeath ? payload.noiTuVong : String(latest.noiTuVong || ''),
      lyDoHienTai: isReturn ? latest.lyDoHienTai : payload.lyDo,
      tinhTrangChanDoanHienTai: isReturn ? latest.tinhTrangChanDoanHienTai : payload.tinhTrang,
      ghiChu: payload.ghiChu || latest.ghiChu || '',
      trangThaiHienTai: payload.status,
      trangThaiKyThuat: isClosed ? 'CLOSED' : 'OPEN',
      ngayGioDi: Number(latest.ngayGioDi || 0),
      ngayGioVe: isReturn ? ts : 0,
      tinhTrangKhiVe: isReturn ? payload.tinhTrangKhiVe : '',
      thuTuChang: nextOrder,
      version: Number(latest.version || 1) + 1,
      createdAt: Number(latest.createdAt || 0),
      createdByUid: latest.createdByUid,
      createdByEmail: latest.createdByEmail,
      createdByName: latest.createdByName,
      updatedAt: ts,
      updatedByUid: user.uid,
      updatedByEmail: email,
      updatedByName: displayName
    };
    if (validGender(latest.gioiTinh)) nextInfo.gioiTinh = latest.gioiTinh;
    if (validBirthYear(latest.namSinh)) nextInfo.namSinh = Number(latest.namSinh);
    const eventType = isTransfer ? 'CHUYEN_TIEP' : isReturn ? 'DA_VE_TRUNG_TAM' : isDeathOther ? 'TU_VONG_TAI_NOI_KHAC' : isDeathHospital ? 'TU_VONG_TAI_BENH_VIEN' : 'CAP_NHAT_TRANG_THAI';
    const updates = {};
    updates[`${REPORT_ROOT}/hanhTrinhChuyenVien/${caseId}/thongTin`] = nextInfo;
    updates[`${REPORT_ROOT}/hanhTrinhChuyenVien/${caseId}/lichSu/${historyId}`] = {
      id: historyId,
      caseId,
      loaiSuKien: eventType,
      trangThaiTruoc: latest.trangThaiHienTai || '',
      trangThaiSau: payload.status,
      noiTruoc: latest.noiHienTai || '',
      noiSau: isReturn ? CENTER_NAME : (isTransfer ? payload.noiDen : (isDeathOther ? payload.noiTuVong : latest.noiHienTai || '')),
      ngaySuKien: businessDate,
      ngayTuVong: isDeath ? payload.ngayTuVong : '',
      noiTuVong: isDeath ? payload.noiTuVong : '',
      hinhThucChuyen: latest.hinhThucChuyen || inferLegacyTransferType(latest),
      hinhThucChuyenKhac: latest.hinhThucChuyenKhac || '',
      lyDo: payload.lyDo,
      tinhTrangChanDoan: payload.tinhTrang,
      ghiChu: payload.ghiChu,
      tinhTrangKhiVe: payload.tinhTrangKhiVe,
      uid: user.uid,
      email,
      displayName,
      createdAt: ts
    };
    if (isTransfer || isReturn) {
      const stageId = push(ref(db, `${REPORT_ROOT}/hanhTrinhChuyenVien/${caseId}/chang`)).key;
      updates[`${REPORT_ROOT}/hanhTrinhChuyenVien/${caseId}/chang/${stageId}`] = {
        id: stageId,
        caseId,
        thuTu: nextOrder,
        noiDi: latest.noiHienTai || '',
        noiDen: isReturn ? CENTER_NAME : payload.noiDen,
        hinhThucChuyen: latest.hinhThucChuyen || inferLegacyTransferType(latest),
        hinhThucChuyenKhac: latest.hinhThucChuyenKhac || '',
        lyDo: isReturn ? 'Trở về Trung tâm' : payload.lyDo,
        tinhTrangChanDoan: isReturn ? payload.tinhTrangKhiVe : payload.tinhTrang,
        ghiChu: payload.ghiChu,
        trangThaiSauChang: payload.status,
        ngaySuKien: businessDate,
        thoiDiem: ts,
        uid: user.uid,
        email,
        displayName
      };
    }
    if (isClosed) {
      updates[`${REPORT_ROOT}/hanhTrinhDangMo/${latest.doiTuongKey}`] = null;
    }
    if (isDeath) {
      const markerPrefix = isDeathOther ? 'OTHER_' : 'HOSP_';
      updates[`${REPORT_ROOT}/congKhaiThongKe/tuVongTheoNgay/${businessDate}/${markerPrefix}${caseId}`] = true;
    }
    updates[`${REPORT_ROOT}/nhatKy/${businessDate.slice(0, 7)}/${logId}`] = {
      action: eventLabel(eventType),
      content: `${latest.doiTuong} · ${statusLabel(payload.status)}${isTransfer ? ` · ${latest.noiHienTai} → ${payload.noiDen}` : isDeathOther ? ` · ${payload.noiTuVong}` : ''}`, 
      reportId: caseId,
      loaiBaoCao: 'CHUYEN_VIEN',
      dataDate: businessDate,
      uid: user.uid,
      email,
      displayName,
      role: roleForLog(),
      createdAt: ts
    };
    await update(ref(db), updates);
    if (isTransfer) notifyBusinessEvent('TRANSFER_FORWARDED', caseId);
    else if (isReturn) notifyBusinessEvent('TRANSFER_RETURNED', caseId);
    else if (isDeathHospital) notifyBusinessEvent('DEATH_HOSPITAL', caseId);
    else if (isDeathOther) notifyBusinessEvent('DEATH_OTHER', caseId);
    closeUpdateDialog(true);
    showToast(isReturn ? 'Đã xác nhận đối tượng về Trung tâm.' : isDeathOther ? 'Đã kết thúc hành trình với trạng thái tử vong tại nơi khác.' : isDeathHospital ? 'Đã kết thúc hành trình với trạng thái tử vong tại bệnh viện.' : 'Đã cập nhật hành trình.', 'ok');
    await loadJourneys(true);
    setSubView(isClosed ? 'history' : 'tracking');
  } catch (error) {
    console.error(error);
    $('journeyUpdateError').textContent = friendlyError(error, 'Không thể cập nhật hành trình. Vui lòng thử lại.');
  } finally {
    $('journeyUpdateSave').disabled = false;
    $('journeyUpdateSave').textContent = 'Lưu cập nhật';
  }
}

function openDetail(id) {
  const item = findCase(id);
  if (!item) return;
  state.selectedCase = item;
  state.lastFocus = document.activeElement;
  $('journeyDetailTitle').textContent = item.doiTuong || 'Hành trình chuyển viện';
  const closed = item.trangThaiKyThuat === 'CLOSED';
  const hasDemographics = validGender(item.gioiTinh) || validBirthYear(item.namSinh);
  $('journeyDetailMeta').classList.toggle('has-demographics', hasDemographics);
  $('journeyDetailMeta').innerHTML = `
    <div class="journey-detail-summary-main">
      <div class="journey-detail-summary-facts">
        ${validGender(item.gioiTinh) ? `<span>${esc(item.gioiTinh)}</span>` : ''}
        ${validBirthYear(item.namSinh) ? `<span>Sinh năm ${esc(item.namSinh)}</span>` : ''}
        <span>${esc(transferTypeLabel(inferLegacyTransferType(item), item.hinhThucChuyenKhac))}</span>
      </div>
      <span class="journey-status ${statusClass(item.trangThaiHienTai)}">${item.trangThaiHienTai === 'DA_VE_TRUNG_TAM' ? '✓ ' : ''}${esc(statusLabel(item.trangThaiHienTai))}</span>
    </div>
    <div class="journey-detail-summary-time"><span>Ngày chuyển viện</span><strong>${esc(formatBusinessDate(transferBusinessDate(item)))}</strong></div>
    ${closed ? `<div class="journey-detail-summary-time"><span>Ngày kết thúc</span><strong>${esc(formatBusinessDate(historyBusinessDate(item)))}</strong></div>` : ''}
    <div class="journey-detail-extra">
      <div><span>Nơi điều trị</span><strong>${esc(historyTreatmentPlace(item))}</strong></div>
      <div><span>Tình trạng / chẩn đoán</span><strong>${esc(historyDiagnosis(item))}</strong></div>
    </div>`;
  const events = Object.values(item.lichSu || {}).sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0));
  $('journeyTimeline').innerHTML = events.length ? events.map((event) => {
    const note = String(event.ghiChu || '').trim();
    const diagnosis = String(event.tinhTrangChanDoan || '').trim();
    const returnCondition = String(event.tinhTrangKhiVe || '').trim();
    const lines = [];
    if (event.loaiSuKien === 'DA_VE_TRUNG_TAM') {
      if (returnCondition) lines.push(`<p><b>Tình trạng khi về:</b> ${esc(returnCondition)}</p>`);
    } else {
      if (event.loaiSuKien === 'TU_VONG_TAI_NOI_KHAC' && event.noiTuVong) lines.push(`<p><b>Nơi tử vong:</b> ${esc(event.noiTuVong)}</p>`);
      if (diagnosis) lines.push(`<p><b>Tình trạng/chẩn đoán:</b> ${esc(diagnosis)}</p>`);
    }
    if (note) lines.push(`<p><b>Ghi chú:</b> ${esc(note)}</p>`);
    const personLabel = event.loaiSuKien === 'MO_HANH_TRINH' ? 'Người nhập' : 'Người cập nhật';
    return `<div class="journey-timeline-item">
      <div class="journey-timeline-dot"></div>
      <div class="journey-timeline-card">
        <div class="journey-timeline-head"><strong>${esc(timelineTitle(event))}</strong><span>${esc(formatBusinessDate(eventBusinessDate(event, item)))} <small class="journey-audit-time">· nhập ${esc(fmtDateTime(event.createdAt))}</small></span></div>
        <div class="journey-timeline-status ${statusClass(event.trangThaiSau)}">${esc(timelineBadge(event, item))}</div>
        ${lines.join('')}
        <div class="journey-timeline-by">${personLabel}: ${esc(preferredName(event.uid, event.displayName))}</div>
      </div>
    </div>`;
  }).join('') : '<div class="journey-empty">Chưa có lịch sử hành trình.</div>';
  $('journeyDetailLayer').hidden = false;
  setBodyModalState(true);
  window.setTimeout(() => $('journeyDetailCloseBottom')?.focus(), 0);
}

function closeDetail() {
  $('journeyDetailLayer').hidden = true;
  setBodyModalState(false);
  state.selectedCase = null;
  restoreFocus();
}

function reviewMetricLabel(type) {
  return String(type || '').toUpperCase() === 'DEATH' ? 'Tử vong' : 'Chuyển viện';
}
function reviewStatusLabel(status) {
  const map = { PENDING: 'Chờ xử lý', PROCESSING: 'Đang xử lý', RESOLVED: 'Đã xử lý' };
  return map[String(status || '').toUpperCase()] || status || '—';
}
function pendingReviewCount() {
  return state.reviewRequests.filter((item) => item && item.status !== 'RESOLVED').length;
}
function renderReviewBadge() {
  const button = $('btnReviewRequests');
  const badge = $('reviewRequestBadge');
  const visible = canEdit();
  if (button) button.hidden = !visible;
  if (!badge) return;
  const count = pendingReviewCount();
  badge.hidden = count < 1;
  badge.textContent = count > 99 ? '99+' : String(count);
}
function renderReviewInbox() {
  const list = $('reviewInboxList');
  if (!list) return;
  const rows = state.reviewRequests.slice().sort((a, b) => {
    const rank = { PENDING: 0, PROCESSING: 1, RESOLVED: 2 };
    return (rank[a.status] ?? 9) - (rank[b.status] ?? 9) || Number(b.requestedAt || 0) - Number(a.requestedAt || 0);
  });
  if (!rows.length) {
    list.innerHTML = '<div class="journey-empty"><strong>Chưa có yêu cầu đối soát.</strong></div>';
    return;
  }
  list.innerHTML = rows.map((item) => {
    const expected = item.expectedValueProvided === true ? `${Number(item.expectedValue || 0).toLocaleString('vi-VN')} lượt` : 'Không nêu số cụ thể';
    const isResolved = item.status === 'RESOLVED';
    const isFocused = state.reviewFocusId && state.reviewFocusId === item.id;
    return `<article class="review-request-item${isFocused ? ' is-focused' : ''}" data-review-id="${esc(item.id)}">
      <div class="review-request-item-head">
        <div><strong>${esc(reviewMetricLabel(item.metricType))} · ${esc(formatBusinessDate(item.date))}</strong><span class="status-chip ${isResolved ? 'is-complete' : 'is-auto'}">${esc(reviewStatusLabel(item.status))}</span></div>
        <small>${esc(item.requestedByName || item.requestedByEmail || 'Người tổng hợp')}</small>
      </div>
      <div class="review-request-item-grid">
        <div><span>Hệ thống ghi nhận</span><strong>${Number(item.currentValue || 0).toLocaleString('vi-VN')} lượt</strong></div>
        <div><span>Đề nghị kiểm tra</span><strong>${esc(expected)}</strong></div>
      </div>
      <p class="review-request-reason"><b>Lý do:</b> ${esc(item.reason || '—')}</p>
      ${isResolved ? `<div class="review-resolution"><b>Kết quả:</b> ${esc(item.resolutionNote || 'Đã xử lý')} · Số liệu sau xử lý: ${Number(item.finalValue || 0).toLocaleString('vi-VN')} lượt</div>` : `<div class="field"><label>Kết quả xử lý<textarea class="review-resolution-note" maxlength="500" rows="2" placeholder="Ví dụ: Đã xóa 01 trường hợp nhập trùng."></textarea></label></div><div class="review-request-actions"><button class="btn btn-primary review-action" data-kind="resolve" data-id="${esc(item.id)}" type="button">Xác nhận đã xử lý</button></div>`}
    </article>`;
  }).join('');
  if (state.reviewFocusId) {
    window.setTimeout(() => {
      const target = list.querySelector(`[data-review-id="${CSS.escape(state.reviewFocusId)}"]`);
      if (target) target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 60);
  }
}
function openReviewInbox(requestId) {
  if (!canEdit()) return;
  state.reviewFocusId = String(requestId || '');
  renderReviewInbox();
  const layer = $('reviewInboxLayer');
  if (layer) layer.hidden = false;
  setBodyModalState(true);
  window.setTimeout(() => $('reviewInboxClose')?.focus(), 0);
}
function closeReviewInbox() {
  const layer = $('reviewInboxLayer');
  if (layer) layer.hidden = true;
  state.reviewFocusId = '';
  setBodyModalState(false);
}
async function resolveReviewRequest(id) {
  if (!canEdit()) return;
  const request = state.reviewRequests.find((item) => item.id === id);
  if (!request || request.status === 'RESOLVED') return;
  const card = $('reviewInboxList')?.querySelector(`[data-review-id="${CSS.escape(id)}"]`);
  const note = String(card?.querySelector('.review-resolution-note')?.value || '').trim();
  if (!note) {
    showToast('Vui lòng ghi kết quả xử lý trước khi xác nhận.', 'warn');
    return;
  }
  const user = auth.currentUser;
  if (!user) return;
  try {
    const statsPath = request.metricType === 'DEATH'
      ? `${REPORT_ROOT}/congKhaiThongKe/tuVongTheoNgay/${request.date}`
      : `${REPORT_ROOT}/congKhaiThongKe/chuyenVienTheoNgay/${request.date}`;
    const statsSnap = await get(ref(db, statsPath));
    const finalValue = markerCount(snapshotObject(statsSnap), request.metricType === 'DEATH' ? 'death' : 'transfer');
    const displayName = await resolveCurrentDisplayName();
    const updates = {};
    updates[`${REVIEW_ROOT}/${id}/status`] = 'RESOLVED';
    updates[`${REVIEW_ROOT}/${id}/resolutionNote`] = note.slice(0, 500);
    updates[`${REVIEW_ROOT}/${id}/finalValue`] = finalValue;
    updates[`${REVIEW_ROOT}/${id}/resolvedByUid`] = user.uid;
    updates[`${REVIEW_ROOT}/${id}/resolvedByEmail`] = normalizeEmail(user.email);
    updates[`${REVIEW_ROOT}/${id}/resolvedByName`] = displayName;
    updates[`${REVIEW_ROOT}/${id}/resolvedAt`] = serverTimestamp();
    updates[`${REVIEW_ROOT}/${id}/updatedAt`] = serverTimestamp();
    await update(ref(db), updates);
    notifyBusinessEvent('REPORT_REVIEW_RESOLVED', id);
    showToast('Đã xác nhận xử lý yêu cầu đối soát.', 'ok');
  } catch (error) {
    console.error(error);
    showToast(friendlyError(error, 'Không thể cập nhật yêu cầu đối soát.'), 'err');
  }
}
async function openResource(data) {
  data = data && typeof data === 'object' ? data : {};
  await activate();
  const requestId = String(data.requestId || (String(data.eventType || '').startsWith('REPORT_REVIEW_') ? data.resourceId || '' : '') || '');
  if (requestId && canEdit()) {
    openReviewInbox(requestId);
    return true;
  }
  const caseId = String(data.caseId || data.resourceId || '');
  if (caseId) {
    const item = findCase(caseId);
    if (item) {
      setSubView(item.trangThaiKyThuat === 'CLOSED' ? 'history' : 'tracking');
      window.setTimeout(() => openDetail(caseId), 80);
      return true;
    }
  }
  if (data.date) {
    openHistoryFilter({ from: data.date, to: data.date, status: data.status || 'all' });
    return true;
  }
  return false;
}
function openHistoryFilter(options) {
  options = options || {};
  setSubView('history');
  if ($('journeyHistoryFrom')) $('journeyHistoryFrom').value = String(options.from || '');
  if ($('journeyHistoryTo')) $('journeyHistoryTo').value = String(options.to || '');
  if ($('journeyHistoryStatus') && options.status && Array.from($('journeyHistoryStatus').options).some((o) => o.value === options.status)) $('journeyHistoryStatus').value = options.status;
  renderHistory();
}

async function activate() {
  await refreshPermission();
  if (!canView()) return;
  if ($('journeyCreateTab')) $('journeyCreateTab').hidden = !canEdit();
  renderReviewBadge();
  if (!state.createBaseline) resetCreateForm();
  await loadJourneys(false);
  setSubView(state.subView || 'tracking');
}

function setVisible(visible) {
  const panel = $('transferJourneyPanel');
  if (panel) panel.hidden = !visible;
  if (visible) activate().catch((error) => console.error(error));
}

function initEvents() {
  if (state.initialized) return;
  state.initialized = true;
  const advancedHistory = $('journeyHistoryAdvanced');
  if (advancedHistory && window.matchMedia && window.matchMedia('(max-width: 760px)').matches) advancedHistory.open = false;
  initializeActionPopoverPositioning();
  document.querySelectorAll('.journey-subtab').forEach((button) => {
    button.addEventListener('click', () => requestSubView(button.getAttribute('data-journey-view')));
  });
  $('journeyCreateSave')?.addEventListener('click', createJourney);
  $('journeyCreateCancel')?.addEventListener('click', () => requestSubView('tracking'));
  $('journeyCreateModeTransfer')?.addEventListener('click', () => { if (state.subView !== 'create') setSubView('create'); setTimeout(() => $('journeyPatient')?.focus(), 0); });
  $('journeyTransferType')?.addEventListener('change', updateCreateDynamicFields);
  $('journeyTo')?.addEventListener('change', updateCreateDynamicFields);
  $('journeyTrackingSearch')?.addEventListener('input', renderTracking);
  $('journeyTrackingReload')?.addEventListener('click', () => loadJourneys(true));
  $('journeyHistorySearch')?.addEventListener('input', renderHistory);
  $('journeyHistoryStatus')?.addEventListener('change', renderHistory);
  $('journeyHistoryFrom')?.addEventListener('change', renderHistory);
  $('journeyHistoryTo')?.addEventListener('change', renderHistory);
  $('journeyHistoryClear')?.addEventListener('click', () => { $('journeyHistorySearch').value = ''; $('journeyHistoryFrom').value = ''; $('journeyHistoryTo').value = ''; $('journeyHistoryStatus').value = 'all'; renderHistory(); });
  $('journeyHistoryReload')?.addEventListener('click', () => loadJourneys(true));
  $('journeyTrackingList')?.addEventListener('click', (event) => {
    const button = event.target.closest('.journey-action');
    if (!button) return;
    const id = button.getAttribute('data-id');
    const kind = button.getAttribute('data-kind');
    const menu = button.closest('details.journey-action-menu'); if (menu) menu.open = false;
    if (kind === 'view') openDetail(id);
    if (kind === 'update') openUpdateDialog(id, '');
    if (kind === 'return') openUpdateDialog(id, 'DA_VE_TRUNG_TAM');
    if (kind === 'delete') deleteJourney(id);
  });
  $('btnPreviewClinicalReport')?.addEventListener('click', previewClinicalReport);
  $('btnReviewRequests')?.addEventListener('click', () => openReviewInbox(''));
  $('reviewInboxClose')?.addEventListener('click', closeReviewInbox);
  $('reviewInboxCloseX')?.addEventListener('click', closeReviewInbox);
  $('reviewInboxLayer')?.addEventListener('click', (event) => { if (event.target === $('reviewInboxLayer')) closeReviewInbox(); });
  $('reviewInboxList')?.addEventListener('click', (event) => { const btn = event.target.closest('.review-action'); if (btn && btn.getAttribute('data-kind') === 'resolve') resolveReviewRequest(btn.getAttribute('data-id')); });
  $('journeyHistoryList')?.addEventListener('click', (event) => {
    const button = event.target.closest('.journey-history-action');
    if (!button) return;
    const kind = button.getAttribute('data-kind');
    const menu = button.closest('details.journey-action-menu'); if (menu) menu.open = false;
    if (kind === 'view') openDetail(button.getAttribute('data-id'));
    if (kind === 'journey-delete') deleteJourney(button.getAttribute('data-id'));
  });
  $('journeyUpdateStatus')?.addEventListener('change', updateUpdateFields);
  $('journeyUpdateDestination')?.addEventListener('change', () => toggleOtherDestination('journeyUpdateDestination', 'journeyUpdateDestinationOtherField', 'journeyUpdateDestinationOther'));
  $('journeyUpdateCancel')?.addEventListener('click', () => closeUpdateDialog(false));
  $('journeyUpdateCloseX')?.addEventListener('click', () => closeUpdateDialog(false));
  $('journeyUpdateSave')?.addEventListener('click', saveJourneyUpdate);
  $('journeyDetailClose')?.addEventListener('click', closeDetail);
  $('journeyDetailCloseBottom')?.addEventListener('click', closeDetail);
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!$('reviewInboxLayer')?.hidden) closeReviewInbox();
    else if (!$('journeyUpdateLayer')?.hidden) closeUpdateDialog(false);
    else if (!$('journeyDetailLayer')?.hidden) closeDetail();
  });
  window.addEventListener('beforeunload', (event) => {
    if (!isCreateDirty() && !(!$('journeyUpdateLayer')?.hidden && isUpdateDirty())) return;
    event.preventDefault();
    event.returnValue = '';
  });
  state.refreshTimer = setInterval(() => {
    const panel = $('transferJourneyPanel');
    if (panel && !panel.hidden && state.subView === 'tracking') renderTracking();
  }, 60000);
}

window.YTE_JOURNEYS = {
  activate,
  setVisible,
  setSubView,
  loadJourneys,
  renderHistory,
  openReportPreview: previewClinicalReport,
  openResource,
  openHistoryFilter,
  openReviewInbox,
  captureUpdateContext: () => ({ subView: state.subView || 'tracking' }),
  restoreUpdateContext: (ctx) => { if (ctx && ctx.subView) setSubView(ctx.subView); },
  hasUnsavedChanges: () => isCreateDirty() || (!($('journeyUpdateLayer')?.hidden) && isUpdateDirty())
};

function start() {
  initEvents();
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      stopJourneyRealtime();
      state.permission = null;
      state.tongHopPermission = null;
      state.openCases = [];
      state.closedCases = [];
      state.transferStatsToday = {};
      state.deathStatsToday = {};
      state.displayNames = {};
      state.reviewRequests = [];
      state.reviewFocusId = '';
      renderReviewBadge();
      state.loadedAt = 0;
      return;
    }
    try {
      await refreshPermission();
      startJourneyRealtime();
      const reportsView = $('reportsView');
      const transferTab = document.querySelector('.report-type-tab[data-report-type="CHUYEN_VIEN"]');
      if (reportsView && reportsView.classList.contains('active') && transferTab && transferTab.classList.contains('active')) {
        await activate();
      }
    } catch (error) { console.error(error); }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}
