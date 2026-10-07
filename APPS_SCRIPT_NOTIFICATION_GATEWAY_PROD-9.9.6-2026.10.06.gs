/**

 * ============================================================

 * ỨNG DỤNG PHÒNG Y TẾ

 * NOTIFICATION GATEWAY - PRODUCTION

 * Version: PROD-9.9.6-2026.10.06

 *

 * Mục tiêu:

 * - Xác thực Firebase ID Token.

 * - Kiểm tra quyền thật từ Firebase Realtime Database.

 * - Chỉ nhận event nghiệp vụ whitelist.

 * - Tự đọc dữ liệu nghiệp vụ từ Firebase, KHÔNG tin title/message từ client.

 * - Gửi Web Push qua 2 OneSignal App (Thạnh + Huyền).

 * - Target theo OneSignal tags đã được frontend đồng bộ.

 * - Dùng idempotency_key deterministic để chống gửi trùng khi retry.

 *

 * Đã nối event vào frontend production v9.9.0 sau Firebase write thành công.

 * Target chỉ dùng 2 Data Tags: tonghop_role + baocao_role.
 * v9.9.5: vai trò hiệu lực dùng chung 2 namespace; ngừng event Đối soát mới.
 * v9.9.6: bổ sung event Hồi gia tại bệnh viện.

 * ============================================================

 */



const GATEWAY_VERSION = 'PROD-9.9.6-2026.10.06';

const ONESIGNAL_PUSH_API = 'https://api.onesignal.com/notifications?c=push';

const EVENT_MAX_AGE_MS = 30 * 60 * 1000; // 30 phút



const REPORT_ROOT = 'baoCaoYTe';

const TONG_HOP_ROOT = 'tongHopYTe';




const BUSINESS_EVENTS = Object.freeze([

  'TRANSFER_CREATED',

  'TRANSFER_FORWARDED',

  'TRANSFER_RETURNED',

  'TRANSFER_HOME_RETURNED',

  'DEATH_HOSPITAL',

  'DEATH_OTHER',

  'TONGHOP_DATA_DELETED',

  'TRANSFER_DELETED',


  'ACCOUNT_PENDING',

  'ACCOUNT_ROLE_CHANGED',

  'ACCOUNT_LOCKED',

  'GATEWAY_TEST'

]);



/* ============================================================

 * 1. CẤU HÌNH

 * ============================================================ */



function getConfig_() {

  const props = PropertiesService.getScriptProperties();



  return {

    oneSignalAppIdThanh:

      String(props.getProperty('ONESIGNAL_APP_ID_THANH') || '').trim(),



    oneSignalApiKeyThanh:

      String(props.getProperty('ONESIGNAL_API_KEY_THANH') || '').trim(),



    oneSignalAppIdHuyen:

      String(props.getProperty('ONESIGNAL_APP_ID_HUYEN') || '').trim(),



    oneSignalApiKeyHuyen:

      String(props.getProperty('ONESIGNAL_API_KEY_HUYEN') || '').trim(),



    firebaseWebApiKey:

      String(props.getProperty('FIREBASE_WEB_API_KEY') || '').trim(),



    firebaseDatabaseUrl:

      String(props.getProperty('FIREBASE_DATABASE_URL') || '')

        .trim()

        .replace(/\/+$/, '')

  };

}





function kiemTraCauHinh() {

  const cfg = getConfig_();



  const result = {

    ONESIGNAL_APP_ID_THANH:

      cfg.oneSignalAppIdThanh ? 'OK - đã cấu hình' : 'THIẾU',



    ONESIGNAL_API_KEY_THANH:

      cfg.oneSignalApiKeyThanh ? 'OK - đã cấu hình' : 'THIẾU',



    ONESIGNAL_APP_ID_HUYEN:

      cfg.oneSignalAppIdHuyen ? 'OK - đã cấu hình' : 'THIẾU',



    ONESIGNAL_API_KEY_HUYEN:

      cfg.oneSignalApiKeyHuyen ? 'OK - đã cấu hình' : 'THIẾU',



    FIREBASE_WEB_API_KEY:

      cfg.firebaseWebApiKey ? 'OK - đã cấu hình' : 'THIẾU',



    FIREBASE_DATABASE_URL:

      cfg.firebaseDatabaseUrl ? 'OK - đã cấu hình' : 'THIẾU'

  };



  console.log(JSON.stringify(result, null, 2));

  return result;

}





/* ============================================================

 * 2. RESPONSE / REQUEST

 * ============================================================ */



function jsonOutput_(data) {

  return ContentService

    .createTextOutput(JSON.stringify(data))

    .setMimeType(ContentService.MimeType.JSON);

}





function doGet() {

  return jsonOutput_({

    success: true,

    service: 'PHONG_Y_TE_NOTIFICATION_GATEWAY',

    version: GATEWAY_VERSION,

    status: 'ONLINE',

    checkpoint: 3,

    events: BUSINESS_EVENTS

  });

}





function parseRequest_(e) {

  if (!e || !e.postData || !e.postData.contents) {

    throw new Error('REQUEST_BODY_EMPTY');

  }



  let body;



  try {

    body = JSON.parse(e.postData.contents);

  } catch (_) {

    throw new Error('INVALID_JSON');

  }



  if (!body || typeof body !== 'object' || Array.isArray(body)) {

    throw new Error('INVALID_REQUEST_BODY');

  }



  return body;

}





