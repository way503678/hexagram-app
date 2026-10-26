const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const { act, create } = require("react-test-renderer");

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

async function mount(t, write = async () => true) {
  const listeners = new Set();
  const writes = [];
  const native = {
    AppState: {
      currentState: "active",
      addEventListener(event, listener) {
        assert.equal(event, "change");
        listeners.add(listener);
        return { remove: () => listeners.delete(listener) };
      },
    },
    Alert: { alert: () => assert.fail("Copy feedback must not present a native dialog") },
  };
  const source = fs.readFileSync(path.join(__dirname, "../src/hooks/useClipboardFeedback.ts"), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === "react") return React;
      if (name === "react-native") return native;
      if (name === "expo-clipboard") return {
        setStringAsync(text) { writes.push(text); return write(text); },
      };
      throw new Error(`Unexpected dependency: ${name}`);
    },
    setTimeout,
    clearTimeout,
  });
  let value;
  function Harness() {
    value = exports.useClipboardFeedback();
    return null;
  }
  let renderer;
  await act(async () => { renderer = create(React.createElement(Harness)); });
  t.after(async () => { await act(async () => { renderer.unmount(); }); });
  return {
    get current() { return value; },
    writes,
    listeners,
    async state(state) {
      await act(async () => {
        native.AppState.currentState = state;
        for (const listener of listeners) listener(state);
      });
    },
    async unmount() { await act(async () => { renderer.unmount(); }); },
  };
}

test("copy shows inline confirmation and clears it when leaving the app", async (t) => {
  const hook = await mount(t);
  await act(async () => { assert.equal(await hook.current.copy("paid prompt"), true); });
  assert.deepEqual(hook.writes, ["paid prompt"]);
  assert.equal(hook.current.copied, true);
  await hook.state("inactive");
  await hook.state("background");
  await hook.state("active");
  assert.equal(hook.current.feedback, null);
  await act(async () => { await hook.current.copy("paid prompt"); });
  assert.equal(hook.current.copied, true);
});

test("a clipboard result arriving after background and return stays dismissed", async (t) => {
  let finish;
  const hook = await mount(t, () => new Promise((resolve) => { finish = resolve; }));
  let pending;
  await act(async () => { pending = hook.current.copy("prompt"); });
  await hook.state("background");
  await hook.state("active");
  await act(async () => { finish(true); await pending; });
  assert.equal(hook.current.feedback, null);
});

test("failed clipboard access stays inline and can be retried", async (t) => {
  let failed = true;
  const hook = await mount(t, async () => {
    if (failed) throw new Error("system clipboard unavailable");
    return true;
  });
  await act(async () => { assert.equal(await hook.current.copy("saved prompt"), false); });
  assert.equal(hook.current.feedback.kind, "error");
  assert.match(hook.current.feedback.message, /內容已保留/);
  failed = false;
  await act(async () => { await hook.current.copy("saved prompt"); });
  assert.equal(hook.current.copied, true);
});

test("clipboard false is a failure rather than a success confirmation", async (t) => {
  const hook = await mount(t, async () => false);
  await act(async () => { assert.equal(await hook.current.copy("prompt"), false); });
  assert.equal(hook.current.feedback.kind, "error");
});

test("older clipboard completion cannot overwrite the latest confirmation", async (t) => {
  let finish;
  const hook = await mount(t, (text) => text === "old"
    ? new Promise((resolve) => { finish = resolve; }) : Promise.resolve(true));
  let pending;
  await act(async () => { pending = hook.current.copy("old", "old confirmation"); });
  await act(async () => { await hook.current.copy("new", "new confirmation"); });
  await act(async () => { finish(true); await pending; });
  assert.equal(hook.current.feedback.message, "new confirmation");
});

test("navigating away removes listeners and ignores a late clipboard result", async (t) => {
  let finish;
  const hook = await mount(t, () => new Promise((resolve) => { finish = resolve; }));
  let pending;
  await act(async () => { pending = hook.current.copy("prompt"); });
  await hook.unmount();
  assert.equal(hook.listeners.size, 0);
  await act(async () => { finish(true); await pending; });
  assert.equal(await hook.current.copy("after navigation"), false);
  assert.deepEqual(hook.writes, ["prompt"]);
});

test("a paid request finishing in the background does not start copying", async (t) => {
  const hook = await mount(t);
  await hook.state("background");
  assert.equal(await hook.current.copy("new paid prompt"), false);
  assert.deepEqual(hook.writes, []);
  await hook.state("active");
  await act(async () => { await hook.current.copy("new paid prompt"); });
  assert.equal(hook.current.copied, true);
});
