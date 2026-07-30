const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbx0BHA-P1sAuGXEtrQatvEsMXMn3d7Pb024mCbu9tRTvaAr0xdy_cA0GPvJ_kFne6dOgw/exec';
const STORAGE_KEY = 'thyt-data-v1';
const HISTORY_KEY = 'thyt-history-v1';

const indicators = [
  { id:'noi_tru', name:'Nội trú' },
  { id:'ngoai_tru', name:'Ngoại trú' },
  { id:'vat_ly_tri_lieu', name:'Vật lý trị liệu' },
  { id:'chuyen_vien', name:'Chuyển viện' },
  { id:'kham_hon_quan', name:'Khám TTYT Hớn Quản' },
  { id:'xin_chuyen_tuyen_tam_than', name:'Xin giấy chuyển tuyến khám tâm thần' },
  { id:'tam_than_bhyt', name:'Khám tâm thần - Có BHYT' },
  { id:'tam_than_khong_bhyt', name:'Khám tâm thần - Không BHYT' },
  { id:'kham_tong_quat', name:'Khám tổng quát' },
  { id:'tam_soat_lao', name:'Tầm soát lao' },
  { id:'sinh_hoat_chuyen_mon', name:'Sinh hoạt chuyên môn' },
  { id:'cai_cach_hanh_chinh', name:'Cải cách hành chính' },
  { id:'tap_huan_dieu_duong', name:'Tập huấn điều dưỡng' },
  { id:'tap_huan_dinh_duong', name:'Tập huấn dinh dưỡng' },
  { id:'dieu_tri_lao', name:'Điều trị lao' },
  { id:'tap_huan_vsattp', name:'Tập huấn VSATTP' },
  { id:'quan_moi', name:'Quân mới' }
];

const seed2026 = {
  1:{noi_tru:853,ngoai_tru:1620,vat_ly_tri_lieu:81,chuyen_vien:19,kham_hon_quan:131,xin_chuyen_tuyen_tam_than:0,tam_than_bhyt:0,tam_than_khong_bhyt:0,kham_tong_quat:0,tam_soat_lao:18,sinh_hoat_chuyen_mon:0,cai_cach_hanh_chinh:0,tap_huan_dieu_duong:0,tap_huan_dinh_duong:0,dieu_tri_lao:0,tap_huan_vsattp:0,quan_moi:0},
  2:{noi_tru:685,ngoai_tru:1048,vat_ly_tri_lieu:50,chuyen_vien:14,kham_hon_quan:71,xin_chuyen_tuyen_tam_than:50,tam_than_bhyt:50,tam_than_khong_bhyt:0,kham_tong_quat:0,tam_soat_lao:42,sinh_hoat_chuyen_mon:0,cai_cach_hanh_chinh:1,tap_huan_dieu_duong:0,tap_huan_dinh_duong:0,dieu_tri_lao:0,tap_huan_vsattp:0,quan_moi:0},
  3:{noi_tru:736,ngoai_tru:963,vat_ly_tri_lieu:123,chuyen_vien:30,kham_hon_quan:0,xin_chuyen_tuyen_tam_than:44,tam_than_bhyt:49,tam_than_khong_bhyt:38,kham_tong_quat:584,tam_soat_lao:51,sinh_hoat_chuyen_mon:0,cai_cach_hanh_chinh:1,tap_huan_dieu_duong:3,tap_huan_dinh_duong:1,dieu_tri_lao:9,tap_huan_vsattp:0,quan_moi:0},
  4:{noi_tru:811,ngoai_tru:1237,vat_ly_tri_lieu:124,chuyen_vien:16,kham_hon_quan:0,xin_chuyen_tuyen_tam_than:0,tam_than_bhyt:90,tam_than_khong_bhyt:37,kham_tong_quat:0,tam_soat_lao:25,sinh_hoat_chuyen_mon:1,cai_cach_hanh_chinh:0,tap_huan_dieu_duong:0,tap_huan_dinh_duong:0,dieu_tri_lao:0,tap_huan_vsattp:0,quan_moi:0},
  5:{noi_tru:823,ngoai_tru:1376,vat_ly_tri_lieu:124,chuyen_vien:32,kham_hon_quan:61,xin_chuyen_tuyen_tam_than:9,tam_than_bhyt:56,tam_than_khong_bhyt:0,kham_tong_quat:0,tam_soat_lao:14,sinh_hoat_chuyen_mon:1,cai_cach_hanh_chinh:1,tap_huan_dieu_duong:3,tap_huan_dinh_duong:0,dieu_tri_lao:0,tap_huan_vsattp:1,quan_moi:0,note:'Khám tâm thần: tháng 5 cấp thuốc 55 ca.'},
  6:{noi_tru:895,ngoai_tru:1021,vat_ly_tri_lieu:58,chuyen_vien:35,kham_hon_quan:59,xin_chuyen_tuyen_tam_than:1,tam_than_bhyt:41,tam_than_khong_bhyt:29,kham_tong_quat:0,tam_soat_lao:15,sinh_hoat_chuyen_mon:0,cai_cach_hanh_chinh:0,tap_huan_dieu_duong:4,tap_huan_dinh_duong:1,dieu_tri_lao:1,tap_huan_vsattp:0,quan_moi:0}
};