/* ============================================================

 * 3. FIREBASE AUTH

 * ============================================================ */



function verifyFirebaseIdToken_(idToken) {

  const cfg = getConfig_();



  if (!cfg.firebaseWebApiKey) {

    throw new Error('SERVER_FIREBASE_API_KEY_MISSING');

  }



  idToken = String(idToken || '').trim();



  if (!idToken) {

    throw new Error('FIREBASE_ID_TOKEN_REQUIRED');

  }



  const url =

    'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' +

    encodeURIComponent(cfg.firebaseWebApiKey);



  const response = UrlFetchApp.fetch(url, {

    method: 'post',

    contentType: 'application/json',

    payload: JSON.stringify({

      idToken: idToken

    }),

    muteHttpExceptions: true

  });



  const status = response.getResponseCode();

  const text = response.getContentText();



  if (status !== 200) {

    let firebaseMessage = 'FIREBASE_AUTH_REJECTED';



    try {

      const parsed = JSON.parse(text || '{}');

      const rawMessage =

        parsed &&

        parsed.error &&

        parsed.error.message

          ? String(parsed.error.message)

          : '';



      if (/^[A-Z0-9_ -]{1,120}$/.test(rawMessage)) {

        firebaseMessage = rawMessage.replace(/\s+/g, '_');

      }

    } catch (_) {}



    console.warn(

      'Firebase accounts:lookup rejected. HTTP ' +

      status +

      ' code=' +

      firebaseMessage

    );



    throw new Error(firebaseMessage);

  }



  let data;



  try {

    data = JSON.parse(text || '{}');

  } catch (_) {

    throw new Error('INVALID_FIREBASE_AUTH_RESPONSE');

  }



  if (

    !data ||

    !Array.isArray(data.users) ||

    data.users.length !== 1

  ) {

    throw new Error('FIREBASE_USER_NOT_FOUND');

  }



  const user = data.users[0] || {};



  const uid = String(user.localId || '').trim();

  const email = normalizeEmail_(user.email);

  const displayName = String(user.displayName || '').trim();



  if (!uid) {

    throw new Error('FIREBASE_UID_MISSING');

  }



  if (!email) {

    throw new Error('FIREBASE_EMAIL_MISSING');

  }



  if (user.disabled === true) {

    throw new Error('FIREBASE_USER_DISABLED');

  }



  return {

    uid: uid,

    email: email,

    displayName: displayName,

    emailVerified: user.emailVerified === true

  };

}





/* ============================================================

 * 4. FIREBASE REALTIME DATABASE REST

 * ============================================================ */



function firebaseRestGetAsUser_(path, idToken) {

  const cfg = getConfig_();



  if (!cfg.firebaseDatabaseUrl) {

    throw new Error('SERVER_FIREBASE_DATABASE_URL_MISSING');

  }



  path = String(path || '')

    .replace(/^\/+/, '')

    .replace(/\/+$/, '');



  if (!path) {

    throw new Error('FIREBASE_PATH_REQUIRED');

  }



  const url =

    cfg.firebaseDatabaseUrl +

    '/' +

    path +

    '.json?auth=' +

    encodeURIComponent(idToken);



  const response = UrlFetchApp.fetch(url, {

    method: 'get',

    muteHttpExceptions: true

  });



  const status = response.getResponseCode();

  const text = response.getContentText();



  if (status !== 200) {

    console.warn(

      'RTDB GET failed: ' +

      path +

      ' HTTP ' +

      status

    );



    if (status === 401 || status === 403) {

      throw new Error('FIREBASE_PERMISSION_DENIED');

    }



    throw new Error('FIREBASE_DATABASE_READ_FAILED');

  }



  if (!text || text === 'null') {

    return null;

  }



  try {

    return JSON.parse(text);

  } catch (_) {

    throw new Error('INVALID_FIREBASE_DATABASE_RESPONSE');

  }

}





function readUserPermissions_(identity, idToken) {

  const uid = identity.uid;



  const tongHop = firebaseRestGetAsUser_(

    TONG_HOP_ROOT + '/phanQuyen/' + uid,

    idToken

  );



  const baoCao = firebaseRestGetAsUser_(

    REPORT_ROOT + '/phanQuyen/' + uid,

    idToken

  );



  const tongHopPermission =

    normalizePermission_('tongHopYTe', tongHop, identity);



  const baoCaoPermission =

    normalizePermission_('baoCaoYTe', baoCao, identity);



  return {

    tongHopYTe: tongHopPermission,

    baoCaoYTe: baoCaoPermission,

    hasAnyAccess:

      tongHopPermission.active === true ||

      baoCaoPermission.active === true

  };

}





function normalizePermission_(moduleName, raw, identity) {

  if (!raw || typeof raw !== 'object') {

    return {

      module: moduleName,

      exists: false,

      active: false,

      role: null

    };

  }



  const role = normalizeRole_(raw.role);



  if (!role) {

    return {

      module: moduleName,

      exists: true,

      active: false,

      role: null

    };

  }



  const permissionEmail =

    normalizeEmail_(raw.email);



  if (

    permissionEmail &&

    permissionEmail !== identity.email

  ) {

    throw new Error(

      'PERMISSION_EMAIL_MISMATCH_' + moduleName

    );

  }



  return {

    module: moduleName,

    exists: true,

    active: raw.active === true,

    role: role

  };

}





