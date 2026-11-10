const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { act, create } = require('react-test-renderer');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

async function mount(t, { balance = 2, unlocked = false, ready = false, fail = false } = {}) {
  let purchases = 0, reads = 0, refreshes = 0;
  let complete;
  let status = { cost: 2, balance, unlocked, ready, pending: false, fortune: null, reading: null, prompt: null };
  const Auth = React.createContext({ user: { id: 1, points_balance: balance }, refresh: async () => { refreshes++; } });
  const source = fs.readFileSync(path.join(__dirname, '../src/components/FortunePanel.tsx'), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports, setTimeout, clearTimeout,
    require(name) {
      if (name === 'react') return React;
      if (name === 'react-native') return {
        ...Object.fromEntries(['View', 'Text', 'ActivityIndicator', 'Pressable', 'TouchableOpacity'].map(n => [n,n])),
        AppState: { addEventListener: () => ({ remove() {} }) },
        StyleSheet: { create: s => s }, useWindowDimensions: () => ({ width: 390, fontScale: 1 }),
      };
      if (name === '../AuthContext') return { useAuth: () => React.useContext(Auth) };
      if (name === '../api') return {
        ApiError: Error,
        fetchFortuneAccess: async () => { reads++; return { ...status }; },
        unlockFortune: () => {
          purchases++;
          if (fail) return Promise.reject(new Error('已退回預扣果實'));
          return new Promise(resolve => { complete = () => { status = { ...status, balance: 0, unlocked: true, ready: true }; resolve(status); }; });
        },
      };
      if (name === '../hooks/useClipboardFeedback') return { useClipboardFeedback: () => ({ copy() {}, reset() {}, feedback: null, copied: false }) };
      if (name === './CopyFeedback') return { __esModule: true, default: () => null };
      if (name === './MingoReading') return { __esModule: true, default: 'MingoReading' };
      if (name === '../theme') return { colors: {}, spacing: {}, wuxingColor() {} };
      throw new Error(`unexpected import ${name}`);
    },
  });
  const birth = { y: 1990, m: 1, d: 2, h: 3 };
  const render = (props = {}) => React.createElement(Auth.Provider, { value: { user: { id: 1, points_balance: balance }, refresh: async () => { refreshes++; } } }, React.createElement(exports.default, { birth, gender: 'F', ...props }));
  let renderer;
  await act(async () => { renderer = create(render()); });
  t.after(async () => { await act(async () => renderer.unmount()); });
  return {
    renderer,
    counts: () => ({ purchases, reads, refreshes }),
    button: () => renderer.root.findAllByProps({ testID: 'fortune-unlock' })[0],
    async press() { let promise; await act(async () => { promise = this.button().props.onPress(); }); return { promise }; },
    async finish(request) { await act(async () => { complete(); await request.promise; }); },
    async year() { await act(async () => renderer.root.findAllByType('Pressable')[1].props.onPress()); },
    async birth(value) { await act(async () => renderer.update(render({ birth: value }))); },
  };
}

test('opening, changing year or birth only checks access and never purchases', async t => {
  const view = await mount(t);
  await view.year();
  await view.birth({ y: 1991, m: 2, d: 3, h: 4 });
  assert.equal(view.counts().purchases, 0);
  assert.equal(view.counts().reads, 3);
});

test('explicit unlock purchases once even if pressed twice before completion', async t => {
  const view = await mount(t);
  const first = await view.press();
  assert.equal(view.button().props.disabled, true);
  await view.press();
  assert.equal(view.counts().purchases, 1);
  await view.finish(first);
  assert.equal(view.button(), undefined);
  assert.equal(view.counts().refreshes, 1);
});

test('one fruit cannot buy a two-fruit forecast', async t => {
  const view = await mount(t, { balance: 1 });
  assert.equal(view.button().props.disabled, true);
  await view.press();
  assert.equal(view.counts().purchases, 0);
});

test('a purchased expired forecast can regenerate at zero balance', async t => {
  const view = await mount(t, { balance: 0, unlocked: true });
  assert.equal(view.button().props.disabled, false);
  assert.match(JSON.stringify(view.renderer.toJSON()), /不扣果實/);
  const req = await view.press();
  await view.finish(req);
  assert.equal(view.counts().purchases, 1);
});

test('opening an already saved forecast never posts an unlock request', async t => {
  const view = await mount(t, { balance: 0, unlocked: true, ready: true });
  assert.equal(view.button(), undefined);
  assert.equal(view.counts().purchases, 0);
});

test('generation failure refreshes balance and leaves a retryable inline error', async t => {
  const view = await mount(t, { fail: true });
  const req = await view.press();
  await req.promise;
  assert.equal(view.button().props.disabled, false);
  assert.match(JSON.stringify(view.renderer.toJSON()), /已退回預扣果實/);
  assert.equal(view.counts().refreshes, 1);
});
