'use strict';

// Dùng đúng URL /exec của bản triển khai Apps Script chính thức.
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx0BHA-P1sAuGXEtrQatvEsMXMn3d7Pb024mCbu9tRTvaAr0xdy_cA0GPvJ_kFne6dOgw/exec';

const state = {
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  categories: [],
  records: [],
  matrix: {},
  generatedAt: ''
};

const $ = id => document.getElementById(id);
const num = value => Number(value || 0);
const fmt = value => new Intl.NumberFormat('vi-VN').format(num(value));
const allMonths = Array.from({ length: 12 }, (_, index) => index + 1);

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function showLoading(show) {
  $('loading').hidden = !show;
}

function showToast(message, type = 'success') {
  const toast = $('toast');
  toast.textContent = message;
  toast.className = `toast show ${type === 'error' ? 'error' : ''}`;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2800);
}

function showNotice(message = '') {
  const notice = $('notice');
  notice.hidden = !message;
  notice.textContent = message;
}

function setSyncStatus(ok, text) {
  $('statusDot').className = `status-dot ${ok === true ? 'ok' : ok === false ? 'error' : ''}`;
  $('syncText').textContent = text;
}

function buildSelectors() {
  const yearSelect = $('yearSelect');
  const monthSelect = $('monthSelect');
  const currentYear = new Date().getFullYear();

  yearSelect.innerHTML = '';
  for (let year = currentYear - 5; year <= currentYear + 2; year++) {
    yearSelect.add(new Option(String(year), String(year)));
  }
  yearSelect.value = String(state.year);

  monthSelect.innerHTML = '';
  allMonths.forEach(month => monthSelect.add(new Option(`Tháng ${month}`, String(month))));
  monthSelect.value = String(state.month);
}