/* ============================================================

 * 5. QUYỀN NGHIỆP VỤ

 * ============================================================ */



function hasGlobalAdmin_(permissions) {

  const tongHopAdmin =

    permissions && permissions.tongHopYTe &&

    permissions.tongHopYTe.active === true &&

    permissions.tongHopYTe.role === 'admin';

  const reportAdmin =

    permissions && permissions.baoCaoYTe &&

    permissions.baoCaoYTe.active === true &&

    permissions.baoCaoYTe.role === 'admin';

  return !!(tongHopAdmin || reportAdmin);

}





function effectiveRole_(permissions) {

  if (hasGlobalAdmin_(permissions)) return 'admin';

  const roles = [];

  if (permissions && permissions.tongHopYTe && permissions.tongHopYTe.active === true) {

    roles.push(permissions.tongHopYTe.role);

  }

  if (permissions && permissions.baoCaoYTe && permissions.baoCaoYTe.active === true) {

    roles.push(permissions.baoCaoYTe.role);

  }

  if (roles.indexOf('nhaplieu') >= 0) return 'nhaplieu';

  if (roles.indexOf('viewer') >= 0) return 'viewer';

  return null;

}



function assertReportEditor_(permissions) {

  const role = effectiveRole_(permissions);

  if (role !== 'admin' && role !== 'nhaplieu') {

    throw new Error('REPORT_EDITOR_REQUIRED');

  }

}



function assertTongHopEditor_(permissions) {

  const role = effectiveRole_(permissions);

  if (role !== 'admin' && role !== 'nhaplieu') {

    throw new Error('TONGHOP_EDITOR_REQUIRED');

  }

}

function assertTongHopAdmin_(permissions) {

  if (!hasGlobalAdmin_(permissions)) throw new Error('TONGHOP_ADMIN_REQUIRED');

}





function assertReportAdmin_(permissions) {

  if (!hasGlobalAdmin_(permissions)) throw new Error('REPORT_ADMIN_REQUIRED');

}





function assertAnyAdmin_(permissions) {

  if (!hasGlobalAdmin_(permissions)) throw new Error('ADMIN_REQUIRED');

}





/* ============================================================

 * 6. EVENT VALIDATION

 * ============================================================ */



function buildBusinessEvent_(eventType, body, identity, idToken) {

  eventType = String(eventType || '').trim().toUpperCase();

  if (BUSINESS_EVENTS.indexOf(eventType) < 0) throw new Error('EVENT_NOT_ALLOWED');



  if (eventType === 'ACCOUNT_PENDING') {

    return buildAccountPendingEvent_(body, identity, idToken);

  }



  const permissions = readUserPermissions_(identity, idToken);



  switch (eventType) {

    case 'TRANSFER_CREATED':

      assertReportEditor_(permissions);

      return buildJourneyEvent_(eventType, body, identity, idToken, 'MO_HANH_TRINH', 'DANG_THEO_DOI');



    case 'TRANSFER_FORWARDED':

      assertReportEditor_(permissions);

      return buildJourneyEvent_(eventType, body, identity, idToken, 'CHUYEN_TIEP', 'CHUYEN_TIEP_BENH_VIEN_KHAC');



    case 'TRANSFER_RETURNED':

      assertReportEditor_(permissions);

      return buildJourneyEvent_(eventType, body, identity, idToken, 'DA_VE_TRUNG_TAM', 'DA_VE_TRUNG_TAM');



    case 'TRANSFER_HOME_RETURNED':

      assertReportEditor_(permissions);

      return buildJourneyEvent_(eventType, body, identity, idToken, 'HOI_GIA_TAI_BENH_VIEN', 'HOI_GIA_TAI_BENH_VIEN');



    case 'DEATH_HOSPITAL':

      assertReportEditor_(permissions);

      return buildJourneyEvent_(eventType, body, identity, idToken, 'TU_VONG_TAI_BENH_VIEN', 'TU_VONG_TAI_BENH_VIEN');



    case 'DEATH_OTHER':

      assertReportEditor_(permissions);

      return buildJourneyEvent_(eventType, body, identity, idToken, 'TU_VONG_TAI_NOI_KHAC', 'TU_VONG_TAI_NOI_KHAC');



    case 'TONGHOP_DATA_DELETED':

      assertTongHopAdmin_(permissions);

      return buildTongHopDataDeletedEvent_(body, identity, idToken);



    case 'TRANSFER_DELETED':

      assertReportAdmin_(permissions);

      return buildTransferDeletedEvent_(body, identity, idToken);






    case 'ACCOUNT_ROLE_CHANGED':

      assertTongHopAdmin_(permissions);

      return buildAccountAdminEvent_(eventType, body, identity, idToken);



    case 'ACCOUNT_LOCKED':

      assertTongHopAdmin_(permissions);

      return buildAccountAdminEvent_(eventType, body, identity, idToken);



    case 'GATEWAY_TEST':

      assertAnyAdmin_(permissions);

      return buildGatewayTestEvent_(body, identity);



    default:

      throw new Error('EVENT_NOT_IMPLEMENTED');

  }

}





