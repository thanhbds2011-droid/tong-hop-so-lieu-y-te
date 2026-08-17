/**
 * Tổng hợp số liệu Phòng Y tế - Ứng dụng Phòng Y tế - Firebase production 9.6.0
 *
 * Firebase Web config là thông tin cấu hình công khai của ứng dụng web,
 * không phải service-account secret. Tuyệt đối không đặt private key,
 * mật khẩu quản trị hoặc token bí mật trong GitHub.
 */
window.YTE_APP_CONFIG = Object.freeze({
  APP_NAME: 'Ứng dụng Phòng Y tế',
  ORGANIZATION: 'Trung tâm Bảo trợ xã hội Tân Hiệp',
  VERSION: '9.6.0',
  OWNER_EMAIL: 'thanhbds2011@gmail.com',
  ONESIGNAL: Object.freeze({
    HOSTS: Object.freeze({
      'thanhbds2011-droid.github.io': 'a4b225b6-eb6c-4523-8889-cf0ac0d96e0f',
      'khanhhuyen131093-pyt.github.io': '8e4e68f9-d961-4709-933c-5488d79094b1'
    })
  }),
  FIREBASE: Object.freeze({
    apiKey: 'AIzaSyCDEcZZWhMbdNpDD6PEPmDgo68zo352jOU',
    authDomain: 'hsba-trung-tam-test.firebaseapp.com',
    databaseURL: 'https://hsba-trung-tam-test-default-rtdb.asia-southeast1.firebasedatabase.app',
    projectId: 'hsba-trung-tam-test',
    storageBucket: 'hsba-trung-tam-test.firebasestorage.app',
    messagingSenderId: '711784208666',
    appId: '1:711784208666:web:89c555a08ece8b7f44f4a3',
    measurementId: 'G-W8JYRQNQMB'
  })
});
