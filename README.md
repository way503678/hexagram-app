# 易卦占卜 — iOS app(Expo / React Native)

擲卦排盤 app,接 `/opt/hexagram` 後端的 REST API。
技術:Expo SDK 56 + React Native 0.85 + TypeScript(Hermes + New Architecture)。

## 結構
```
App.tsx                 主畫面:擲卦 → 排盤 → 顯示結果
index.ts                進入點(registerRootComponent)
src/config.ts           ⚙️ API 位址(API_BASE_URL)— 必改成你後端可連的位址
src/api.ts              後端 API client(castChart / checkHealth)
src/types.ts            卦象 JSON 的 TypeScript 型別(對應後端 _compute_chart)
src/divination.ts       金錢卦擲爻邏輯(與網頁版一致)
src/theme.ts            色彩 / 間距
src/components/ChartResult.tsx   卦名 + 六爻表
```

## 後端對應
- `GET  /api/v1/health` — 連線測試
- `POST /api/v1/chart`  — 日期 + 六爻 → 卦象(免費、免登入)

排盤是確定性運算,不花 Claude 額度。AI 解盤(SSE 串流)為 Phase 3。

## 在 Mac 上跑(iOS 模擬器)
1. 確認 `src/config.ts` 的 `API_BASE_URL` 指向後端(LAN 部署填伺服器區網 IP,例如 `http://192.168.1.115:8080`;模擬器與後端要連得到)。
2. 安裝相依:`npm install`
3. 啟動:`npx expo start`,在終端機按 `i` 開 iOS 模擬器(需先裝 Xcode)。

> 開發階段已在 `app.json` 開 `NSAllowsLocalNetworking` 以連 LAN http。
> 正式上架務必改走 https 並移除此例外。

## 之後(Phase 3)
登入(Sign in with Apple)、AI 解盤(react-native-sse 串流)、點數 / App Store IAP。
詳見後端 repo 的記憶:points-system-plan、ios-app-goal。