function buildJourneyEvent_(eventType, body, identity, idToken, expectedHistoryType, expectedStatus) {

  const caseId = safeFirebaseKey_(body && body.resourceId);

  const raw = firebaseRestGetAsUser_(REPORT_ROOT + '/hanhTrinhChuyenVien/' + caseId, idToken);

  if (!raw || typeof raw !== 'object') throw new Error('JOURNEY_NOT_FOUND');



  const info = raw.thongTin && typeof raw.thongTin === 'object' ? raw.thongTin : {};

  const version = Number(info.version || 0);

  if (!version) throw new Error('JOURNEY_VERSION_MISSING');

  if (String(info.trangThaiHienTai || '') !== expectedStatus) throw new Error('JOURNEY_STATUS_MISMATCH');



  const historyEvent = latestHistoryEvent_(raw.lichSu, expectedHistoryType);

  if (!historyEvent) throw new Error('JOURNEY_EVENT_NOT_FOUND');



  const actorUid = eventType === 'TRANSFER_CREATED' ? String(info.createdByUid || '') : String(info.updatedByUid || '');

  if (actorUid !== identity.uid) throw new Error('EVENT_ACTOR_MISMATCH');

  if (String(historyEvent.uid || '') !== identity.uid) throw new Error('EVENT_HISTORY_ACTOR_MISMATCH');



  const eventAt = Number(historyEvent.createdAt || info.updatedAt || info.createdAt || 0);

  assertRecent_(eventAt);

  if (eventType === 'TRANSFER_CREATED' && version !== 1) throw new Error('TRANSFER_CREATE_VERSION_MISMATCH');



  const patient = compactText_(info.doiTuong || 'Đối tượng', 120);

  const from = compactText_(historyEvent.noiTruoc || info.noiDiBanDau || 'Trung tâm Bảo trợ xã hội Tân Hiệp', 160);

  const to = compactText_(historyEvent.noiSau || info.noiHienTai || '', 160);

  const transferDate = businessDate_(info.ngayChuyenVien, info.ngayGioDi || info.createdAt || eventAt);

  const deathDate = businessDate_(info.ngayTuVong || historyEvent.ngayTuVong || historyEvent.ngaySuKien, eventAt);

  const deathPlace = compactText_(info.noiTuVong || historyEvent.noiTuVong || to || info.noiHienTai || '', 180);

  const transferType = transferTypeLabel_(info.hinhThucChuyen, info.hinhThucChuyenKhac);



  let title = '';

  let message = '';

  let date = '';



  if (eventType === 'TRANSFER_CREATED') {

    title = '🚑 Chuyển viện mới — ' + patient;

    date = transferDate;

    message = [formatDateVi_(date), transferType, from + (to ? ' → ' + to : '')].filter(Boolean).join(' · ') + '.';

  } else if (eventType === 'TRANSFER_FORWARDED') {

    title = '🏥 Chuyển tiếp — ' + patient;

    date = businessDate_(historyEvent.ngaySuKien, eventAt);

    message = (from || 'Cơ sở trước') + ' → ' + (to || 'cơ sở y tế khác') + (formatDateVi_(date) ? ' · ' + formatDateVi_(date) : '') + '.';

  } else if (eventType === 'TRANSFER_RETURNED') {

    title = '🏠 Đã về Trung tâm — ' + patient;

    date = businessDate_(historyEvent.ngaySuKien, eventAt);

    message = 'Hành trình chuyển viện đã kết thúc' + (formatDateVi_(date) ? ' ngày ' + formatDateVi_(date) : '') + '.';

  } else if (eventType === 'TRANSFER_HOME_RETURNED') {

    title = '🏠 Hồi gia tại bệnh viện — ' + patient;

    date = businessDate_(historyEvent.ngaySuKien, eventAt);

    message = 'Hành trình chuyển viện đã kết thúc' + (formatDateVi_(date) ? ' ngày ' + formatDateVi_(date) : '') + '.';

  } else if (eventType === 'DEATH_HOSPITAL') {

    title = '⚫ Tử vong tại bệnh viện — ' + patient;

    date = deathDate;

    message = 'Ghi nhận tại ' + (deathPlace || to || 'bệnh viện') + (formatDateVi_(date) ? ' ngày ' + formatDateVi_(date) : '') + '.';

  } else if (eventType === 'DEATH_OTHER') {

    title = '⚫ Tử vong tại nơi khác — ' + patient;

    date = deathDate;

    message = 'Địa điểm: ' + (deathPlace || 'chưa ghi rõ') + (formatDateVi_(date) ? ' · ' + formatDateVi_(date) : '') + '.';

  } else {

    throw new Error('JOURNEY_EVENT_TEMPLATE_MISSING');

  }



  return {

    eventType: eventType,

    eventKey: eventType + ':' + caseId + ':v' + version,

    title: compactText_(title, 180),

    message: compactText_(message, 360),

    recipientGroup: 'REPORT_ALL',

    view: 'reports',

    resourceId: caseId,

    data: {

      caseId: caseId,

      journeyVersion: version,

      date: date,

      status: expectedStatus

    }

  };

}





