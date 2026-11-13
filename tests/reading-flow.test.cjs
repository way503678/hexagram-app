const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { act, create } = require('react-test-renderer');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function load(file, dependencies, globals = {}) {
  const source = fs.readFileSync(path.join(__dirname, '../src', file), 'utf8');
  const compiled = ts.transpileModule(source, {compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true,
  }}).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {exports, ...globals, require(name) {
    if (name === 'react') return React;
    if (name in dependencies) return dependencies[name];
    throw Error(`Unexpected import ${name}`);
  }});
  return exports.default;
}
const native = {
  ...Object.fromEntries(['View','Text','Pressable','TextInput','ScrollView','SafeAreaView','KeyboardAvoidingView','ActivityIndicator','Modal'].map(n=>[n,n])),
  Platform: {OS: 'ios'}, StyleSheet: {create:s=>s}, useWindowDimensions:()=>({width:390,fontScale:1}),
  Alert: {alert(){throw Error('Unexpected native dialog');}},
};
const texts = node => node.findAllByType('Text').flatMap(n=>n.children.filter(c=>typeof c==='string')).join('');
const text = renderer => JSON.stringify(renderer.toJSON());

async function cast(t, canBack=true) {
  let timer, finish, back=0, navigated, calls=0;
  const Screen = load('screens/CastScreen.tsx', {
    'react-native': native,
    'react-native-safe-area-context': {SafeAreaView:'SafeAreaView',SafeAreaProvider:'SafeAreaProvider'},
    '../hooks/useClipboardFeedback': {useClipboardFeedback:()=>({copy:async()=>true,reset(){},feedback:null})},
    '../components/CopyFeedback': ()=>null,
    '@react-native-community/datetimepicker': ()=>null,
    '../api': {ApiError:Error,castChart:async()=>({record_id:7}),generateReading:()=>{calls++;return new Promise(r=>finish=r);}},
    '../components/MingoReading': 'MingoReading', '../components/EmailReadingButton': 'EmailReadingButton',
    '../AuthContext': {useAuth:()=>({user:{id:1,points_balance:14},setUser(){}})},
    '../divination': {YAO_NAMES:['初爻','二爻','三爻','四爻','五爻','上爻'],castOneYao:()=>({symbol:'—',val:'1,0',name:'陽',陰陽:'陽'})},
    '../theme': {colors:{},spacing:{}}, '../components/ChartResult': ()=>null,
    '../components/FortunePanel': ()=>null, '../components/YaoGlyph': ()=>null, '../featureFlags': {featureFlags:{}},
  }, {setInterval: fn=>(timer=fn,1),clearInterval(){}});
  let renderer;
  await act(async()=>{renderer=create(React.createElement(Screen,{route:{params:{mode:'coin'}},navigation:{canGoBack:()=>canBack,goBack:()=>back++,navigate:name=>navigated=name}}));});
  t.after(async()=>{await act(async()=>renderer.unmount());});
  const button=label=>renderer.root.findAllByType('Pressable').find(n=>texts(n).includes(label));
  await act(async()=>renderer.root.findByType('TextInput').props.onChangeText('合成問題'));
  for(let i=0;i<6;i++){
    await act(async()=>button(`擲第 ${i+1} 爻`).props.onPress());
    await act(async()=>{for(let j=0;j<6;j++)timer();});
  }
  await act(async()=>button('排盤 →').props.onPress());
  return {renderer,button,get calls(){return calls;},get back(){return back;},get navigated(){return navigated;},
    async complete(){await act(async()=>finish({reading:'【盤面解析】完整解讀',record_id:7,balance:13}));}};
}

test('chart back button returns immediately and has a Tabs fallback',async t=>{
  const view=await cast(t);
  await act(async()=>view.renderer.root.findByProps({testID:'cast-back'}).props.onPress());
  assert.equal(view.back,1);
  const fallback=await cast(t,false);
  await act(async()=>fallback.renderer.root.findByProps({testID:'cast-back'}).props.onPress());
  assert.equal(fallback.navigated,'Tabs');
});

test('waiting warning, saved email entry, and closing fully removes the result modal',async t=>{
  const view=await cast(t);
  assert.equal(view.renderer.root.findAllByType('Modal').length,0);
  await act(async()=>{view.button('命果為你解讀').props.onPress();});
  assert.match(text(view.renderer),/請勿跳出 App/);
  assert.equal(view.calls,1);
  assert.equal(view.renderer.root.findAllByType('Modal').length,0);
  await view.complete();
  assert.equal(view.renderer.root.findAllByType('Modal').length,1);
  assert.equal(view.renderer.root.findByType('EmailReadingButton').props.recordId,7);
  assert.doesNotMatch(text(view.renderer),/想再多聊聊|最有感的是哪一句/);
  await act(async()=>view.renderer.root.findByProps({accessibilityLabel:'關閉 AI 解讀'}).props.onPress());
  assert.equal(view.renderer.root.findAllByType('Modal').length,0);
  await act(async()=>view.renderer.root.findByProps({testID:'cast-back'}).props.onPress());
  assert.equal(view.back,1);
});

async function email(t,{verified=true,fail=false}={}) {
  let calls=0,finish;
  const Button=load('components/EmailReadingButton.tsx',{
    'react-native':native,'../theme':{colors:{}},
    '../AuthContext':{useAuth:()=>({user:{email:'preview@example.invalid',email_verified:verified}})},
    '../api':{ApiError:Error,emailReading:id=>{assert.equal(id,7);calls++;return new Promise((resolve,reject)=>finish=()=>fail?reject(Error('寄送失敗，請稍後再試。')):resolve({ok:true,email:'preview@example.invalid'}));}},
  });
  let renderer;
  await act(async()=>renderer=create(React.createElement(Button,{recordId:7})));
  t.after(async()=>{await act(async()=>renderer.unmount());});
  return {renderer,get calls(){return calls;},press:()=>renderer.root.findByProps({testID:'email-reading'}).props.onPress(),async finish(){await act(async()=>finish());}};
}

test('email only sends on an explicit tap and ignores a second pending tap',async t=>{
  const view=await email(t);assert.equal(view.calls,0);
  await act(async()=>{view.press();view.press();});assert.equal(view.calls,1);
  await view.finish();assert.match(text(view.renderer),/已寄送至 preview@example.invalid/);
});
test('unverified email blocks delivery and explains how to verify',async t=>{
  const view=await email(t,{verified:false});await act(async()=>view.press());
  assert.equal(view.calls,0);assert.match(text(view.renderer),/完成 Email 驗證/);
});
test('mail failure is shown inline and permits retry',async t=>{
  const view=await email(t,{fail:true});await act(async()=>{view.press();});await view.finish();
  assert.match(text(view.renderer),/寄送失敗/);assert.equal(view.renderer.root.findByProps({testID:'email-reading'}).props.disabled,false);
});
