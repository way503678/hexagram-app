import { API_BASE_URL, API_TIMEOUT_MS } from "./config";
import { ChartResponse, AlmanacMonth, FortuneResult } from "./types";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * 目前登入 token(由 AuthContext 設定)。設定後,所有 API 請求都會自動
 * 夾帶 Authorization: Bearer <token>,後端據此辨識會員身分。
 */
let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

/** 組裝請求標頭,有 token 就帶上 Authorization。 */
function authHeaders(base: Record<string, string> = {}): Record<string, string> {
  return authToken ? { ...base, Authorization: `Bearer ${authToken}` } : base;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        (data && (data as { error?: string }).error) || `HTTP ${res.status}`;
      throw new ApiError(msg, res.status);
    }
    return data as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (e instanceof Error && e.name === "AbortError") {
      throw new ApiError("連線逾時,請確認後端位址與網路", 0);
    }
    throw new ApiError("無法連線到伺服器,請確認 API 位址", 0);
  } finally {
    clearTimeout(timer);
  }
}

export interface ChartRequest {
  y: number;
  m: number;
  d: number;
  h: number;
  yao_vals: string[]; // 6 個,初爻→上爻,格式 "陰陽,動否"
  aspect?: string;
}

/** 排盤(手動擲卦):送出日期 + 六爻,取得完整卦象。 */
export function castChart(req: ChartRequest): Promise<ChartResponse> {
  return postJson<ChartResponse>("/api/v1/chart", {
    aspect: "all",
    ...req,
  });
}

export interface TimeCastRequest {
  y: number;
  m: number;
  d: number;
  h: number;
  name?: string; // 姓名(存歷史紀錄用)
  gender?: "M" | "F" | ""; // 性別
  aspect?: string;
}

/** 時辰起卦:只送日期時間,依時辰自動起卦。 */
export function castByTime(req: TimeCastRequest): Promise<ChartResponse> {
  return postJson<ChartResponse>("/api/v1/cast", {
    aspect: "all",
    ...req,
  });
}

export interface PromptRequest extends ChartRequest {
  question: string; // 所問之事(必填)
}

/** 組裝可複製的 AI 解讀 Prompt(需登入,扣 1 點;不呼叫 Claude)。回傳含扣點後餘額。 */
export function buildPrompt(
  req: PromptRequest
): Promise<{ prompt: string; balance: number }> {
  return postJson<{ prompt: string; balance: number }>("/api/v1/prompt", {
    aspect: "all",
    ...req,
  });
}

async function getJson<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: authHeaders(),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = (data && (data as { error?: string }).error) || `HTTP ${res.status}`;
      throw new ApiError(msg, res.status);
    }
    return data as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError("無法連線到伺服器,請確認網路", 0);
  } finally {
    clearTimeout(timer);
  }
}

/** 取得整月萬年曆。 */
export function fetchAlmanacMonth(y: number, m: number): Promise<AlmanacMonth> {
  return getJson<AlmanacMonth>(`/api/v1/almanac/month?y=${y}&m=${m}`);
}

/** 流年分析:出生 y/m/d/h + 性別 + 目標年。 */
export function fetchFortune(
  birth: { y: number; m: number; d: number; h: number },
  gender: "M" | "F" | "",
  year: number
): Promise<FortuneResult> {
  const g = gender ? `&gender=${gender}` : "";
  return getJson<FortuneResult>(
    `/api/v1/fortune?y=${birth.y}&m=${birth.m}&d=${birth.d}&h=${birth.h}&year=${year}${g}`
  );
}

/** 健康檢查(設定頁可用來測連線)。 */
export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/health`);
    return res.ok;
  } catch {
    return false;
  }
}

// ============================================================
// 會員登入
// ============================================================
export interface User {
  id: number;
  auth_provider: string;
  display_name: string | null;
  email: string | null;
  points_balance: number;
  created_at: string | null;
}

export interface AuthResult {
  token: string;
  user: User;
}

/** Email 註冊。成功回傳 token + 會員資料(後端會送新會員贈點)。
 *  agreed=true 代表已同意個資同意書 + 免責聲明(App 端按鈕已鎖,送出時必為 true)。 */
export function registerEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<AuthResult> {
  return postJson<AuthResult>("/api/v1/auth/register", {
    email,
    password,
    display_name: displayName,
    agreed: true,
  });
}

/** Email 登入。成功回傳 token + 會員資料。 */
export function loginEmail(email: string, password: string): Promise<AuthResult> {
  return postJson<AuthResult>("/api/v1/auth/login", { email, password });
}

/** 憑目前 token 取會員資料(含最新點數)。token 失效會丟 ApiError(401)。 */
export function fetchMe(): Promise<{ user: User }> {
  return getJson<{ user: User }>("/api/v1/auth/me");
}

export interface LedgerEntry {
  delta: number;
  balance_after: number;
  reason: string;
  ref: string | null;
  created_at: string | null;
}

/** 目前會員的點數異動紀錄(新到舊)。 */
export function fetchLedger(): Promise<{ ledger: LedgerEntry[] }> {
  return getJson<{ ledger: LedgerEntry[] }>("/api/v1/member/ledger");
}
