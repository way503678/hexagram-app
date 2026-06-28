# 命果 MINGO App — 工作紀錄 / App 專屬背景

> **用途**:開新對話、接 App(hexagram-app)相關任務時讀這份。
> **共用背景**(專案速覽、解卦 prompt 設計原則、跨平台決策、總待辦)在**後端** repo:
> `/opt/hexagram/docs/WORKLOG.md` —— 這份只放 App 專屬的操作與紀錄,不重複共用內容。

最後更新:2026-06-28

---

## 0d. 首頁設計規範換色 + Cormorant(2026-06-29)

> 依使用者提供的「命果 設計規範」HTML 稿,套**配色 + 風格 + 排版**(中文字體不動、latin 載 Cormorant)。App + web 一起做(見後端 WORKLOG)。tab 結構不動(維持 3-tab,只換色)。

- **`theme.ts` 全面換色票**:暖米底 `bg #F1E9DC`(漸層 `gradients.page` `#F5EFE4→#E9E0D2`)、靜謐藍紫 `primary #6F5E9B`、`accent #8A79B3`、墨紫 `text #2C2942`、內文 `body #5D5675`、次要 `#6B6385`、淡紫 `faint #8C84A6`、導覽未選 `navIdle #9A93AD`、微光金 `gold #E9B34A`。新增 `gradients.primary/frosted`、圓角 `card 26/btn 22`、`shadowBtn`、`fonts.serif`。命理功能色不動。
- **`ui.tsx`**:`PrimaryButton` 改漸層填色(`gradients.primary` 135deg)+ 按鈕陰影 + 22 圓角。
- **`App.tsx`**:`useFonts` 載入 Cormorant(字體未就緒顯示 spinner);tab 未選色 → `navIdle`。
- **`HomeScreen.tsx`**:外層暖米漸層背景、今日指引改**霧面卡**(`gradients.frosted` + 亮邊 + 卡片陰影)、MINGO 走 Cormorant。
- **`WelcomeScreen`/`LoginScreen`**:MINGO 字樣套 Cormorant。
- **依賴**:`expo install expo-font @expo-google-fonts/cormorant-garamond`(SDK56 相容:expo-font ~14.0.12)。
- tsc 乾淨。**字體未驗於實機**(只過型別),下次 Expo 跑/build 確認 Cormorant 真的載到。

## 0a. App MVP v1.0 改版(2026-06-28 晚,留存導向)

> 理念:第一版驗證「會不會每天打開」,不是功能多寡。今日指引當主角、黃曆當依據。
> 做了 1–5,**跳過 6(遊客模式)、7(社群登入/購買果實金流)**(6 待與使用者討論)。

- **點數 → 果實**(全 App UI:剩餘果實/果實紀錄/扣 N 顆果實)。
- **3-tab 改版**:功能 / 首頁(中央凸起漸層鈕)/ 我的;外層 `Stack` 推黃曆、卜卦。
  - 新增 `FeaturesScreen`(今日黃曆/卜卦問事);`CastScreen` 改由 `route.params.mode` 取模式;`navTypes` 改 `RootStackParamList`(Tabs/Almanac/Cast)+ `RootTabParamList`(Features/Home/Member)。
- **首頁重設計**(`HomeScreen`):今日指引為主角(漸層 hero,接後端 `/api/v1/daily`;未設生日導去「我的」設定)+ 可展開今日黃曆卡(`AlmanacCard`:能量★/元素/宜/忌/白話/沖煞,接 `/api/v1/almanac/day`)+「開始今日探索」CTA。`useFocusEffect` 進頁刷新。
- **Splash + 同意書**(`SplashConsent`):首次開啟顯示 logo + 個資/免責(可展開)+「我已了解」;同意記到本機 `mingo_consent_v1`,之後不再出現。
- 後端:新增 `GET /api/v1/daily`(登入會員命盤對今日 analyze_daily,純引擎)。
- **待辦**:6 遊客模式(+ AI 每日 5 次限制,待討論)、7 Apple/Google 登入(待憑證)、購買果實(待綠界金流);我的頁細項(收藏/設定/關於)、黃曆吉時(day_info 暫無時辰資料)。

## 0b. 教練式解讀對等(2026-06-28 下午,Mingo 1.0)

- 解卦改「人生教練式」(後端 prompt v2.0,見後端 WORKLOG)。App 端對等:
  - `api.ts` `generateReading()` → 後端 `POST /api/v1/reading`(扣 1 點、後端呼叫 Claude、回完整解讀)。
  - `components/MingoReading.tsx`:依【標記】分段渲染(一句話=亮紫卡、陪你一句=金、易經原文/深入理論=可收合),與網頁 `renderMingo` 同邏輯。
  - `CastScreen`:主按鈕「✨ 命果為你解讀」→ 渲染解讀;原「複製 Prompt」降為次要選項。
- **Phase 2 完成**:`MingoChat`(解讀後繼續聊,`api.sendChat` → `/api/v1/chat`)。
- **Phase 3 完成**:`MingoReflect`(CastScreen 解讀後「最有感一句 → 本週小事」,`createReflection`);MemberScreen 到期回訪卡(`fetchDueReflections`/`markReflectionDone`)。回訪管道:站內 + Email(後端 dispatch)。

## 0. 換膚紀錄(2026-06-28)

