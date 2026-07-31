'use strict';

// Dán URL Web App Apps Script kết thúc bằng /exec vào đây.
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx0BHA-P1sAuGXEtrQatvEsMXMn3d7Pb024mCbu9tRTvaAr0xdy_cA0GPvJ_kFne6dOgw/exec';
const MAX_RANGE_DAYS = 1096;

const state = {
  categories: [],
  records: [],
  logs: [],
  generatedAt: '',
  appliedRange: null
};

const $ = id => document.getElementById(id);
const numberValue = value => Number(value || 0);
const numberFormat = value => new Intl.NumberFormat('vi-VN').format(numberValue(value));

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function localIsoDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(isoDate) {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : isoDate;
}

function parseLocalDate(isoDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate || ''));
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(isoDate, days) {
  const date = parseLocalDate(isoDate);
  if (!date) return isoDate;
  date.setDate(date.getDate() + days);
  return localIsoDate(date);
}

function daysBetween(from, to) {
  const start = parseLocalDate(from);
  const end = parseLocalDate(to);
  if (!start || !end) return NaN;
  return Math.floor((end - start) / 86400000) + 1;
}

function showLoading(visible) {
  $('loading').hidden = !visible;
}

function toast(message, type = 'success') {
  const element = $('toast');
  element.textContent = message;
  element.className = `toast show${type === 'error' ? ' error' : ''}`;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.remove('show'), 3200);
}

function notice(message = '') {
  $('notice').hidden = !message;
  $('notice').textContent = message;
}

function setStatus(mode, text) {
  $('statusDot').className = `status-dot${mode ? ` ${mode}` : ''}`;
  $('syncText').textContent = text;
}

function init() {
  const today = localIsoDate();
  const firstOfMonth = `${today.slice(0, 8)}01`;
  $('daySelect').value = today;
  $('fromDate').value = firstOfMonth;
  $('toDate').value = today;
  $('monthSelect').value = today.slice(0, 7);

  const currentYear = new Date().getFullYear();
  for (let year = currentYear - 7; year <= currentYear + 2; year += 1) {
    $('yearSelect').add(new Option(String(year), String(year)));
  }
  $('yearSelect').value = String(currentYear);
  $('quarterSelect').value = String(Math.ceil((new Date().getMonth() + 1) / 3));

  bindEvents();
  togglePeriodFields();
  applyFilter(false);
}

function bindEvents() {
  $('periodType').addEventListener('change', togglePeriodFields);
  $('btnApply').addEventListener('click', () => applyFilter(true));
  $('btnSync').addEventListener('click', () => applyFilter(true));
  $('btnExport').addEventListener('click', exportCsv);
  $('searchInput').addEventListener('input', renderLookup);
  $('historySearch').addEventListener('input', renderHistory);
  $('btnAccount').addEventListener('click', openAccountModal);
  $('btnCloseAndSync').addEventListener('click', async () => {
    closeAccountModal();
    await applyFilter(true);
  });

  document.querySelectorAll('[data-close-account]').forEach(element => {
    element.addEventListener('click', closeAccountModal);
  });

  document.querySelectorAll('.tab').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(item => item.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      $(button.dataset.tab).classList.add('active');
    });
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !$('accountModal').hidden) closeAccountModal();
  });

  window.addEventListener('message', handleFrameMessage);
  $('accountFrame').addEventListener('load', () => {
    // Việc ẩn loading chính thức diễn ra sau handshake. Đây là phương án dự phòng.
    setTimeout(() => {
      if (!$('accountModal').hidden) $('frameLoading').hidden = true;
    }, 2500);
  });
}

function togglePeriodFields() {
  const type = $('periodType').value;
  $('dayField').hidden = type !== 'day';
  $('fromField').hidden = type !== 'range';
  $('toField').hidden = type !== 'range';
  $('monthField').hidden = type !== 'month';
  $('quarterField').hidden = type !== 'quarter';
  $('yearField').hidden = !['quarter', 'year'].includes(type);
}

