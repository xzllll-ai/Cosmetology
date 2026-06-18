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
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8">
      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">
        {hasComparison ? "📊 评分对比" : "📊 美学评分"}
      </h3>

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
  );
}