- **改名「命果 MINGO」+ 換 MINGO 設計系統**(設計基準:`hexagram/docs/DESIGN_SYSTEM.md`)。
- `src/theme.ts`:MINGO 色票(primary `#5E548E`、accent 亮紫 `#A78BFA`、bg 米白 `#F7F4EE`、gold `#F6BD60`),加 `radius`/`gradients`/`shadowSoft`;**命理功能色保留**(moving/shi/ying/五行/紫白/擇日)。
- 新增 `src/components/ui.tsx`:`GradientCard`/`SectionCard`/`PillTag`/`PrimaryButton`/`GhostButton`/`IconRow`(需 `expo-linear-gradient`,已安裝)。
- `HomeScreen` 重做(品牌列+問候+漸層主視覺+今日指引卡);`LoginScreen` 品牌改命果 MINGO;`app.json` 改名;`FortunePanel` 舊紫→token;`legal.ts` 改名。
- **維持** React Navigation + StyleSheet(不改 Expo Router/NativeWind)。tab 結構不變(換膚階段);第二階段才疊新功能(AI 問答/今日指引詳情/探索/改 tab)。
- 內頁(Member/Cast/Almanac)靠 theme token 自動套色,漸層卡細修列為後續。

---

## 0c. 未登入啟動流程重整(2026-06-28 晚)

> 目標:落地頁只留 logo+slogan;首次彈同意書(按一次不再顯示);同意後才出登入/註冊入口;已登入直接進主頁。

- **`SplashConsent` → `WelcomeScreen`**(改名重做):品牌落地頁只有 ☯+命果+MINGO+slogan;首次開啟(本機 `mingo_consent_v1` 未設)自動彈**同意 Modal**(個資+免責,可展開);按「我已閱讀並同意」存旗標、關 modal;**同意後才顯示「登入 / 註冊新帳號」兩顆按鈕** → `onEnter(mode)`。
- **`LoginScreen`**:加 `initialMode`/`onBack`;**移除表單內的兩個 ConsentBlock 勾選**(同意已在落地頁完成),改一行小字「註冊即表示同意…」;底部加「← 返回」回落地頁。
- **`App.tsx` Root**:未登入流程改 `entry` state — `WelcomeScreen` →(選 mode)→ `LoginScreen`;consent gate 移進 Welcome 自管。**已登入(token 還原成功)直接進 Tabs**(本就如此)。
- **需求 5/6/7 本就滿足**:註冊成功即存 token+登入(AuthContext.register)、已登入直接進主頁、HomeScreen 已有今日黃曆卡(AlmanacCard)。
- tsc 乾淨。**未動社群登入**(待憑證);登入方式目前只有 Email,故落地頁只放「登入/註冊」兩顆,社群鈕待憑證再加。

## 一、App 速覽

- **路徑** `/opt/hexagram-app`,**技術** Expo SDK 56 / React Native / TypeScript。
- 是後端 web 的**對等行動版**(兩平台對等:改功能 web + app 都要做、功能要一樣)。
- 連線:App 連**後端的公開 HTTPS 網址**(非 localhost);設定見 `src/config.ts`。
- **⚠️ Expo 專屬坑(AGENTS.md)**:寫任何程式前,先讀對應版本的 Expo 文件
  `https://docs.expo.dev/versions/v56.0.0/`,API 常改。

## 二、結構

- 導覽:底部分頁 `App.tsx`(首頁 / 萬年曆 / 卜卦問事 🪙 / 命盤排卦 🕐 / 會員)。
- 畫面 `src/screens/`:Home、Almanac、Cast(coin/time 兩模式共用)、Login、Member。
- 共用:`api.ts`(後端 API)、`AuthContext.tsx`(登入)、`divination.ts`(client 端金錢卦)、
  `components/`(ChartResult、FortunePanel)。

## 三、build / run（與後端 docker 完全不同)

```bash
cd /opt/hexagram-app
npm start            # expo start(開發,Expo Go 掃碼)
npm run android      # 連 Android
npm run web          # 瀏覽器預覽

# 出側載 APK(internal preview):
eas build --profile preview --platform android
# 正式版(aab,autoIncrement):
eas build --profile production --platform android
```
- build profile 在 `eas.json`:`preview` 出 APK、`production` 出 app-bundle。
- **App 沒有 docker、沒有 localhost:8080**;部署 = Expo/EAS,不要套後端的 `deploy-verify` skill。

## 四、工作日誌(新到舊)

### 2026-06-19
- 本輪後端工作(下拉 tab 還原、prompt v1.1~v1.3)**未動 App**;App 維持上一版。

### 先前(摘要,詳見 git log)
- 忘記密碼(寄重設信,連結走網頁)`fbd00df`
- 會員功能:我的紀錄、改密碼、刪帳號;密碼政策 8 碼+英數 `15bb437`
- Android 建置設定 + `eas.json`(preview 出 APK)`2140760`
- 流年宜忌 FortunePanel、會員中心、個資同意書 等。

## 五、App 專屬待辦

> 跨平台/共用待辦(社群登入、Email、綠界…)在後端 WORKLOG 的總待辦,不在這重複。

- [ ] **卜卦問事補「下拉手動輸入」模式**:對齊 web(web 已有,且設為管理者專用/自用)。
      App 目前只有擲卦動畫;若要做,用 Picker/按鈕選每爻(少陽/少陰/老陽/老陰),同步送出的 y0~y5。
      (使用者目前說先只要 web,暫緩。)
- [ ] **推播通知**:expo-notifications + Expo Push,需存使用者 push token。
