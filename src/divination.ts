import { CastYao, ChartResponse } from "./types";

/**
 * 金錢卦擲一爻:三枚銅板,背=陽(1)、字=陰(0)。
 *   三背   = 老陽(動,變陰)  val "1,1"
 *   兩背一字 = 少陽           val "1,0"
 *   兩字一背 = 少陰           val "0,0"
 *   三字   = 老陰(動,變陽)  val "0,1"
 * 與後端 manual.html 的擲卦規則一致。
 */
export function castOneYao(): CastYao {
  const coins = [tossCoin(), tossCoin(), tossCoin()];
  const yang = coins[0] + coins[1] + coins[2];
  if (yang === 0) {
    return { val: "0,1", 陰陽: "陰", 動: true, symbol: "─ ✕ ─", name: "老陰(動)" };
  }
  if (yang === 1) {
    return { val: "1,0", 陰陽: "陽", 動: false, symbol: "─────", name: "少陽" };
  }
  if (yang === 2) {
    return { val: "0,0", 陰陽: "陰", 動: false, symbol: "── ──", name: "少陰" };
  }
  return { val: "1,1", 陰陽: "陽", 動: true, symbol: "─ ○ ─", name: "老陽(動)" };
}

function tossCoin(): 0 | 1 {
  // 0 = 字(陰),1 = 背(陽)
  return Math.random() < 0.5 ? 0 : 1;
}

/** 爻序名(由初爻到上爻,index 0..5)。 */
export const YAO_NAMES = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"];

/**
 * 從(時辰起卦得到的)卦象反推 yao_vals "陰陽,動否",由初爻到上爻。
 * 讓時辰模式也能用同一支 /api/v1/prompt 產生 AI 解讀 Prompt。
 */
export function yaoValsFromChart(chart: ChartResponse): string[] {
  // 用每個爻自己的「動爻」布林(手動卦與時辰卦的頂層動爻結構不同,逐爻最穩)
  const yaos = [...chart.卦象.本卦.爻].sort(
    (a, b) => a.爻序index - b.爻序index
  );
  return yaos.map((y) => `${y.陰陽 === "陽" ? 1 : 0},${y.動爻 ? 1 : 0}`);
}
