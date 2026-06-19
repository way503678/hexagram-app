# 命卦排盤 App — 工作紀錄 / App 專屬背景

> **用途**:開新對話、接 App(hexagram-app)相關任務時讀這份。
> **共用背景**(專案速覽、解卦 prompt 設計原則、跨平台決策、總待辦)在**後端** repo:
> `/opt/hexagram/docs/WORKLOG.md` —— 這份只放 App 專屬的操作與紀錄,不重複共用內容。

最後更新:2026-06-19

---

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
