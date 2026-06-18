"use client";

interface Props {
  requirement: string;
}

export default function UserRequirement({ requirement }: Props) {
  if (!requirement) return null;

  return (
    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-6 border border-purple-100 dark:border-purple-800">
      <h3 className="font-bold text-purple-800 dark:text-purple-300 mb-2 flex items-center gap-2">
        <span>💡</span> 您的需求
      </h3>
      <p className="text-purple-700 dark:text-purple-200 leading-relaxed">{requirement}</p>
    </div>
  );
}
