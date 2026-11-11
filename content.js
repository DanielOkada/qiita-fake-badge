// Qiita Fake Badge - content script
//
// 方針: 赤丸は自分で描かない。Qiita自身のReactが読む未読数を、読まれる前に書き換える。
// そうすれば、数字の大きさも位置も、Qiitaが本物と同じコードで描く。
//
// 書き換えるのは、ページのHTMLに埋め込まれたJSONの
//   #js-react-on-rails-context の currentUser.unreadNotificationsCount
// （本物の未読数に、偽の数を足す）。
//
// タイミング: HTMLの解析が終わると readyState が "interactive" になり、readystatechange が飛ぶ。
// defer付きのQiitaのバンドルが動くのはその後なので、そのイベントの中で書き換えれば間に合う。
//
// 通知一覧ページ（/notifications）を開いたら、偽の数は既読にして0へ戻す。

(function () {
  'use strict';

  const DEFAULT_STATE = {
    enabled: true,
    fakeUnread: 0, // 赤丸に足す偽の未読数
  };

  function safeStringify(obj) {
    // <script type="application/json"> の中に入れるので、< をエスケープしておく
    return JSON.stringify(obj).replace(/</g, '\\u003c');
  }

  // 本物の未読数に偽の未読数を足す。足せたら true
  function patchContext(ctx, extraUnread) {
    if (!ctx || !ctx.currentUser) return false;
    const real = Number(ctx.currentUser.unreadNotificationsCount) || 0;
    ctx.currentUser.unreadNotificationsCount = real + extraUnread;
    return true;
  }

  function readJsonScript(el) {
    try {
      return JSON.parse(el.textContent);
    } catch (e) {
      return null;
    }
  }

  // SSRされていた場合のハイドレーション不一致を避けるため、書き換えたコンポーネントの
  // 描画済みHTMLは空にして、データからクライアント描画させる（空なら何も起きない）
  function clearRenderedContainer(domId) {
    const el = document.getElementById(domId);
    if (el && el.innerHTML) el.innerHTML = '';
  }

  function applyToPage(state) {
    if (!state.enabled) return;

    // 通知一覧を開いたら既読。赤丸は本物の数だけにする
    if (location.pathname === '/notifications') {
      if (state.fakeUnread > 0) chrome.storage.local.set({ fakeUnread: 0 });
      return;
    }

    if (!(state.fakeUnread > 0)) return;

    const ctxEl = document.getElementById('js-react-on-rails-context');
    const ctx = ctxEl ? readJsonScript(ctxEl) : null;
    if (!ctx || !patchContext(ctx, state.fakeUnread)) return;

    ctxEl.textContent = safeStringify(ctx);
    document
      .querySelectorAll('[id^="GlobalHeader-react-component-"]')
      .forEach((el) => clearRenderedContainer(el.id));

    // サーバが別の形で埋め込んでいる場合に備えて、dataContainer側にも同じ数を足す
    const dc = document.getElementById('dataContainer');
    if (dc && dc.dataset.config) {
      try {
        const cfg = JSON.parse(dc.dataset.config);
        if (patchContext(cfg, state.fakeUnread)) dc.dataset.config = JSON.stringify(cfg);
      } catch (e) {
        /* 形が違えば何もしない */
      }
    }
  }

  function main() {
    let applied = false;
    const stateReady = chrome.storage.local
      .get(DEFAULT_STATE)
      .then((s) => Object.assign({}, DEFAULT_STATE, s));

    const run = () => {
      if (applied || document.readyState === 'loading') return;
      applied = true;
      stateReady.then(applyToPage).catch((e) => console.warn('[qiita-fake-badge]', e));
    };

    document.addEventListener('readystatechange', run);
    run();
  }

  if (typeof chrome !== 'undefined' && chrome.storage && typeof document !== 'undefined') {
    main();
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { patchContext, safeStringify };
  }
})();
