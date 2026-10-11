const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const sandbox = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'browser-render-'));
const shmMode = process.env.TERMINAL_BROWSER_SHM === '1' ? '1' : '0';
for (const key of Object.keys(process.env)) {
  if (/^(HERDR_|TERMINAL_BROWSER_|PI_)/.test(key)) delete process.env[key];
}
for (const [key, directory] of Object.entries({
  HOME: 'home', XDG_CONFIG_HOME: 'config', XDG_CACHE_HOME: 'cache', XDG_DATA_HOME: 'data',
  XDG_STATE_HOME: 'state', XDG_RUNTIME_DIR: 'runtime', TERMINAL_BROWSER_APPDATA: 'appdata',
  TERMINAL_BROWSER_INTEROP_DIR: 'interop', PI_CODING_AGENT_DIR: 'pi',
})) {
  process.env[key] = path.join(sandbox, directory);
  fs.mkdirSync(process.env[key], { mode: 0o700 });
}
process.env.TERMINAL_BROWSER_SHM = shmMode;
const { app, BrowserWindow, nativeImage } = require('electron');
app.setPath('userData', process.env.TERMINAL_BROWSER_APPDATA);
app.commandLine.appendSwitch('disable-gpu');
const { BrowserController } = require('../../dist/page/controller.js');
const { PopupWindow } = require('../../dist/page/popup.js');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(check) {
  for (let i = 0; i < 300; i++) { if (await check()) return; await wait(10); }
  throw new Error('render condition timed out');
}
const surface = () => ({
  frames: [], clear() {}, close() {},
  present(frame) { this.frames.push({ damage: frame.damage }); frame.released?.(); },
});
let controller, popup;
process.on('uncaughtException', error => { console.error(error); app.exit(1); });
process.on('unhandledRejection', error => { console.error(error); app.exit(1); });
(async () => {
  await app.whenReady();
  assert.equal(process.versions.electron, '43.3.0');
  const page = surface(), popupSurface = surface(), devtools = surface();
  controller = new BrowserController(page, popupSurface, devtools,
    { x: 0, y: 0, width: 320, height: 240, scale: 1 },
    'data:text/html,' + encodeURIComponent('<style>body{margin:0;background:rgb(1,2,3)}input{position:absolute;left:40px;top:40px}</style><input id="text"><script>window.ticks=0;setInterval(()=>window.ticks++,20)</script>'),
    { cwd: sandbox, background: '#222222', visible: false, partition: null,
      tabsAsPopups: false, clipboardRead: false, sessionKey: 'render-fixture', appTabId: null }, () => {});
  const contents = controller.pageContents;
  assert.equal(contents.getFrameRate(), 4, 'initial background cap');
  await until(() => contents.getURL().startsWith('data:') && !contents.isLoading());
  await wait(400);
  assert.equal(page.frames.length, 0, 'hidden native submissions');
  let releases = 0;
  const unreadImage = { getSize() { throw new Error('hidden bitmap read'); }, toBitmap() { throw new Error('hidden bitmap converted'); } };
  const damage = { x: 0, y: 0, width: 1, height: 1 };
  contents.emit('paint', { texture: { release: () => releases++ } }, damage, unreadImage);
  contents.emit('paint', { softwareFrame: { release: () => releases++ } }, damage, unreadImage);
  contents.emit('paint', {}, damage, unreadImage);
  assert.equal(releases, 2, 'borrowed hidden frames released once');
  const firstTick = await controller.runJs('ticks');
  await wait(80);
  assert.ok(await controller.runJs('ticks') > firstTick, 'hidden timers continue');
  await controller.runJs("document.body.style.background='rgb(10,20,30)'");
  await wait(300);
  const capture = nativeImage.createFromBuffer(await controller.capturePage());
  assert.deepEqual(capture.getSize(), { width: 320, height: 240 });
  assert.deepEqual([...capture.toBitmap().subarray(0, 3)], [30, 20, 10], 'explicit hidden capture is current');
  assert.equal(page.frames.length, 0, 'capture does not require native submission');

  controller.pinFrameRate(true);
  assert.equal(contents.getFrameRate(), 60, 'recording pin');
  await until(() => page.frames.length > 0);
  assert.equal(page.frames[0].damage, undefined, 'pin starts with a full frame');
  controller.pinFrameRate(false);
  const pinnedFrames = page.frames.length;
  await wait(350);
  assert.equal(page.frames.length, pinnedFrames, 'unpin while hidden stops submissions');
  process.env.TERMINAL_BROWSER_FPS = '2';
  controller.setVisible(true);
  assert.equal(contents.getFrameRate(), 2);
  controller.setVisible(false);
  assert.equal(contents.getFrameRate(), 2, 'hidden cap respects small override');
  delete process.env.TERMINAL_BROWSER_FPS;

  controller.setVisible(true);
  await until(() => page.frames.length > pinnedFrames);
  assert.equal(page.frames[pinnedFrames].damage, undefined, 'show repaints the whole surface');
  const beforeBlur = page.frames.length;
  controller.setActive(false);
  assert.equal(contents.getFrameRate(), 60, 'focus loss is not hidden');
  controller.invalidate();
  await until(() => page.frames.length > beforeBlur);
  await controller.runJs("document.getElementById('text').focus()");
  controller.key({ kind: 'press', key: 'x', text: 'x', mods: { shift: false, alt: false, ctrl: false, super: false } });
  await until(async () => await controller.runJs("document.getElementById('text').value") === 'x');
  const bitmap = { getSize: () => ({ width: 2, height: 2 }), toBitmap: () => Buffer.alloc(16) };
  const beforeHide = page.frames.length;
  contents.emit('paint', {}, damage, bitmap);
  controller.setVisible(false);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(page.frames.length, beforeHide, 'queued bitmap discarded on hide');

  controller.openDevtools({ x: 0, y: 0, width: 240, height: 180, scale: 1 }, 'bottom');
  assert.equal(controller.devtools.window.webContents.getFrameRate(), 4);
  await wait(200);
  assert.equal(devtools.frames.length, 0, 'hidden devtools discard paint');
  controller.setVisible(true);
  await until(() => devtools.frames.length > 0);
  assert.equal(devtools.frames[0].damage, undefined);
  controller.closeDevtools();
  controller.setVisible(false);

  const child = new BrowserWindow({ show: false, webPreferences: { sandbox: true, contextIsolation: true, disableDialogs: true, backgroundThrottling: false } });
  popup = new PopupWindow(child, popupSurface, { width: 160, height: 120 }, 1, () => 1, () => {}, () => {});
  popup.setVisible(false);
  await child.loadURL('data:text/html,<body style="background:red">fixture popup</body>');
  await wait(300);
  assert.equal(popupSurface.frames.length, 0, 'hidden startup does not stream popup');
  popup.setVisible(true);
  await until(() => popupSurface.frames.length > 0);
  popup.setVisible(false);
  const popupFrames = popupSurface.frames.length;
  await wait(200);
  assert.equal(popupSurface.frames.length, popupFrames);
  popup.destroy();
  popup = null;
  console.log(JSON.stringify({ result: 'render-policy-pass', shm: shmMode, pinnedFrames,
    pageFrames: page.frames.length, devtoolsFrames: devtools.frames.length, popupFrames, borrowedReleases: releases }));
  controller.stop();
  controller = null;
  app.exit(0);
})().catch(error => {
  console.error(error);
  popup?.destroy();
  controller?.stop();
  app.exit(1);
});
