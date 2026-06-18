"use client";

interface Props {
  requirement: string;
}

export default function UserRequirement({ requirement }: Props) {
  if (!requirement) return null;

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/15 dark:to-pink-900/10 rounded-3xl p-6 md:p-7 border border-purple-100/50 dark:border-purple-800/30 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
          <span className="text-white text-sm">💡</span>
        </div>
        <div className="space-y-2 flex-1">
          <h3 className="font-bold text-purple-800 dark:text-purple-300 text-sm">您的需求</h3>
          <div className="relative">
            <span className="absolute -top-1 -left-1 text-3xl text-purple-200 dark:text-purple-700 select-none leading-none" aria-hidden="true">"</span>
            <p className="text-purple-700 dark:text-purple-200 leading-relaxed pl-4 pt-1 text-sm">{requirement}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