function buildTongHopDataDeletedEvent_(body, identity, idToken) {

  const auditId = safeFirebaseKey_(body && body.resourceId);

  const date = safeDateKey_(body && body.date);

  const code = safeFirebaseKey_(body && body.code);

  const month = date.slice(0, 7);



  const audit = firebaseRestGetAsUser_(

    TONG_HOP_ROOT + '/lichSu/' + month + '/' + auditId,

    idToken

  );



  if (!audit || typeof audit !== 'object') {

    throw new Error('DELETE_AUDIT_NOT_FOUND');

  }

  if (String(audit.action || '') !== 'Xóa số liệu') {

    throw new Error('DELETE_AUDIT_ACTION_MISMATCH');

  }

  if (String(audit.uid || '') !== identity.uid) {

    throw new Error('EVENT_ACTOR_MISMATCH');

  }

  if (String(audit.date || '') !== date || String(audit.code || '') !== code) {

    throw new Error('DELETE_AUDIT_RESOURCE_MISMATCH');

  }



  const eventAt = Number(audit.createdAt || 0);

  assertRecent_(eventAt);



  const actor = String(audit.displayName || identity.email || 'Quản trị viên').trim();

  const name = String(audit.name || code).trim();



  return {

    eventType: 'TONGHOP_DATA_DELETED',

    eventKey: 'TONGHOP_DATA_DELETED:' + auditId,

    title: '🗑️ Số liệu đã xóa',

    message: actor + ' đã xóa số liệu ' + name + ' ngày ' + date + '.',

    recipientGroup: 'TONGHOP_ADMIN',

    view: 'entry',

    resourceId: auditId,

    data: { auditId: auditId, date: date, code: code }

  };

}





function buildTransferDeletedEvent_(body, identity, idToken) {

  const caseId = safeFirebaseKey_(body && body.resourceId);

  const archive = firebaseRestGetAsUser_(

    REPORT_ROOT + '/hanhTrinhDaXoa/' + caseId,

    idToken

  );



  if (!archive || typeof archive !== 'object') {

    throw new Error('DELETED_JOURNEY_NOT_FOUND');

  }

  if (String(archive.deletedByUid || '') !== identity.uid) {

    throw new Error('EVENT_ACTOR_MISMATCH');

  }



  const deletedAt = Number(archive.deletedAt || 0);

  assertRecent_(deletedAt);

  const raw = archive.data && typeof archive.data === 'object' ? archive.data : {};

  const info = raw.thongTin && typeof raw.thongTin === 'object' ? raw.thongTin : {};

  const actor = String(archive.deletedByName || identity.email || 'Quản trị viên').trim();

  const patient = String(info.doiTuong || 'một đối tượng').trim();



  return {

    eventType: 'TRANSFER_DELETED',

    eventKey: 'TRANSFER_DELETED:' + caseId + ':' + String(deletedAt),

    title: '🗑️ Đã xóa hành trình chuyển viện',

    message: actor + ' đã xóa hành trình chuyển viện của ' + patient + '.',

    recipientGroup: 'REPORT_ADMIN',

    view: 'reports',

    resourceId: caseId,

    data: { caseId: caseId, deletedAt: deletedAt }

  };

}





function buildAccountPendingEvent_(

  body,

  identity,

  idToken

) {

  const resourceId =

    body && body.resourceId

      ? safeFirebaseKey_(body.resourceId)

      : identity.uid;



  if (resourceId !== identity.uid) {

    throw new Error('ACCOUNT_PENDING_SELF_ONLY');

  }



  // Tài khoản đã có quyền Tổng hợp hoạt động thì không còn là "chờ duyệt".

  const ownPermissionRaw =

    firebaseRestGetAsUser_(

      TONG_HOP_ROOT +

        '/phanQuyen/' +

        identity.uid,

      idToken

    );



  const ownPermission =

    normalizePermission_(

      'tongHopYTe',

      ownPermissionRaw,

      identity

    );



  if (ownPermission.active === true) {

    throw new Error('ACCOUNT_ALREADY_ACTIVE');

  }



  return {

    eventType: 'ACCOUNT_PENDING',

    eventKey:

      'ACCOUNT_PENDING:' +

      identity.uid,

    title: '👤 Tài khoản chờ duyệt',

    message:

      'Có tài khoản mới đang chờ Quản trị viên cấp quyền sử dụng.',

    recipientGroup: 'TONGHOP_ADMIN',

    view: 'admin',

    resourceId: identity.uid,

    data: {

      pendingUid: identity.uid

    }

  };

}





