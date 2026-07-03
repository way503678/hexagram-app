# 命果 MINGO — App(Expo / React Native)

`/opt/hexagram` 後端的**對等行動版**(iOS / Android / Web;目前以 Android 為主)。
技術:**Expo SDK 54 + React Native 0.81 + TypeScript**。

> 工作日誌與 App 待辦:**WORKLOG.md**(開新對話先讀);共用背景在後端 repo 的 `docs/WORKLOG.md`。
> ⚠️ 寫程式前先讀對應版本 Expo 文件(AGENTS.md)。

## 結構

```
App.tsx                 導覽殼:3-tab(功能/首頁/我的)+ 外層 Stack(Almanac/Cast);
                        未登入流程 Welcome → Login;Cormorant 字體載入
index.ts                進入點(registerRootComponent)
src/config.ts           ⚙️ API 位址(API_BASE_URL)— 指向後端公開 HTTPS 網址
src/api.ts              後端 API client(auth/chart/almanac/daily/reading/chat/reflection/legal…)
src/AuthContext.tsx     登入狀態(token 存 SecureStore;401 自動登出)
src/theme.ts            MINGO 設計 tokens(基準:後端 docs/DESIGN_SYSTEM.md)
src/screens/            Welcome/Login/Home/Features/Almanac/Cast/Member
src/components/         ui(共用元件)/AlmanacCard/ChartResult/FortunePanel/
                        MingoReading/MingoChat/MingoReflect/MingoIcon
src/divination.ts       金錢卦擲爻邏輯(與網頁版一致)
```

## 跑起來 / 出包

```bash
npm start            # expo start(開發)
npm run android      # 連 Android
npm run web          # 瀏覽器預覽

# 側載 APK(internal preview):
eas build --profile preview --platform android
# 正式(aab):
eas build --profile production --platform android
```

- 條文(個資/免責)不在 App 內,啟動時抓後端 `/api/v1/legal`(單一來源)+ 本地快取。
- AI 解讀已上線(`POST /api/v1/reading`,後端呼叫 Claude);解讀後可繼續聊(chat)與反思(reflection)。
- 待辦(社群登入/推播/金流)見 WORKLOG 與後端 `docs/SOCIAL_LOGIN_PLAN.md`。