let data = load(STORAGE_KEY, {});
let history = load(HISTORY_KEY, []);
const $ = id => document.getElementById(id);
const number = v => Number(v || 0);
const fmt = v => new Intl.NumberFormat('vi-VN').format(number(v));

function load(key, fallback){ try{return JSON.parse(localStorage.getItem(key)) ?? fallback}catch{return fallback} }
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(data));localStorage.setItem(HISTORY_KEY,JSON.stringify(history))}
function ensureYear(year){ if(!data[year]) data[year]={}; }
function getMonth(year,month){ return data?.[year]?.[month] || {}; }
function sumMonths(year, months, id){ return months.reduce((s,m)=>s+number(getMonth(year,m)[id]),0); }
function showToast(msg){const el=$('toast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2200)}

function seed(){
  data['2026']=JSON.parse(JSON.stringify(seed2026));
  history.unshift({at:new Date().toISOString(),text:'Khôi phục dữ liệu mẫu từ bảng Excel 2026'});
  save(); initSelectors(); renderAll(); showToast('Đã nạp dữ liệu mẫu 2026');
}

function initSelectors(){
  const ys=[...new Set([...Object.keys(data), String(new Date().getFullYear())])].sort().reverse();
  const current=$('yearSelect').value || ys[0];
  $('yearSelect').innerHTML=ys.map(y=>`<option ${y===current?'selected':''}>${y}</option>`).join('');
  $('monthSelect').innerHTML=Array.from({length:12},(_,i)=>`<option value="${i+1}">Tháng ${i+1}</option>`).join('');
  $('monthSelect').value=Math.min(new Date().getMonth()+1,12);
}

function current(){return {year:$('yearSelect').value,month:Number($('monthSelect').value)}}
function renderEntry(){
  const {year,month}=current(), row=getMonth(year,month);
  $('entryTitle').textContent=`Tháng ${month}/${year}`;
  $('entryFields').innerHTML=indicators.map(x=>`<label class="field-row">${x.name}<input type="number" min="0" step="1" name="${x.id}" value="${number(row[x.id])}"><small>Nhập số thực tế trong tháng</small></label>`).join('');
  $('generalNote').value=row.note || '';
}

function saveEntry(e){
  e.preventDefault(); const {year,month}=current(); ensureYear(year);
  const form=new FormData(e.currentTarget), row={}; indicators.forEach(x=>row[x.id]=number(form.get(x.id))); row.note=$('generalNote').value.trim();
  data[year][month]=row; history.unshift({at:new Date().toISOString(),text:`Cập nhật số liệu tháng ${month}/${year}`});
  save(); renderAll(); showToast('Đã lưu số liệu'); switchTab('dashboard');
}

function renderDashboard(){
  const {year,month}=current(), cur=getMonth(year,month), prev=getMonth(year,month===1?12:month-1);
  const featured=['noi_tru','ngoai_tru','chuyen_vien','kham_tong_quat'];
  $('kpiGrid').innerHTML=featured.map(id=>{const item=indicators.find(x=>x.id===id), d=number(cur[id])-number(prev[id]);return `<article class="kpi"><div class="label">${item.name}</div><div class="value">${fmt(cur[id])}</div><div class="delta ${d>=0?'up':'down'}">${d>=0?'▲':'▼'} ${fmt(Math.abs(d))} so với tháng trước</div></article>`}).join('');
  const rows=featured.map(id=>`<tr><td>${indicators.find(x=>x.id===id).name}</td>${Array.from({length:12},(_,i)=>`<td>${fmt(getMonth(year,i+1)[id])}</td>`).join('')}</tr>`).join('');
  $('trendTable').innerHTML=`<table><thead><tr><th>Chỉ tiêu</th>${Array.from({length:12},(_,i)=>`<th>T${i+1}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`;
}

function renderLookup(){
  const {year,month}=current(), q=$('searchInput').value.trim().toLowerCase(), row=getMonth(year,month);
  const list=indicators.filter(x=>x.name.toLowerCase().includes(q));
  $('lookupTable').innerHTML=`<table><thead><tr><th>Chỉ tiêu</th><th>Tháng ${month}</th><th>Quý</th><th>6 tháng đầu năm</th><th>Cả năm</th></tr></thead><tbody>${list.map(x=>{const qn=Math.ceil(month/3), qm=[(qn-1)*3+1,(qn-1)*3+2,(qn-1)*3+3];return `<tr><td>${x.name}</td><td>${fmt(row[x.id])}</td><td>${fmt(sumMonths(year,qm,x.id))}</td><td>${fmt(sumMonths(year,[1,2,3,4,5,6],x.id))}</td><td>${fmt(sumMonths(year,[1,2,3,4,5,6,7,8,9,10,11,12],x.id))}</td></tr>`}).join('')}</tbody></table>`;
}

function renderReport(){
  const {year}=current();
  $('reportTable').innerHTML=`<table><thead><tr><th>Chỉ tiêu</th>${Array.from({length:12},(_,i)=>`<th>T${i+1}</th>`).join('')}<th>Q1</th><th>Q2</th><th>6 tháng</th><th>Cả năm</th></tr></thead><tbody>${indicators.map(x=>`<tr><td>${x.name}</td>${Array.from({length:12},(_,i)=>`<td>${fmt(getMonth(year,i+1)[x.id])}</td>`).join('')}<td>${fmt(sumMonths(year,[1,2,3],x.id))}</td><td>${fmt(sumMonths(year,[4,5,6],x.id))}</td><td>${fmt(sumMonths(year,[1,2,3,4,5,6],x.id))}</td><td>${fmt(sumMonths(year,[1,2,3,4,5,6,7,8,9,10,11,12],x.id))}</td></tr>`).join('')}</tbody></table>`;
}

function renderHistory(){
  $('historyList').innerHTML=history.length?history.slice(0,100).map(h=>`<div class="history-item"><strong>${h.text}</strong><small>${new Date(h.at).toLocaleString('vi-VN')}</small></div>`).join(''):'<div class="empty">Chưa có lịch sử cập nhật.</div>';
}
function renderAll(){renderDashboard();renderEntry();renderLookup();renderReport();renderHistory()}
function switchTab(id){document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===id));document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active',p.id===id));}
function exportCSV(){
  const {year}=current(); const header=['Chỉ tiêu',...Array.from({length:12},(_,i)=>`Tháng ${i+1}`),'Quý I','Quý II','6 tháng đầu năm','Cả năm'];
  const rows=indicators.map(x=>[x.name,...Array.from({length:12},(_,i)=>number(getMonth(year,i+1)[x.id])),sumMonths(year,[1,2,3],x.id),sumMonths(year,[4,5,6],x.id),sumMonths(year,[1,2,3,4,5,6],x.id),sumMonths(year,[1,2,3,4,5,6,7,8,9,10,11,12],x.id)]);
  const csv='\ufeff'+[header,...rows].map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download=`tong-hop-so-lieu-${year}.csv`;a.click();URL.revokeObjectURL(a.href);
}

document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.tab)));
$('entryForm').addEventListener('submit',saveEntry);$('yearSelect').addEventListener('change',renderAll);$('monthSelect').addEventListener('change',renderAll);$('searchInput').addEventListener('input',renderLookup);$('btnNew').addEventListener('click',()=>{renderEntry();switchTab('entry')});$('btnExport').addEventListener('click',exportCSV);$('btnSeed').addEventListener('click',()=>{if(confirm('Khôi phục dữ liệu mẫu sẽ ghi đè dữ liệu năm 2026. Tiếp tục?'))seed()});
if(!data['2026']) seed(); else {initSelectors();renderAll();}