function buildAccountAdminEvent_(

  eventType,

  body,

  identity,

  idToken

) {

  const targetUid =

    safeFirebaseKey_(

      body && body.resourceId

    );



  const permission =

    firebaseRestGetAsUser_(

      TONG_HOP_ROOT +

        '/phanQuyen/' +

        targetUid,

      idToken

    );



  if (

    !permission ||

    typeof permission !== 'object'

  ) {

    throw new Error('TARGET_PERMISSION_NOT_FOUND');

  }



  const updatedAt =

    Number(permission.updatedAt || 0);



  if (updatedAt) {

    assertRecent_(updatedAt);

  }



  const role =

    normalizeRole_(permission.role);



  if (!role) {

    throw new Error('TARGET_ROLE_INVALID');

  }



  if (

    eventType === 'ACCOUNT_LOCKED' &&

    permission.active !== false

  ) {

    throw new Error('TARGET_ACCOUNT_NOT_LOCKED');

  }



  const isLocked =

    permission.active === false;



  const title =

    eventType === 'ACCOUNT_LOCKED'

      ? '🔒 Tài khoản đã khóa'

      : '🔐 Quyền tài khoản cập nhật';



  const message =

    eventType === 'ACCOUNT_LOCKED'

      ? 'Một tài khoản vừa được khóa quyền sử dụng.'

      : 'Quyền sử dụng của một tài khoản vừa được cập nhật.';



  return {

    eventType: eventType,

    eventKey:

      eventType +

      ':' +

      targetUid +

      ':' +

      role +

      ':' +

      (isLocked ? 'locked' : 'active') +

      ':' +

      String(updatedAt || '0'),

    title: title,

    message: message,

    recipientGroup: 'TONGHOP_ADMIN',

    view: 'admin',

    resourceId: targetUid,

    data: {

      targetUid: targetUid,

      role: role,

      active: permission.active === true

    }

  };

}






function buildGatewayTestEvent_(

  body,

  identity

) {

  const nonce =

    safeNonce_(

      body && body.nonce

        ? body.nonce

        : Utilities.getUuid()

    );



  return {

    eventType: 'GATEWAY_TEST',

    eventKey:

      'GATEWAY_TEST:' +

      identity.uid +

      ':' +

      nonce,

    title: '🧪 Kiểm tra Gateway',

    message:

      'Notification Gateway ' + GATEWAY_VERSION + ' đã xác thực quyền và gửi Push thành công.',

    recipientGroup: 'ADMIN_ANY',

    view: 'admin',

    resourceId: identity.uid,

    data: {

      testUid: identity.uid,

      nonce: nonce

    }

  };

}





/* ============================================================

 * 7. ONESIGNAL TARGETING

 * ============================================================ */



function filtersForGroup_(group) {

  switch (group) {

    case 'REPORT_ALL':

      return [

        { field: 'tag', key: 'baocao_role', relation: '=', value: 'admin' },

        { operator: 'OR' },

        { field: 'tag', key: 'baocao_role', relation: '=', value: 'nhaplieu' },

        { operator: 'OR' },

        { field: 'tag', key: 'baocao_role', relation: '=', value: 'viewer' }

      ];



    case 'REPORT_EDITOR':

      return [

        { field: 'tag', key: 'baocao_role', relation: '=', value: 'admin' },

        { operator: 'OR' },

        { field: 'tag', key: 'baocao_role', relation: '=', value: 'nhaplieu' }

      ];



    case 'TONGHOP_ADMIN':

      return [{ field: 'tag', key: 'tonghop_role', relation: '=', value: 'admin' }];



    case 'REPORT_ADMIN':

      return [{ field: 'tag', key: 'baocao_role', relation: '=', value: 'admin' }];



    case 'ADMIN_ANY':

      return [

        { field: 'tag', key: 'tonghop_role', relation: '=', value: 'admin' },

        { operator: 'OR' },

        { field: 'tag', key: 'baocao_role', relation: '=', value: 'admin' }

      ];



    default:

      throw new Error('RECIPIENT_GROUP_INVALID');

  }

}





/* ============================================================

 * 8. ONESIGNAL SEND

 * ============================================================ */



function sendBusinessEvent_(event) {

  const cfg = getConfig_();

  const apps = [

    {

      code: 'THANH',

      appId: cfg.oneSignalAppIdThanh,

      apiKey: cfg.oneSignalApiKeyThanh,

      webBaseUrl: 'https://thanhbds2011-droid.github.io/tong-hop-so-lieu-y-te/'

    },

    {

      code: 'HUYEN',

      appId: cfg.oneSignalAppIdHuyen,

      apiKey: cfg.oneSignalApiKeyHuyen,

      webBaseUrl: 'https://khanhhuyen131093-pyt.github.io/tong-hop-so-lieu-y-te/'

    }

  ];



  const results = [];

  apps.forEach(function (appCfg) {

    if (!appCfg.appId || !appCfg.apiKey) {

      results.push({ app: appCfg.code, success: false, sent: false, error: 'ONESIGNAL_APP_CONFIG_MISSING' });

      return;

    }

    const idempotencyKey = uuidV5_(GATEWAY_VERSION + '|' + event.eventKey + '|' + appCfg.code);

    try {

      results.push(sendOneSignal_(appCfg, event, idempotencyKey));

    } catch (error) {

      results.push({

        app: appCfg.code,

        success: false,

        sent: false,

        error: error && error.message ? String(error.message) : 'ONESIGNAL_SEND_FAILED'

      });

    }

  });



  const accepted = results.filter(function (item) { return item.success === true; }).length;

  const sent = results.filter(function (item) { return item.sent === true; }).length;

  if (!accepted) throw new Error('ONESIGNAL_ALL_APPS_FAILED');

  return { acceptedApps: accepted, sentApps: sent, results: results };

}