function selectedRange() {
  const type = $('periodType').value;

  if (type === 'day') {
    const date = $('daySelect').value;
    return { type, label: `ngày ${formatDate(date)}`, from: date, to: date };
  }

  if (type === 'range') {
    const from = $('fromDate').value;
    const to = $('toDate').value;
    return {
      type,
      label: `từ ${formatDate(from)} đến ${formatDate(to)}`,
      from,
      to
    };
  }

  if (type === 'month') {
    const value = $('monthSelect').value;
    const [year, month] = value.split('-').map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    return {
      type,
      label: `tháng ${month}/${year}`,
      from: `${year}-${String(month).padStart(2, '0')}-01`,
      to: `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    };
  }

  const year = Number($('yearSelect').value);
  if (type === 'quarter') {
    const quarter = Number($('quarterSelect').value);
    const startMonth = (quarter - 1) * 3 + 1;
    const endMonth = quarter * 3;
    const lastDay = new Date(year, endMonth, 0).getDate();
    return {
      type,
      label: `quý ${quarter}/${year}`,
      from: `${year}-${String(startMonth).padStart(2, '0')}-01`,
      to: `${year}-${String(endMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    };
  }

  return {
    type,
    label: `năm ${year}`,
    from: `${year}-01-01`,
    to: `${year}-12-31`
  };
}

function validateRange(range) {
  if (!range.from || !range.to || !parseLocalDate(range.from) || !parseLocalDate(range.to)) {
    throw new Error('Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc.');
  }
  if (range.from > range.to) {
    throw new Error('Từ ngày không được lớn hơn đến ngày.');
  }
  const totalDays = daysBetween(range.from, range.to);
  if (!Number.isFinite(totalDays) || totalDays < 1) {
    throw new Error('Khoảng thời gian không hợp lệ.');
  }
  if (totalDays > MAX_RANGE_DAYS) {
    throw new Error('Khoảng thống kê tối đa là 3 năm.');
  }
}

function loadJsonp(range) {
  return new Promise((resolve, reject) => {
    if (!/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(APPS_SCRIPT_URL)) {
      reject(new Error('Chưa cấu hình đúng URL Apps Script /exec trong app.js.'));
      return;
    }

    const callbackName = `yteCallback_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const script = document.createElement('script');
    let finished = false;

    const cleanup = () => {
      delete window[callbackName];
      script.remove();
    };

    const timer = setTimeout(() => {
      if (finished) return;
      finished = true;
      cleanup();
      reject(new Error('Quá thời gian kết nối Google Sheet. Vui lòng thử lại.'));
    }, 25000);

    window[callbackName] = response => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      cleanup();
      if (response && response.success) resolve(response);
      else reject(new Error(response?.message || 'Không tải được dữ liệu.'));
    };

    script.onerror = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      cleanup();
      reject(new Error('Không thể kết nối Apps Script. Kiểm tra bản triển khai và quyền truy cập.'));
    };

    const params = new URLSearchParams({
      action: 'data',
      from: range.from,
      to: range.to,
      callback: callbackName,
      _: String(Date.now())
    });
    script.src = `${APPS_SCRIPT_URL}?${params.toString()}`;
    document.body.appendChild(script);
  });
}

async function applyFilter(showSuccess = true) {
  let range;
  try {
    range = selectedRange();
    validateRange(range);
  } catch (error) {
    toast(error.message, 'error');
    return;
  }

  showLoading(true);
  notice('');
  setStatus('loading', 'Đang đồng bộ...');

  try {
    const response = await loadJsonp(range);
    state.categories = response.categories || [];
    state.records = response.records || [];
    state.logs = response.logs || [];
    state.generatedAt = response.generatedAt || '';
    state.appliedRange = range;
    renderAll();
    setStatus('ok', `Đã đồng bộ ${state.generatedAt}`);
    if (showSuccess) toast('Đã đồng bộ dữ liệu.');
  } catch (error) {
    setStatus('error', 'Đồng bộ thất bại');
    notice(error.message);
    toast(error.message, 'error');
  } finally {
    showLoading(false);
  }
}

function aggregate(records) {
  const map = new Map();
  records.forEach(record => {
    map.set(record.code, (map.get(record.code) || 0) + numberValue(record.value));
  });
  return map;
}

function displayCategories() {
  const categories = [...state.categories];
  const index = categories.findIndex(item => item.code === 'TAM_THAN_KHONG_BHYT');
  categories.splice(index >= 0 ? index + 1 : categories.length, 0, {
    code: 'TAM_THAN_TONG',
    name: 'Khám tâm thần - Tổng cộng',
    group: 'Tâm thần',
    unit: 'Lượt',
    derived: true
  });
  return categories;
}

function getValue(map, code) {
  if (code === 'TAM_THAN_TONG') {
    return numberValue(map.get('TAM_THAN_BHYT')) + numberValue(map.get('TAM_THAN_KHONG_BHYT'));
  }
  return numberValue(map.get(code));
}

function renderAll() {
  renderDashboard();
  renderLookup();
  renderReport();
  renderHistory();
}

function renderDashboard() {
  const range = state.appliedRange || selectedRange();
  const values = aggregate(state.records);
  $('summaryTitle').textContent = `Số liệu ${range.label}`;

  const featured = ['NOI_TRU', 'NGOAI_TRU', 'CHUYEN_VIEN', 'KHAM_TONG_QUAT'];
  $('kpiGrid').innerHTML = featured.map(code => {
    const category = state.categories.find(item => item.code === code) || { name: code, unit: '' };
    return `
      <article class="kpi">
        <div class="label">${escapeHtml(category.name)} <span class="unit">${escapeHtml(category.unit)}</span></div>
        <div class="value">${numberFormat(getValue(values, code))}</div>
      </article>`;
  }).join('');

  const rows = displayCategories();
  $('summaryTable').innerHTML = `
    <table>
      <thead><tr><th>Chỉ tiêu</th><th>Nhóm</th><th>Đơn vị</th><th>Giá trị</th></tr></thead>
      <tbody>
        ${rows.map(category => `
          <tr>
            <td>${escapeHtml(category.name)}</td>
            <td>${escapeHtml(category.group)}</td>
            <td>${escapeHtml(category.unit)}</td>
            <td>${numberFormat(getValue(values, category.code))}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

function renderLookup() {
  const query = $('searchInput').value.trim().toLowerCase();
  const values = aggregate(state.records);
  const categories = displayCategories().filter(category =>
    `${category.name} ${category.group}`.toLowerCase().includes(query)
  );
  const range = state.appliedRange || selectedRange();

  $('lookupTable').innerHTML = `
    <table>
      <thead><tr><th>Chỉ tiêu</th><th>Nhóm</th><th>Đơn vị</th><th>${escapeHtml(range.label)}</th></tr></thead>
      <tbody>
        ${categories.length ? categories.map(category => `
          <tr>
            <td>${escapeHtml(category.name)}</td>
            <td>${escapeHtml(category.group)}</td>
            <td>${escapeHtml(category.unit)}</td>
            <td>${numberFormat(getValue(values, category.code))}</td>
          </tr>`).join('') : '<tr><td colspan="4" class="empty">Không tìm thấy dữ liệu.</td></tr>'}
      </tbody>
    </table>`;
}

function monthKey(isoDate) {
  return isoDate.slice(0, 7);
}

function buildBuckets(range) {
  const totalDays = daysBetween(range.from, range.to);
  const daily = range.type === 'day' || range.type === 'month' || (range.type === 'range' && totalDays <= 31);
  const buckets = [];

  if (daily) {
    for (let date = range.from; date <= range.to; date = addDays(date, 1)) {
      buckets.push({ key: date, label: formatDate(date), from: date, to: date });
    }
    return { mode: 'day', buckets };
  }

  let cursor = `${range.from.slice(0, 7)}-01`;
  const lastMonth = range.to.slice(0, 7);
  while (cursor.slice(0, 7) <= lastMonth) {
    const [year, month] = cursor.slice(0, 7).split('-').map(Number);
    const endDay = new Date(year, month, 0).getDate();
    const monthFrom = cursor < range.from ? range.from : cursor;
    const monthToCandidate = `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
    const monthTo = monthToCandidate > range.to ? range.to : monthToCandidate;
    buckets.push({
      key: `${year}-${String(month).padStart(2, '0')}`,
      label: `T${month}/${year}`,
      from: monthFrom,
      to: monthTo
    });
    const next = new Date(year, month, 1);
    cursor = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01`;
  }
  return { mode: 'month', buckets };
}

function renderReport() {
  const range = state.appliedRange || selectedRange();
  const { mode, buckets } = buildBuckets(range);
  $('reportTitle').textContent = `${mode === 'day' ? 'Chi tiết theo ngày' : 'Chi tiết theo tháng'} — ${range.label}`;

  const bucketMaps = buckets.map(bucket => aggregate(
    state.records.filter(record => record.date >= bucket.from && record.date <= bucket.to)
  ));
  const categories = displayCategories();

  $('reportTable').innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Chỉ tiêu</th>
          ${buckets.map(bucket => `<th>${escapeHtml(bucket.label)}</th>`).join('')}
          <th>Tổng</th>
        </tr>
      </thead>
      <tbody>
        ${categories.map(category => {
          const values = bucketMaps.map(map => getValue(map, category.code));
          return `
            <tr>
              <td>${escapeHtml(category.name)}</td>
              ${values.map(value => `<td>${numberFormat(value)}</td>`).join('')}
              <td><strong>${numberFormat(values.reduce((sum, value) => sum + value, 0))}</strong></td>
            </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

function renderHistory() {
  const query = $('historySearch').value.trim().toLowerCase();
  const logs = state.logs.filter(log =>
    `${log.name} ${log.username || ''} ${log.action} ${log.content}`.toLowerCase().includes(query)
  );

  $('historyList').innerHTML = logs.length ? logs.map(log => `
    <article class="history-item">
      <div>
        <strong>${escapeHtml(formatDate(log.date))}</strong>
        <small>${escapeHtml(log.updatedAt)}</small>
      </div>
      <div>
        <strong>${escapeHtml(log.name || 'Không rõ')}</strong>
        <small>${escapeHtml(log.action)}</small>
      </div>
      <div>${escapeHtml(log.content)}</div>
    </article>`).join('') : '<div class="empty">Không có nhật ký trong phạm vi đã chọn.</div>';
}

function exportCsv() {
  if (!state.appliedRange) {
    toast('Chưa có dữ liệu để xuất.', 'error');
    return;
  }
  const values = aggregate(state.records);
  const range = state.appliedRange;
  const lines = [
    ['Chỉ tiêu', 'Nhóm', 'Đơn vị', range.label],
    ...displayCategories().map(category => [
      category.name,
      category.group,
      category.unit,
      getValue(values, category.code)
    ])
  ];
  const csv = '\ufeff' + lines.map(row => row.map(value =>
    `"${String(value).replaceAll('"', '""')}"`
  ).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `so-lieu-y-te-${range.from}-${range.to}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function openAccountModal() {
  const parentOrigin = window.location.origin;
  const params = new URLSearchParams({
    embedded: '1',
    parentOrigin,
    t: String(Date.now())
  });
  const url = `${APPS_SCRIPT_URL}?${params.toString()}`;
  $('accountModal').hidden = false;
  $('frameLoading').hidden = false;
  $('accountFrame').src = url;
  $('openSeparate').href = APPS_SCRIPT_URL;
  document.body.classList.add('modal-open');
}

function closeAccountModal() {
  $('accountModal').hidden = true;
  $('accountFrame').src = 'about:blank';
  document.body.classList.remove('modal-open');
}

function handleFrameMessage(event) {
  const payload = event.data;
  if (!payload || payload.source !== 'yte-app') return;

  if (payload.type === 'handshake-request') {
    const frameWindow = $('accountFrame').contentWindow;
    if (event.source !== frameWindow) return;
    event.source.postMessage({
      source: 'yte-parent',
      type: 'handshake-ack',
      challenge: payload.challenge
    }, event.origin);
    $('frameLoading').hidden = true;
    return;
  }

  if (payload.type === 'ready') {
    $('frameLoading').hidden = true;
    return;
  }

  if (payload.type === 'data-saved') {
    toast('Đã lưu số liệu. Đang đồng bộ lại...');
    setTimeout(() => applyFilter(false), 700);
  }
}

document.addEventListener('DOMContentLoaded', init);
