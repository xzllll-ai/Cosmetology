import type {
  AdviceCategory,
  CategorizedAdviceItem,
  SubDimensionScore,
  AdvicePriority,
  Advice,
  ScoreResult,
} from "@/types";

// ─── 关键词 → 分类映射 ──────────────────────────────

const CATEGORY_KEYWORDS: Record<AdviceCategory, string[]> = {
  skin: ["皮肤", "肤质", "毛孔", "光泽", "色素", "色斑", "屏障", "痘", "皱纹", "细纹", "水光", "嫩肤", "弹性", "松弛"],
  contour: ["轮廓", "下颌", "紧致", "脸型", "线条", "v脸", "面部轮廓", "提拉", "下垂", "松弛", "射频", "超声", "热玛吉"],
  color: ["色泽", "美白", "暗沉", "泛红", "提亮", "肤色", "色素沉着", "均匀", "红斑", "黄气", "透亮"],
  proportion: ["比例", "对称", "协调", "五官", "三庭", "五眼", "眉眼间距", "鼻梁", "唇形", "眼型"],
  other: [],
};

const CATEGORY_WEIGHTS: Record<AdviceCategory, number> = {
  skin: 4,
  contour: 3,
  color: 2,
  proportion: 1,
  other: 0,
};

// ─── 优先级关键词 ────────────────────────────────────

const HIGH_PRIORITY: string[] = ["核心", "主要问题", "必须", "强烈建议", "重要", "显著", "严重"];
const MEDIUM_PRIORITY: string[] = ["建议", "可考虑", "推荐", "可以尝试", "适合"];
const LOW_PRIORITY: string[] = ["可以", "也可", "若希望", "如果", "作为补充"];

function detectPriority(text: string): AdvicePriority {
  for (const kw of HIGH_PRIORITY) if (text.includes(kw)) return "high";
  for (const kw of MEDIUM_PRIORITY) if (text.includes(kw)) return "medium";
  for (const kw of LOW_PRIORITY) if (text.includes(kw)) return "low";
  return "medium";
}

function detectCategory(text: string): AdviceCategory {
  let best: AdviceCategory = "other";
  let bestWeight = -1;
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS) as [AdviceCategory, string[]][]) {
    if (cat === "other") continue;
    const weight = kws.reduce((w, kw) => w + (text.includes(kw) ? 1 : 0), 0);
    if (weight > bestWeight) {
      bestWeight = weight;
      best = cat;
    }
  }
  return best;
}

// ─── 清理文本 ────────────────────────────────────────

/** 从 Qwen 裂文本中清理出纯内容（去掉列表标记、**标记、section 标题等） */
function cleanItem(text: string): string {
  return text
    .replace(/^[-•·*]\s*/, "")
    .replace(/^\d+[.、）)]\s*/, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^###\s+\d+\.\s*/, "")
    .replace(/：$/, "")
    .trim();
}

/** 从 **xxx** 标题格式中提取子标题 */
function extractSubheading(text: string): string | null {
  const m = text.match(/^\*\*(.*?)\*\*/);
  return m ? m[1] : null;
}

// ─── 文本分段解析 ────────────────────────────────────

interface Section {
  heading: string;
  lines: string[];
}

function splitSections(text: string): Section[] {
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const line of text.split("\n")) {
    const trimmed = line.trim();

    if (trimmed.startsWith("### ")) {
      if (current) sections.push(current);
      const heading = trimmed.replace(/^###\s+\d+\.?\s*/, "").trim();
      current = { heading, lines: [] };
    } else if (current) {
      current.lines.push(trimmed);
    }
  }
  if (current) sections.push(current);
  return sections;
}

/** 从 markdown 段落行中提取列表项 */
function extractItems(lines: string[], skipIfContains?: string[]): string[] {
  const items: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === "---") continue;
    if (trimmed.startsWith("### ")) continue;
    if (skipIfContains?.some((s) => trimmed.includes(s))) continue;

    const cleaned = cleanItem(trimmed);
    if (cleaned && cleaned.length > 4) {
      items.push(cleaned);
    }
  }
  return items;
}

// ─── 主解析函数 ──────────────────────────────────────

export interface ParsedAdvice {
  items: CategorizedAdviceItem[];
  categories: AdviceCategory[];
  categoryCounts: Record<AdviceCategory, number>;
}

