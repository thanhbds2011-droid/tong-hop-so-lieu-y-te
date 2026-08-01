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
  var connectionStatus = document.getElementById('connectionStatus');
  var connectionText = document.getElementById('connectionText');
  var openDirectButton = document.getElementById('openDirectButton');
  var timeoutDirectLink = document.getElementById('timeoutDirectLink');
  var refreshButton = document.getElementById('refreshButton');
  var retryButton = document.getElementById('retryButton');
  var retrySetupButton = document.getElementById('retrySetupButton');

  var loadTimer = null;
  var currentUrl = '';
  var isConfigured = false;

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

  function setConnection(mode, text) {
    connectionStatus.className = 'connection-status ' + mode;
    connectionText.textContent = text;
  }

  function updateNetworkUi() {
    var online = navigator.onLine;
    offlineBanner.hidden = online;
    if (!online) setConnection('offline', 'Mất kết nối');
    else if (!isConfigured) setConnection('warning', 'Chưa cấu hình');
    else if (!loadingLayer.hidden) setConnection('loading', 'Đang kết nối');
    else setConnection('online', 'Đã kết nối');
  }

  function showSetup() {
    isConfigured = false;
    setupPanel.hidden = false;
    viewer.hidden = true;
    openDirectButton.hidden = true;
    setConnection('warning', 'Chưa cấu hình');
  }

  function showLoading(message) {
    loadingText.textContent = message || 'Đang kết nối đến hệ thống dữ liệu…';
    loadingLayer.hidden = false;
    timeoutPanel.hidden = true;
    setConnection('loading', 'Đang kết nối');
  }

  function showReady() {
    window.clearTimeout(loadTimer);
    loadingLayer.hidden = true;
    timeoutPanel.hidden = true;
    setConnection(navigator.onLine ? 'online' : 'offline', navigator.onLine ? 'Đã kết nối' : 'Mất kết nối');
  }

  function showTimeout() {
    loadingLayer.hidden = true;
    timeoutPanel.hidden = false;
    setConnection(
      navigator.onLine ? 'warning' : 'offline',
      navigator.onLine ? 'Phản hồi chậm' : 'Mất kết nối'
    );
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
    openDirectButton.hidden = false;
    openDirectButton.href = currentUrl;
    timeoutDirectLink.href = currentUrl;
    showLoading(forceRefresh ? 'Đang tải lại phiên làm việc…' : 'Đang kết nối đến hệ thống dữ liệu…');

    if (!navigator.onLine) {
      updateNetworkUi();
      showTimeout();
      return;
    }

    frame.removeAttribute('src');
    window.requestAnimationFrame(function () {
      frame.src = forceRefresh ? cacheBustedUrl(currentUrl) : currentUrl;
      startTimeout();
    });
  }

  frame.addEventListener('load', function () {
    if (frame.getAttribute('src')) showReady();
  });

  refreshButton.addEventListener('click', function () {
    if (isConfigured) loadApplication(true);
    else loadApplication(false);
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
