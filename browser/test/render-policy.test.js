const assert = require("node:assert/strict");
const { test } = require("node:test");
const { frameRate } = require("../dist/page/frame-rate.js");
const { BitmapPresenter, presentPaint } = require("../dist/page/paint.js");

const drain = () => new Promise(resolve => setImmediate(resolve));

test("FPS defaults to 60 and hidden rendering never exceeds the override", () => {
  const previous = process.env.TERMINAL_BROWSER_FPS;
  try {
    for (const [value, normal, hidden] of [
      [undefined, 60, 4], ["", 60, 4], ["no", 60, 4], ["0", 60, 4],
      ["-1", 60, 4], ["Infinity", 60, 4], ["30", 30, 4], ["120", 120, 4],
      ["300", 240, 4], ["1", 1, 1], ["2.6", 3, 3], ["0.1", 1, 1],
    ]) {
      if (value === undefined) delete process.env.TERMINAL_BROWSER_FPS;
      else process.env.TERMINAL_BROWSER_FPS = value;
      assert.equal(frameRate(), normal, String(value));
      assert.equal(frameRate(false), hidden, String(value));
    }
  } finally {
    if (previous === undefined) delete process.env.TERMINAL_BROWSER_FPS;
    else process.env.TERMINAL_BROWSER_FPS = previous;
  }
});

test("clearing queued bitmap paint prevents a stale submission on hide", async () => {
  const frames = [];
  const presenter = new BitmapPresenter({ present: frame => frames.push(frame) });
  const image = { getSize: () => ({ width: 2, height: 2 }), toBitmap: () => Buffer.alloc(16) };
  const damage = { x: 0, y: 0, width: 1, height: 1 };
  presenter.push(image, damage, false);
  presenter.clear();
  await drain();
  assert.equal(frames.length, 0);
  presenter.push(image, damage, true);
  await drain();
  assert.equal(frames.length, 1);
  assert.equal(frames[0].damage, undefined);
});

test("borrowed paint is released once on rejection or successful handoff", () => {
  let released = 0;
  const texture = { textureInfo: { widgetType: "popup", pixelFormat: "bgra" }, release: () => released++ };
  assert.equal(presentPaint({}, texture, undefined, {}, {}, false), false);
  assert.equal(released, 1);
  const shm = {
    release: () => released++,
    frameInfo: { widgetType: "frame", pixelFormat: "bgra", contentRect: { x: 0, y: 0, width: 2, height: 2 },
      stride: 8, dataSize: 16, fd: 0, metadata: {} },
  };
  const damage = { x: 0, y: 0, width: 1, height: 1 };
  let frame;
  assert.equal(presentPaint({ present: value => { frame = value; } }, undefined, shm, {}, damage, true), true);
  assert.equal(frame.damage, undefined);
  assert.equal(released, 1);
  frame.released();
  assert.equal(released, 2);
  assert.equal(presentPaint({ present: () => { throw new Error("rejected"); } }, undefined, shm, {}, damage, false), false);
  assert.equal(released, 3);
});
