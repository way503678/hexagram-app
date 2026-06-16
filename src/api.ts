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

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

/** 組裝可複製的 AI 解讀 Prompt(免費、不呼叫 Claude)。 */
export function buildPrompt(req: PromptRequest): Promise<{ prompt: string }> {
  return postJson<{ prompt: string }>("/api/v1/prompt", {
    aspect: "all",
    ...req,
  });
}

async function getJson<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, { signal: controller.signal });
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
