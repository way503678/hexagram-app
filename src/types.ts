/**
 * 後端 /api/v1/chart 回傳的卦象型別。
 * 對應 Flask _compute_chart 的 chart_payload(用中文 key 與後端一致)。
 */

/** 伏神(本卦缺六親時,從卦宮借來的爻)。 */
export interface FuShen {
  六親: string;
  地支: string;
  天干: string;
  干支: string;
}

/** 單一爻(本卦/變卦內)。 */
export interface Yao {
  世: boolean;
  應: boolean;
  五行: string;
  伏神: FuShen[];
  六神: string;
  六親: string;
  動爻: boolean;
  地支: string;
  天干: string;
  干支: string;
  爻序index: number;
  爻序名: string; // 初爻..上爻
  爻象: string; // ─── / ── ──
  神煞: string;
  陰陽: "陽" | "陰";
}

/** 本卦 / 變卦。 */
export interface Gua {
  上卦: string;
  下卦: string;
  世爻五行: string;
  卦名: string;
  卦宮: string;
  卦宮五行: string;
  卦變: string;
  卦辭: string;
  爻: Yao[];
}

export interface SiZhu {
  年: string;
  月: string;
  日: string;
  時: string;
}

export interface DongYao {
  indices: number[];
  描述: string;
}

export interface ChartInner {
  公曆: string;
  動爻: DongYao;
  卦變總論: string | null;
  四柱: SiZhu;
  日干支: string;
  時辰: string;
  本卦: Gua;
  變卦: Gua | null;
  起卦法: string;
  農曆: string;
}

/** 「對六爻」每一爻的生剋/旺衰素材(由初爻到上爻)。 */
export interface LiuYaoEntry {
  index: number;
  世: boolean;
  應: boolean;
  五行: string;
  伏神: FuShen[];
  六神: string;
  六親: string;
  動爻: boolean;
  動爻出去?: {
    五行: string;
    六親: string;
    合沖: string;
    地支: string;
    干支: string;
    生剋: string;
  };
  合沖: string;
  地支: string;
  干支: string;
  爻序index: number;
  爻序名: string;
  生剋: string;
  當值: string;
  空亡: boolean;
  陰陽: "陽" | "陰";
}

/** /api/v1/chart 完整回應。 */
export interface ChartResponse {
  schema_version: number;
  排盤時間: string;
  問事類別: string;
  卦象: ChartInner;
  旬空: string[];
  對六爻: LiuYaoEntry[];
}

/** 一個爻的擲卦結果(client 端金錢卦)。 */
export interface CastYao {
  /** 後端格式 "陰陽,動否":1,0=少陽 0,0=少陰 1,1=老陽動 0,1=老陰動 */
  val: string;
  陰陽: "陽" | "陰";
  動: boolean;
  symbol: string;
  name: string;
}