function sendOneSignal_(appCfg, event, idempotencyKey) {

  const routeData = Object.assign(

    {

      source: 'PHONG_Y_TE_GATEWAY',

      gatewayVersion: GATEWAY_VERSION,

      eventType: event.eventType,

      view: event.view,

      resourceId: event.resourceId

    },

    event.data || {}

  );



  const payload = {

    app_id: appCfg.appId,

    target_channel: 'push',

    headings: { en: event.title },

    contents: { en: event.message },

    name: String(event.eventType + ' - ' + event.resourceId).slice(0, 128),

    data: routeData,

    web_url: buildWebUrl_(appCfg.webBaseUrl, routeData),

    idempotency_key: idempotencyKey

  };



  const targets = Array.isArray(event.targetExternalIds)

    ? event.targetExternalIds.map(function (v) { return String(v || '').trim(); }).filter(Boolean)

    : [];



  if (targets.length) {

    payload.include_aliases = { external_id: targets };

  } else {

    payload.filters = filtersForGroup_(event.recipientGroup);

  }



  const response = UrlFetchApp.fetch(ONESIGNAL_PUSH_API, {

    method: 'post',

    contentType: 'application/json',

    headers: { Authorization: 'Key ' + appCfg.apiKey },

    payload: JSON.stringify(payload),

    muteHttpExceptions: true

  });



  const status = response.getResponseCode();

  const text = response.getContentText();

  if (status < 200 || status >= 300) {

    console.warn('OneSignal ' + appCfg.code + ' HTTP ' + status + ' body=' + String(text || '').slice(0, 500));

    throw new Error('ONESIGNAL_HTTP_' + status);

  }



  let data = {};

  try { data = JSON.parse(text || '{}'); }

  catch (_) { throw new Error('ONESIGNAL_INVALID_RESPONSE'); }



  const messageId = String(data.id || '');

  return {

    app: appCfg.code,

    success: true,

    sent: !!messageId,

    messageId: messageId,

    idempotencyKey: idempotencyKey,

    noMatch: !messageId

  };

}





/* ============================================================

 * 9. ENDPOINT

 * ============================================================ */



function doPost(e) {

  const requestId =

    Utilities.getUuid();



  try {

    const body =

      parseRequest_(e);



    const action =

      String(body.action || '')

        .trim()

        .toUpperCase();



    const idToken =

      String(body.idToken || '')

        .trim();



    const identity =

      verifyFirebaseIdToken_(

        idToken

      );



    if (action === 'AUTH_CHECK') {

      const permissions =

        readUserPermissions_(

          identity,

          idToken

        );



      console.log(

        'AUTH_CHECK PASS | requestId=' +

        requestId +

        ' | uid=' +

        identity.uid +

        ' | email=' +

        identity.email

      );



      return jsonOutput_({

        success: true,

        checkpoint: 3,

        requestId: requestId,



        user: {

          uid: identity.uid,

          email: identity.email,

          displayName:

            identity.displayName,

          emailVerified:

            identity.emailVerified

        },



        permissions:

          permissions

      });

    }



    if (action === 'BUSINESS_EVENT') {

      const event =

        buildBusinessEvent_(

          body.eventType,

          body,

          identity,

          idToken

        );



      const delivery =

        sendBusinessEvent_(

          event

        );



      console.log(

        'BUSINESS_EVENT PASS' +

        ' | requestId=' +

        requestId +

        ' | event=' +

        event.eventType +

        ' | uid=' +

        identity.uid +

        ' | resource=' +

        event.resourceId +

        ' | acceptedApps=' +

        delivery.acceptedApps +

        ' | sentApps=' +

        delivery.sentApps

      );



      return jsonOutput_({

        success: true,

        checkpoint: 3,

        requestId: requestId,

        eventType: event.eventType,

        resourceId: event.resourceId,

        recipientGroup:

          event.recipientGroup,

        delivery: delivery

      });

    }



    throw new Error(

      'ACTION_NOT_ALLOWED'

    );



  } catch (error) {

    const code =

      sanitizeErrorCode_(error);



    console.warn(

      'GATEWAY REJECTED' +

      ' | requestId=' +

      requestId +

      ' | code=' +

      code

    );



    return jsonOutput_({

      success: false,

      checkpoint: 3,

      requestId: requestId,

      error: code

    });

  }

}





/* ============================================================

 * 10. HELPERS

 * ============================================================ */



function markerCount_(raw, deathMode) {

  const data = raw && typeof raw === 'object' ? raw : {};

  return Object.keys(data).filter(function (key) {

    const active = data[key] === true || data[key] === 1 || data[key] === '1';

    if (!active) return false;

    if (deathMode && /^CENTER_/i.test(String(key))) return false;

    return true;

  }).length;

}





function compactText_(value, maxLength) {

  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim().slice(0, Number(maxLength || 300));

}



function formatDateVi_(value) {

  const text = String(value || '').trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return '';

  const parts = text.split('-');

  return parts[2] + '/' + parts[1] + '/' + parts[0];

}



