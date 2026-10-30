const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const { act, create } = require("react-test-renderer");

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

async function mountHome(t, dailyGuide = false) {
  const Focus = React.createContext(true);
  const pending = [];
  const source = fs.readFileSync(path.join(__dirname, "../src/screens/HomeScreen.tsx"), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true,
  } }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === "react") return React;
      if (name === "react-native") return {
        ...Object.fromEntries(["View", "Image", "Text", "ScrollView", "RefreshControl", "ActivityIndicator"].map(n => [n, n])),
        StyleSheet: { create: s => s, absoluteFillObject: {} },
        useWindowDimensions: () => ({ width: 390, height: 844, fontScale: 1 }),
      };
      if (name === "react-native-safe-area-context") return { SafeAreaView: "SafeAreaView" };
      if (name === "expo-linear-gradient") return { LinearGradient: "LinearGradient" };
      if (name === "@react-navigation/native") return {
        useNavigation: () => ({ navigate() {} }),
        useFocusEffect(callback) {
          const focused = React.useContext(Focus);
          React.useEffect(() => focused ? callback() : undefined, [focused, callback]);
        },
      };
      if (name === "../AuthContext") return { useAuth: () => ({ user: { display_name: "Test" } }) };
      if (name === "../api") return {
        fetchDaily: () => new Promise(resolve => pending.push(resolve)),
        fetchAlmanacDay: () => assert.fail("Almanac is disabled"),
      };
      if (name === "../featureFlags") return { featureFlags: { dailyGuide, homeAlmanac: false } };
      if (name === "../theme") return {
        colors: {}, gradients: { frosted: [] }, radius: { card: 26 }, shadowSoft: {},
        spacing: { sm: 8, md: 16, lg: 24 },
      };
      if (name === "../components/ui") return { PrimaryButton: "PrimaryButton" };
      if (name === "../components/AlmanacCard") return "AlmanacCard";
      if (name.endsWith(".png")) return 1;
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  const render = focused => React.createElement(Focus.Provider, { value: focused }, React.createElement(exports.default));
  let renderer;
  await act(async () => { renderer = create(render(true)); });
  t.after(async () => { await act(async () => renderer.unmount()); });
  return {
    pending,
    controls: () => {
      const control = renderer.root.findByType("ScrollView").props.refreshControl;
      return control ? [control] : [];
    },
    async focus(focused) { await act(async () => renderer.update(render(focused))); },
    async complete(index) { await act(async () => pending[index]({ needs_birthday: true })); },
  };
}

test("switching home tabs without home data does not attach a refresh control", async t => {
  const home = await mountHome(t);
  for (let i = 0; i < 3; i++) {
    await home.focus(false);
    await home.focus(true);
    assert.equal(home.controls().length, 0);
  }
  assert.equal(home.pending.length, 0);
});

test("focus reloads home data without programmatically pulling the page down", async t => {
  const home = await mountHome(t, true);
  assert.equal(home.pending.length, 1);
  assert.equal(home.controls()[0].props.refreshing, false);
  await home.complete(0);
  await home.focus(false);
  await home.focus(true);
  assert.equal(home.pending.length, 2);
  assert.equal(home.controls()[0].props.refreshing, false);
  await home.complete(1);
});

test("a user's pull still shows refresh feedback until their request finishes", async t => {
  const home = await mountHome(t, true);
  await home.complete(0);
  let request;
  await act(async () => { request = home.controls()[0].props.onRefresh(); });
  assert.equal(home.controls()[0].props.refreshing, true);
  await home.complete(1);
  await act(async () => { await request; });
  assert.equal(home.controls()[0].props.refreshing, false);
});

test("leaving during a pull stops its spinner before returning to home", async t => {
  const home = await mountHome(t, true);
  await home.complete(0);
  let request;
  await act(async () => { request = home.controls()[0].props.onRefresh(); });
  await home.focus(false);
  assert.equal(home.controls()[0].props.refreshing, false);
  await home.focus(true);
  assert.equal(home.controls()[0].props.refreshing, false);
  await home.complete(1);
  await home.complete(2);
  await act(async () => { await request; });
});