export function parseAdvice(advice: Advice): ParsedAdvice {
  const items: CategorizedAdviceItem[] = [];
  let idCounter = 0;

  // 1. 优先从 full_text 按结构化 markdown 解析
  if (advice.full_text) {
    const sections = splitSections(advice.full_text);

    for (const section of sections) {
      const h = section.heading;

      // 跳过明显的 section 标题行
      if (h.includes("风险")) {
        // risk_notes → all "other" + "high" priority
        for (const line of section.lines) {
          const text = cleanItem(line);
          if (text && text.length > 4 && !text.startsWith("所有") && !text.startsWith("本建议")) {
            items.push({
              id: `risk-${idCounter++}`,
              text,
              category: "other",
              priority: "high",
              source: "risk_note",
            });
          }
        }
        continue;
      }

      if (h.includes("建议") || h.includes("方案")) {
        // 建议 section 可能有子标题: **皮肤状态改善**: text
        let currentSub = "";
        for (const line of section.lines) {
          const sub = extractSubheading(line);
          if (sub) {
            currentSub = sub;
            // Also extract the text after the bold heading
            const afterBold = line.replace(/\*\*.*?\*\*[：:]\s*/, "").trim();
            if (afterBold && afterBold.length > 4) {
              items.push({
                id: `adv-${idCounter++}`,
                text: afterBold,
                category: detectCategory(currentSub + " " + afterBold),
                priority: detectPriority(afterBold),
                source: "suggestion",
              });
            }
          } else {
            const text = cleanItem(line);
            if (text && text.length > 4) {
              items.push({
                id: `adv-${idCounter++}`,
                text,
                category: detectCategory(currentSub + " " + text),
                priority: detectPriority(text),
                source: "suggestion",
              });
            }
          }
        }
        continue;
      }

      if (h.includes("优点") || h.includes("优势")) {
        for (const line of section.lines) {
          const text = cleanItem(line);
          if (text && text.length > 4) {
            items.push({
              id: `str-${idCounter++}`,
              text,
              category: detectCategory(text),
              priority: "low",
              source: "strength",
            });
          }
        }
        continue;
      }

      if (h.includes("不足") || h.includes("改善") || h.includes("可改善")) {
        for (const line of section.lines) {
          const text = cleanItem(line);
          if (text && text.length > 4) {
            items.push({
              id: `weak-${idCounter++}`,
              text,
              category: detectCategory(text),
              priority: "high",
              source: "weakness",
            });
          }
        }
        continue;
      }
    }
  }

  // 2. Fallback: 从结构化字段解析
  if (items.length === 0) {
    for (const s of advice.strengths || []) {
      const text = cleanItem(s);
      if (text && text.length > 4) {
        items.push({ id: `str-fb-${idCounter++}`, text, category: detectCategory(text), priority: "low", source: "strength" });
      }
    }
    for (const w of advice.weaknesses || []) {
      const text = cleanItem(w);
      if (text && text.length > 4) {
        items.push({ id: `weak-fb-${idCounter++}`, text, category: detectCategory(text), priority: "high", source: "weakness" });
      }
    }
    for (const sug of advice.medical_aesthetic_suggestions || []) {
      const text = cleanItem(sug);
      if (text && text.length > 4) {
        items.push({ id: `adv-fb-${idCounter++}`, text, category: detectCategory(text), priority: detectPriority(text), source: "suggestion" });
      }
    }
  }

  // 3. 去重（相邻相似文本）
  const seen = new Set<string>();
  const deduped: CategorizedAdviceItem[] = [];
  for (const item of items) {
    const key = item.text.slice(0, 20);
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(item);
    }
  }

  const categories: AdviceCategory[] = [];
  const seenCat = new Set<string>();
  for (const item of deduped) {
    if (!seenCat.has(item.category)) {
      seenCat.add(item.category);
      categories.push(item.category);
    }
  }
  const categoryCounts = {} as Record<AdviceCategory, number>;
  for (const c of categories) categoryCounts[c] = deduped.filter((i) => i.category === c).length;

  return { items: deduped, categories, categoryCounts };
}

// ─── 子维度分数估算 ──────────────────────────────────

export interface ParsedSubDimensions {
  dimensions: SubDimensionScore[];
  hasRealScores: boolean;
}

/**
 * 通过分析 full_text 中各维度的提及密度，估算子维度得分。
 * 当后端暂未返回真实子维度分数时作为占位展示。
 */
export function estimateSubDimensionScores(
  originalScore: ScoreResult,
  advice: Advice
): ParsedSubDimensions {
  const text = advice.full_text || "";
  const dimensions: SubDimensionScore[] = [];

  const dimDefs: { name: string; label: string; keywords: string[] }[] = [
    { name: "skin", label: "皮肤状态", keywords: ["皮肤", "肤质", "毛孔", "光泽", "皱纹", "细纹", "弹性", "色素", "色斑"] },
    { name: "contour", label: "轮廓线条", keywords: ["轮廓", "下颌", "紧致", "脸型", "线条", "下垂", "松弛", "立体"] },
    { name: "color", label: "色泽质感", keywords: ["色泽", "美白", "暗沉", "泛红", "提亮", "肤色", "均匀", "透亮"] },
    { name: "proportion", label: "五官比例", keywords: ["比例", "对称", "协调", "五官", "三庭", "眼型", "唇形", "鼻"] },
  ];

  for (const def of dimDefs) {
    let hits = 0;
    for (const kw of def.keywords) {
      const regex = new RegExp(kw, "g");
      const matches = text.match(regex);
      if (matches) hits += matches.length;
    }

    // Map hits to a score offset from the original score
    // More positive mentions → higher score, more negative context → lower
    // Simple heuristic: if mentioned a lot, it's a notable feature
    let score = originalScore.score;
    if (hits >= 5) score = Math.min(5, score + 0.3);
    else if (hits >= 3) score = Math.min(5, score + 0.1);
    else if (hits >= 1) score = score;
    else score = Math.max(1, score - 0.2);

    score = Math.round(score * 100) / 100;

    const description = hits >= 4 ? "重点关注维度" : hits >= 2 ? "一般关注维度" : "较少提及";
    dimensions.push({ name: def.name, label: def.label, score, description });
  }

  return { dimensions, hasRealScores: false };
}

// ─── 建议过滤 ────────────────────────────────────────

export function filterAdviceItems(
  items: CategorizedAdviceItem[],
  activeCategory: AdviceCategory | "all",
  priorityFilter: AdvicePriority | "all"
): CategorizedAdviceItem[] {
  return items.filter((item) => {
    if (activeCategory !== "all" && item.category !== activeCategory) return false;
    if (priorityFilter !== "all" && item.priority !== priorityFilter) return false;
    return true;
  });
}
