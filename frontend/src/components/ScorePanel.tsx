"use client";

import type { ScoreResult, SubDimensionScore } from "@/types";
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

  return (
    <div className="bg-white dark:bg-gray-800/80 rounded-3xl shadow-xl shadow-pink-500/5 border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="bg-gradient-to-r from-pink-500/5 to-purple-600/5 dark:from-pink-500/10 dark:to-purple-600/10 px-6 md:px-8 py-5 border-b border-gray-50 dark:border-gray-700">
        <div className="flex items-center justify-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white text-sm">📊</span>
          </div>
          <h3 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-purple-600 dark:from-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
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

        {/* 子维度 */}
        {subDimensionScores && subDimensionScores.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
            <SubDimensionScoreList scores={subDimensionScores} />
          </div>
        )}
      </div>
    </div>
  );
}