function loadJsonp(year) {
  return new Promise((resolve, reject) => {
    const callbackName = `sheetCallback_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const script = document.createElement('script');
    let completed = false;

    const cleanup = () => {
      delete window[callbackName];
      script.remove();
    };

    const timeout = setTimeout(() => {
      if (completed) return;
      completed = true;
      cleanup();
      reject(new Error('Quá thời gian kết nối với Google Sheet.'));
    }, 20000);

    window[callbackName] = response => {
      if (completed) return;
      completed = true;
      clearTimeout(timeout);
      cleanup();
      if (!response?.success) {
        reject(new Error(response?.message || 'Không thể tải dữ liệu.'));
        return;
      }
      resolve(response);
    };

    script.onerror = () => {
      if (completed) return;
      completed = true;
      clearTimeout(timeout);
      cleanup();
      reject(new Error('Không thể kết nối Apps Script. Hãy kiểm tra URL triển khai.'));
    };

    const params = new URLSearchParams({
      action: 'data',
      year: String(year),
      callback: callbackName,
      _: String(Date.now())
    });
    script.src = `${APPS_SCRIPT_URL}?${params.toString()}`;
    document.body.appendChild(script);
  });
}

function buildMatrix(records) {
  const matrix = {};
  allMonths.forEach(month => { matrix[month] = {}; });
  records.forEach(record => {
    const month = Number(record.month);
    if (month >= 1 && month <= 12) {
      matrix[month][record.code] = num(record.value);
    }
  });
  return matrix;
}

function valueAt(month, code) {
  return num(state.matrix?.[month]?.[code]);
}

function sumMonths(months, code) {
  return months.reduce((total, month) => total + valueAt(month, code), 0);
}

function categoryByCode(code) {
  return state.categories.find(item => item.code === code);
}

function displayCategories() {
  const result = [...state.categories];
  const bhyt = categoryByCode('TAM_THAN_BHYT');
  const noBhyt = categoryByCode('TAM_THAN_KHONG_BHYT');
  if (bhyt || noBhyt) {
    const position = Math.max(result.findIndex(item => item.code === 'TAM_THAN_KHONG_BHYT') + 1, 0);
    result.splice(position, 0, {
      code: 'TAM_THAN_TONG',
      name: 'Khám tâm thần - Tổng cộng',
      group: 'Tâm thần',
      unit: 'Lượt',
      derived: true
    });
  }
  return result;
}

function derivedValue(month, code) {
  if (code === 'TAM_THAN_TONG') {
    return valueAt(month, 'TAM_THAN_BHYT') + valueAt(month, 'TAM_THAN_KHONG_BHYT');
  }
  return valueAt(month, code);
}

function derivedSum(months, code) {
  return months.reduce((total, month) => total + derivedValue(month, code), 0);
}

async function reloadData(showMessage = true) {
  state.year = Number($('yearSelect').value);
  showLoading(true);
  showNotice('');
  setSyncStatus(null, 'Đang đồng bộ...');

  try {
    const response = await loadJsonp(state.year);
    state.categories = Array.isArray(response.categories) ? response.categories : [];
    state.records = Array.isArray(response.records) ? response.records : [];
    state.matrix = buildMatrix(state.records);
    state.generatedAt = response.generatedAt || '';

    renderAll();
    setSyncStatus(true, `Đã đồng bộ ${state.generatedAt || ''}`.trim());
    if (showMessage) showToast('Đã đồng bộ dữ liệu từ Google Sheet.');
  } catch (error) {
    state.categories = [];
    state.records = [];
    state.matrix = buildMatrix([]);
    renderAll();
    setSyncStatus(false, 'Đồng bộ thất bại');
    showNotice(`${error.message} Dữ liệu trên màn hình hiện không phải dữ liệu mới nhất.`);
    showToast(error.message, 'error');
  } finally {
    showLoading(false);
  }
}

function renderDashboard() {
  const month = state.month;
  const previousMonth = month > 1 ? month - 1 : null;
  const featuredCodes = ['NOI_TRU', 'NGOAI_TRU', 'CHUYEN_VIEN', 'KHAM_TONG_QUAT'];

  $('kpiGrid').innerHTML = featuredCodes.map(code => {
    const item = categoryByCode(code) || { name: code, unit: '' };
    const currentValue = valueAt(month, code);
    const previousValue = previousMonth ? valueAt(previousMonth, code) : 0;
    const delta = currentValue - previousValue;
    const deltaClass = delta > 0 ? 'up' : delta < 0 ? 'down' : 'same';
    const deltaIcon = delta > 0 ? '▲' : delta < 0 ? '▼' : '●';
    const deltaText = previousMonth
      ? `${deltaIcon} ${fmt(Math.abs(delta))} so với tháng ${previousMonth}`
      : 'Không có tháng trước trong cùng năm';

    return `<article class="kpi">
      <div class="label">${escapeHtml(item.name)} <span class="unit">${escapeHtml(item.unit || '')}</span></div>
      <div class="value">${fmt(currentValue)}</div>
      <div class="delta ${deltaClass}">${deltaText}</div>
    </article>`;
  }).join('');

  const rows = featuredCodes.map(code => {
    const item = categoryByCode(code) || { name: code };
    return `<tr><td>${escapeHtml(item.name)}</td>${allMonths.map(m => `<td>${fmt(valueAt(m, code))}</td>`).join('')}</tr>`;
  }).join('');

  $('trendTable').innerHTML = `<table>
    <thead><tr><th>Chỉ tiêu</th>${allMonths.map(m => `<th>T${m}</th>`).join('')}</tr></thead>
    <tbody>${rows || '<tr><td colspan="13" class="empty">Chưa có dữ liệu.</td></tr>'}</tbody>
  </table>`;
}

function renderLookup() {
  const query = $('searchInput').value.trim().toLowerCase();
  const month = state.month;
  const quarter = Math.ceil(month / 3);
  const quarterMonths = [quarter * 3 - 2, quarter * 3 - 1, quarter * 3];
  const categories = displayCategories().filter(item => item.name.toLowerCase().includes(query));

  $('lookupTable').innerHTML = `<table>
    <thead><tr><th>Chỉ tiêu</th><th>Tháng ${month}</th><th>Quý ${quarter}</th><th>6 tháng đầu năm</th><th>Cả năm</th></tr></thead>
    <tbody>${categories.length ? categories.map(item => `<tr>
      <td>${escapeHtml(item.name)}</td>
      <td>${fmt(derivedValue(month, item.code))}</td>
      <td>${fmt(derivedSum(quarterMonths, item.code))}</td>
      <td>${fmt(derivedSum([1,2,3,4,5,6], item.code))}</td>
      <td>${fmt(derivedSum(allMonths, item.code))}</td>
    </tr>`).join('') : '<tr><td colspan="5" class="empty">Không tìm thấy chỉ tiêu phù hợp.</td></tr>'}</tbody>
  </table>`;
}

function renderReport() {
  const categories = displayCategories();
  $('reportTable').innerHTML = `<table>
    <thead><tr><th>Chỉ tiêu</th>${allMonths.map(m => `<th>T${m}</th>`).join('')}<th>Q1</th><th>Q2</th><th>6 tháng</th><th>Cả năm</th></tr></thead>
    <tbody>${categories.length ? categories.map(item => `<tr>
      <td>${escapeHtml(item.name)}</td>
      ${allMonths.map(month => `<td>${fmt(derivedValue(month, item.code))}</td>`).join('')}
      <td>${fmt(derivedSum([1,2,3], item.code))}</td>
      <td>${fmt(derivedSum([4,5,6], item.code))}</td>
      <td>${fmt(derivedSum([1,2,3,4,5,6], item.code))}</td>
      <td>${fmt(derivedSum(allMonths, item.code))}</td>
    </tr>`).join('') : '<tr><td colspan="17" class="empty">Chưa có danh mục chỉ tiêu.</td></tr>'}</tbody>
  </table>`;
}

function renderAll() {
  state.month = Number($('monthSelect').value);
  renderDashboard();
  renderLookup();
  renderReport();
}

function switchTab(id) {
  document.querySelectorAll('.tab').forEach(button => button.classList.toggle('active', button.dataset.tab === id));
  document.querySelectorAll('.panel').forEach(panel => panel.classList.toggle('active', panel.id === id));
}

function exportCSV() {
  const categories = displayCategories();
  const header = ['Chỉ tiêu', ...allMonths.map(m => `Tháng ${m}`), 'Quý I', 'Quý II', '6 tháng đầu năm', 'Cả năm'];
  const rows = categories.map(item => [
    item.name,
    ...allMonths.map(month => derivedValue(month, item.code)),
    derivedSum([1,2,3], item.code),
    derivedSum([4,5,6], item.code),
    derivedSum([1,2,3,4,5,6], item.code),
    derivedSum(allMonths, item.code)
  ]);
  const csv = '\ufeff' + [header, ...rows]
    .map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(','))
    .join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `tong-hop-so-lieu-phong-y-te-${state.year}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function init() {
  $('btnInput').href = APPS_SCRIPT_URL;
  buildSelectors();

  document.querySelectorAll('.tab').forEach(button => button.addEventListener('click', () => switchTab(button.dataset.tab)));
  $('btnSync').addEventListener('click', () => reloadData(true));
  $('btnExport').addEventListener('click', exportCSV);
  $('searchInput').addEventListener('input', renderLookup);
  $('monthSelect').addEventListener('change', () => {
    state.month = Number($('monthSelect').value);
    renderAll();
  });
  $('yearSelect').addEventListener('change', () => reloadData(false));

  reloadData(false);
}

document.addEventListener('DOMContentLoaded', init);
