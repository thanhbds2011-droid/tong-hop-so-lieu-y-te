'use strict';

// UI production 8.3.2 — autofill protection, mobile keyboard safety, textarea auto-grow.
(function () {
  function prepareDashboardSearch() {
    const input = document.getElementById('dashboardSearch');
    if (!input) return;
    input.value = '';
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('data-lpignore', 'true');
    input.setAttribute('data-1p-ignore', 'true');
    const unlock = () => {
      input.readOnly = false;
      input.removeAttribute('readonly');
    };
    input.addEventListener('pointerdown', unlock, { once: true });
    input.addEventListener('keydown', unlock, { once: true });
    input.addEventListener('touchstart', unlock, { once: true, passive: true });
  }

  function clearSearchOnReturn() {
    const input = document.getElementById('dashboardSearch');
    if (!input) return;
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.readOnly = true;
    input.setAttribute('readonly', '');
  }

  function setupTextareaAutoGrow() {
    const resize = (textarea) => {
      if (!(textarea instanceof HTMLTextAreaElement)) return;
      textarea.style.height = 'auto';
      const maxHeight = 220;
      textarea.style.height = `${Math.min(maxHeight, Math.max(68, textarea.scrollHeight))}px`;
      textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
    };
    document.querySelectorAll('textarea').forEach((textarea) => {
      resize(textarea);
      textarea.addEventListener('input', () => resize(textarea));
    });
    window.YTE_RESIZE_TEXTAREA = resize;
  }

  function setupMobileKeyboardSafety() {
    let blurTimer = null;
    const isEditable = (target) => target && target.matches && target.matches('input:not([type="button"]):not([type="checkbox"]):not([type="radio"]), textarea, select');
    document.addEventListener('focusin', (event) => {
      if (!isEditable(event.target) || window.matchMedia('(min-width: 761px)').matches) return;
      clearTimeout(blurTimer);
      document.body.classList.add('keyboard-open');
      window.setTimeout(() => {
        try { event.target.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (_) {}
      }, 180);
    });
    document.addEventListener('focusout', () => {
      clearTimeout(blurTimer);
      blurTimer = window.setTimeout(() => {
        const active = document.activeElement;
        if (!isEditable(active)) document.body.classList.remove('keyboard-open');
      }, 160);
    });
    if (window.visualViewport) {
      const update = () => {
        if (window.matchMedia('(min-width: 761px)').matches) return;
        const keyboardLikelyOpen = window.innerHeight - window.visualViewport.height > 140;
        document.body.classList.toggle('keyboard-open', keyboardLikelyOpen || isEditable(document.activeElement));
      };
      window.visualViewport.addEventListener('resize', update);
      window.visualViewport.addEventListener('scroll', update);
    }
  }

  function init() {
    prepareDashboardSearch();
    setupTextareaAutoGrow();
    setupMobileKeyboardSafety();
    window.setTimeout(clearSearchOnReturn, 250);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
  window.addEventListener('pageshow', clearSearchOnReturn);
}());
