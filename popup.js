'use strict';

const DEFAULT_STATE = { enabled: true, fakeUnread: 0 };

const $ = (id) => document.getElementById(id);
const load = () => chrome.storage.local.get(DEFAULT_STATE);

async function render() {
  const s = await load();
  $('enabled').checked = s.enabled;
  $('status').textContent = `赤丸に足す数: ${s.fakeUnread}`;
}

$('enabled').addEventListener('change', async (e) => {
  await chrome.storage.local.set({ enabled: e.target.checked });
  render();
});

$('set').addEventListener('click', async () => {
  const n = Math.min(999, Math.max(1, Math.floor(Number($('count').value) || 1)));
  await chrome.storage.local.set({ fakeUnread: n });
  render();
});

$('clear').addEventListener('click', async () => {
  await chrome.storage.local.set({ fakeUnread: 0 });
  render();
});

render();
