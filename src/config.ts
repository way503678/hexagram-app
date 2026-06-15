/**
 * App 全域設定。
 *
 * API_BASE_URL:後端 Flask 服務位址。
 *   - iOS 模擬器要連得到這台後端。本機 LAN 部署時填這台伺服器的區網 IP。
 *   - 若之後架了 Cloudflare Tunnel / 反向代理(https 網域),改成該網域即可。
 *   - 注意:Apple 預設 App Transport Security 會擋 http(非 https)。
 *     開發階段連 LAN 的 http 可暫時放行(見 app.json 的 ATS 設定);
 *     正式上架務必走 https。
 */
export const API_BASE_URL = "https://hexagram.johnsonwebsites.cc";

/** 單次 API 逾時(毫秒)。排盤很快;解讀(串流)另計。 */
export const API_TIMEOUT_MS = 15000;
