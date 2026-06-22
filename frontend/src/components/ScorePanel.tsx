"use client";

import type { ScoreResult, SubDimensionScore, ScoreDimension } from "@/types";
import ScoreDisplay from "@/components/ScoreDisplay";
import ScoreComparisonBar from "@/components/ScoreComparisonBar";
import SubDimensionScoreList from "@/components/SubDimensionScoreList";

interface Props {
  originalScore: ScoreResult;
  generatedScore?: ScoreResult;
  scoreDiff?: number;
  subDimensionScores?: SubDimensionScore[];
}

export default function ScorePanel({
  originalScore,
  generatedScore,
  scoreDiff,
  subDimensionScores,
}: Props) {
  const hasComparison = generatedScore !== undefined;

  // 构建用于子维度展示的数据
  // 优先从后端返回的 real dimensions 取，否则用 subDimensionScores
  const originalDims: SubDimensionScore[] = (() => {
    if (originalScore.dimensions?.length) {
      return originalScore.dimensions.map((d) => ({
        name: d.name,
        label: d.name,
        score: d.score,
        level: d.level,
      }));
    }
    return subDimensionScores ?? [];
  })();

  const generatedDims: SubDimensionScore[] | undefined = (() => {
    if (!generatedScore) return undefined;
    if (generatedScore.dimensions?.length) {
      return generatedScore.dimensions.map((d) => ({
        name: d.name,
        label: d.name,
        score: d.score,
        level: d.level,
      }));
    }
    return subDimensionScores?.map((d) => ({
      ...d,
      name: d.name,
    }));
  })();

  return (
    <div className="bg-white dark:bg-gray-800/80 rounded-3xl shadow-xl shadow-pink-500/5 border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="bg-gradient-to-r from-pink-500/5 to-purple-600/5 dark:from-pink-500/10 dark:to-purple-600/10 px-6 md:px-8 py-5 border-b border-gray-50 dark:border-gray-700">
        <div className="flex items-center justify-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white text-sm">📊</span>
          </div>
          <h3 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-purple-600 dark:from-pink-400 dark:-purple-400 bg-clip-text text-transparent">
            {hasComparison ? "评分对比" : "美学评分"}
          </h3>
        </div>
      </div>

      <div className="p-6 md:p-8">
        <div className={`flex ${hasComparison ? "flex-col md:flex-row md:items-start" : "flex-col items-center"} gap-8`}>
          {/* 环形分 */}
          <div className="flex shrink-0 gap-6">
            <ScoreDisplay label="原始照片" score={originalScore} />
            {generatedScore && (
              <ScoreDisplay label="AI 效果图" score={generatedScore} color="#a855f7" />
            )}
          </div>

          {/* 对比条 */}
          <div className="flex-1 w-full">
            <ScoreComparisonBar
              originalScore={originalScore}
              generatedScore={generatedScore}
              scoreDiff={scoreDiff}
            />
          </div>
        </div>

        {/* 子维度：原始 + 效果对比 */}
        {(originalDims.length > 0 || subDimensionScores) && (
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
            <SubDimensionScoreList
              scores={originalDims.length ? originalDims : (subDimensionScores ?? [])}
              generatedScores={generatedDims}
            />
          </div>
        )}
      </div>
    </div>
  );
}
