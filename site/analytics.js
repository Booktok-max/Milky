(function () {
  'use strict';

  const endpoint = window.__ATOMIC_SHELF_ANALYTICS_ENDPOINT__ || '';
  const sessionKey = 'atomic_shelf_session';
  const sessionId = window.crypto && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  function send(eventName, properties) {
    const payload = {
      event: eventName,
      properties: properties || {},
      path: window.location.pathname,
      referrer: document.referrer || '',
      session_id: sessionId,
      timestamp: new Date().toISOString()
    };

    if (endpoint) {
      const body = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }));
      } else {
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true
        }).catch(() => {});
      }
    } else if (window.ATOMIC_SHELF_ANALYTICS_DEBUG) {
      console.debug('[Atomic Shelf analytics]', payload);
    }
  }

  window.AtomicShelfAnalytics = { track: send };

  document.addEventListener('click', event => {
    const target = event.target.closest('[data-track]');
    if (!target) return;
    const properties = {};
    [...target.attributes]
      .filter(attribute => attribute.name.startsWith('data-track-'))
      .forEach(attribute => {
        properties[attribute.name.slice('data-track-'.length)] = attribute.value;
      });
    send(target.dataset.track, properties);
  });

  document.addEventListener('submit', event => {
    const form = event.target.closest('[data-track-submit]');
    if (form) send(form.dataset.trackSubmit, { form: form.id || 'unnamed' });
  });

  send('page_view', { title: document.title });
})();
