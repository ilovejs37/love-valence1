import React from 'react';
import { Heart, Sparkles, RefreshCw } from 'lucide-react';

interface HeaderProps {
  currentStep: number;
  totalSteps: number;
  onReset?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentStep, totalSteps, onReset }) => {
  const stepTitles = [
    '나 알아보기',
    '이상형 조건',
    '100점 경매',
    '가상 프로필 선택',
    'AI 시뮬레이션',
    '매칭 분석 리포트',
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-rose-100 shadow-xs">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand Title */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={onReset}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-rose-200">
            <Heart className="w-5 h-5 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 id="app-title-header" className="font-bold text-lg text-slate-900 tracking-tight">
                LOVE BALANCE
              </h1>
              <span className="bg-rose-100 text-rose-700 text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-0.5">
                <Sparkles className="w-3 h-3" /> AI Match
              </span>
            </div>
            <p className="text-xs text-slate-500">배우자 선택 성향 & 쌍방 매칭 시뮬레이터</p>
          </div>
        </div>

        {/* Action Button */}
        {currentStep > 1 && onReset && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600 transition-colors bg-slate-100 hover:bg-rose-50 px-3 py-1.5 rounded-lg"
            title="처음부터 다시하기"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>다시하기</span>
          </button>
        )}
      </div>

      {/* Progress Bar & Breadcrumbs */}
      {currentStep <= totalSteps && (
        <div className="bg-slate-50 border-t border-slate-100 px-4 py-2">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center text-xs mb-1 font-medium">
              <span className="text-rose-600 font-bold">
                STEP {currentStep}. {stepTitles[currentStep - 1]}
              </span>
              <span className="text-slate-400">
                {currentStep} / {totalSteps} 단계
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-rose-500 to-pink-500 h-full transition-all duration-300 ease-out"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