function businessDate_(value, fallbackTimestamp) {

  const text = String(value || '').trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const timestamp = Number(fallbackTimestamp || 0);

  if (!timestamp) return '';

  return Utilities.formatDate(new Date(timestamp), 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd');

}



function transferTypeLabel_(type, otherText) {

  const value = String(type || '').trim();

  if (value === 'CAP_CUU') return 'Cấp cứu';

  if (value === 'TAI_KHAM') return 'Tái khám';

  if (value === 'CHUYEN_VIEN') return 'Chuyển viện';

  if (value === 'KHAC') return compactText_(otherText || 'Khác', 80);

  return 'Chuyển viện';

}



function buildWebUrl_(baseUrl, routeData) {

  const base = String(baseUrl || '').trim();

  if (!base) return '';

  const allowed = ['view', 'resourceId', 'caseId', 'eventType', 'requestId', 'date', 'metricType', 'status'];

  const params = [];

  allowed.forEach(function (key) {

    const value = routeData && routeData[key] != null ? String(routeData[key]).trim() : '';

    if (value) params.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));

  });

  return base + (params.length ? '?' + params.join('&') : '');

}





function normalizeEmail_(value) {

  return String(value || '')

    .trim()

    .toLowerCase();

}





function normalizeRole_(value) {

  value =

    String(value || '')

      .trim()

      .toLowerCase();



  if (

    value === 'admin' ||

    value === 'quản trị' ||

    value === 'quan tri'

  ) {

    return 'admin';

  }



  if (

    value === 'nhaplieu' ||

    value === 'nhập liệu' ||

    value === 'nhap lieu'

  ) {

    return 'nhaplieu';

  }



  if (

    value === 'viewer' ||

    value === 'xem' ||

    value === 'chỉ xem' ||

    value === 'chi xem'

  ) {

    return 'viewer';

  }



  return '';

}





function safeFirebaseKey_(value) {

  const text =

    String(value || '').trim();



  if (

    !text ||

    text.length > 180 ||

    /[.#$\[\]\/]/.test(text)

  ) {

    throw new Error(

      'RESOURCE_ID_INVALID'

    );

  }



  return text;

}





function safeDateKey_(value) {

  const text = String(value || '').trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {

    throw new Error('DATE_KEY_INVALID');

  }

  return text;

}





function safeNonce_(value) {

  const text =

    String(value || '').trim();



  if (

    !text ||

    text.length > 80 ||

    !/^[A-Za-z0-9_-]+$/.test(text)

  ) {

    throw new Error(

      'NONCE_INVALID'

    );

  }



  return text;

}





function assertRecent_(timestamp) {

  const n =

    Number(timestamp || 0);



  if (!n) {

    throw new Error(

      'EVENT_TIMESTAMP_MISSING'

    );

  }



  const age =

    Math.abs(

      Date.now() - n

    );



  if (age > EVENT_MAX_AGE_MS) {

    throw new Error(

      'EVENT_TOO_OLD'

    );

  }

}





function latestHistoryEvent_(

  rawHistory,

  type

) {

  const history =

    rawHistory &&

    typeof rawHistory === 'object'

      ? rawHistory

      : {};



  const rows =

    Object.keys(history)

      .map(function (key) {

        return history[key] || {};

      })

      .filter(function (item) {

        return (

          String(

            item.loaiSuKien || ''

          ) === type

        );

      })

      .sort(function (a, b) {

        return (

          Number(b.createdAt || 0) -

          Number(a.createdAt || 0)

        );

      });



  return rows.length

    ? rows[0]

    : null;

}





function sanitizeErrorCode_(error) {

  const raw =

    error && error.message

      ? String(error.message)

      : 'UNKNOWN_ERROR';



  const cleaned =

    raw

      .replace(/[^A-Za-z0-9_:-]/g, '_')

      .slice(0, 160);



  return cleaned || 'UNKNOWN_ERROR';

}





/**

 * UUID v5 deterministic.

 * Dùng DNS namespace chuẩn để tạo RFC UUID từ event seed.

 */

function uuidV5_(name) {

  const namespace =

    '6ba7b810-9dad-11d1-80b4-00c04fd430c8';



  const nsBytes =

    uuidToBytes_(namespace);



  const nameBytes =

    Utilities.newBlob(

      String(name || '')

    ).getBytes();



  const input =

    nsBytes

      .concat(nameBytes)

      .map(function (b) {

        const n = b & 0xff;

        return n > 127 ? n - 256 : n;

      });



  const digest =

    Utilities.computeDigest(

      Utilities.DigestAlgorithm.SHA_1,

      input

    );



  const bytes =

    digest

      .slice(0, 16)

      .map(function (b) {

        return b & 0xff;

      });



  // Version 5

  bytes[6] =

    (bytes[6] & 0x0f) | 0x50;



  // RFC variant

  bytes[8] =

    (bytes[8] & 0x3f) | 0x80;



  return bytesToUuid_(bytes);

}





function uuidToBytes_(uuid) {

  const hex =

    String(uuid || '')

      .replace(/-/g, '');



  if (!/^[0-9a-fA-F]{32}$/.test(hex)) {

    throw new Error(

      'UUID_NAMESPACE_INVALID'

    );

  }



  const out = [];



  for (

    let i = 0;

    i < 32;

    i += 2

  ) {

    out.push(

      parseInt(

        hex.slice(i, i + 2),

        16

      )

    );

  }



  return out;

}





function bytesToUuid_(bytes) {

  const hex =

    bytes

      .map(function (b) {

        return (

          '0' +

          (b & 0xff).toString(16)

        ).slice(-2);

      })

      .join('');



  return [

    hex.slice(0, 8),

    hex.slice(8, 12),

    hex.slice(12, 16),

    hex.slice(16, 20),

    hex.slice(20, 32)

  ].join('-');

}
