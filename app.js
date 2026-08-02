(function () {
  'use strict';

  var config = window.YTE_APP_CONFIG || {};
  var frame = document.getElementById('appFrame');
  var viewer = document.getElementById('viewer');
  var setupPanel = document.getElementById('setupPanel');
  var loadingLayer = document.getElementById('loadingLayer');
  var loadingText = document.getElementById('loadingText');
  var timeoutPanel = document.getElementById('timeoutPanel');
  var offlineBanner = document.getElementById('offlineBanner');
  var retryButton = document.getElementById('retryButton');
  var retrySetupButton = document.getElementById('retrySetupButton');

  var loadTimer = null;
  var currentUrl = '';
  var isConfigured = false;
  var appReady = false;

  function getConfiguredUrl() {
    var raw = String(config.APPS_SCRIPT_URL || '').trim();
    if (!raw || raw.indexOf('DAN_URL_') === 0) return '';
    try {
      var parsed = new URL(raw);
      var isGoogleHost = parsed.hostname === 'script.google.com';
      var isWebAppPath = /^\/macros\/s\/.+\/(exec|dev)$/.test(parsed.pathname);
      if (parsed.protocol !== 'https:' || !isGoogleHost || !isWebAppPath) return '';
      return parsed.toString();
    } catch (error) {
      return '';
    }
  }

  function isAllowedGoogleOrigin(origin) {
    try {
      var hostname = new URL(origin).hostname;
      return hostname === 'script.google.com' ||
        hostname === 'script.googleusercontent.com' ||
        hostname.endsWith('.googleusercontent.com');
    } catch (error) {
      return false;
    }
  }

  function updateNetworkUi() {
    offlineBanner.hidden = navigator.onLine;
  }

  function showSetup() {
    isConfigured = false;
    setupPanel.hidden = false;
    viewer.hidden = true;
  }

  function showLoading(message) {
    appReady = false;
    loadingText.textContent = message || 'Đang kết nối đến hệ thống dữ liệu…';
    loadingLayer.hidden = false;
    timeoutPanel.hidden = true;
  }

  function showReady() {
    appReady = true;
    window.clearTimeout(loadTimer);
    loadingLayer.hidden = true;
    timeoutPanel.hidden = true;
  }

  function showTimeout() {
    if (appReady) return;
    loadingLayer.hidden = true;
    timeoutPanel.hidden = false;
  }

  function cacheBustedUrl(url) {
    var parsed = new URL(url);
    parsed.searchParams.set('_github_reload', String(Date.now()));
    return parsed.toString();
  }

  function startTimeout() {
    window.clearTimeout(loadTimer);
    loadTimer = window.setTimeout(showTimeout, Number(config.LOAD_TIMEOUT_MS) || 30000);
  }

  function loadApplication(forceRefresh) {
    currentUrl = getConfiguredUrl();
    if (!currentUrl) {
      showSetup();
      return;
    }

    isConfigured = true;
    setupPanel.hidden = true;
    viewer.hidden = false;
    showLoading(forceRefresh ? 'Đang tải lại phiên làm việc…' : 'Đang kết nối đến hệ thống dữ liệu…');

    if (!navigator.onLine) {
      updateNetworkUi();
      showTimeout();
      return;
    }

    startTimeout();
    frame.src = forceRefresh ? cacheBustedUrl(currentUrl) : currentUrl;
  }

  frame.addEventListener('load', function () {
  if (!frame.getAttribute('src')) return;

  loadingText.textContent = 'Đang khởi tạo giao diện ứng dụng…';

  window.setTimeout(function () {
    if (!appReady) {
      showReady();
    }
  }, 800);
});

 window.addEventListener('message', function (event) {
  if (!isAllowedGoogleOrigin(event.origin)) return;
  if (!event.data || event.data.type !== 'YTE_APP_READY') return;

  showReady();
});

  retryButton.addEventListener('click', function () {
    loadApplication(true);
  });

  retrySetupButton.addEventListener('click', function () {
    loadApplication(false);
  });

  window.addEventListener('offline', updateNetworkUi);
  window.addEventListener('online', function () {
    updateNetworkUi();
    if (isConfigured && timeoutPanel.hidden === false) loadApplication(true);
  });

  document.title = config.APP_NAME || document.title;
  loadApplication(false);
  updateNetworkUi();

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./service-worker.js', { scope: './' }).catch(function () {
        // Ứng dụng vẫn hoạt động bình thường nếu trình duyệt không hỗ trợ PWA.
      });
    });
  }
})();
