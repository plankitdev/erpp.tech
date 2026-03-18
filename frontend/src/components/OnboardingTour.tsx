import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Sparkles, Rocket } from 'lucide-react';

interface TourStep {
  target: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
  { target: '[data-tour="dashboard"]', title: 'لوحة التحكم', content: 'هنا تجد نظرة شاملة على أداء شركتك - الإيرادات، المهام، العملاء، والمزيد.', position: 'bottom' },
  { target: '[data-tour="sidebar"]', title: 'القائمة الجانبية', content: 'تصفح الأقسام المختلفة: العملاء، المشاريع، المالية، الموارد البشرية، والنظام.', position: 'right' },
  { target: '[data-tour="search"]', title: 'البحث السريع', content: 'استخدم Ctrl+K للبحث السريع في أي شيء - عملاء، مهام، فواتير، والمزيد.', position: 'bottom' },
  { target: '[data-tour="notifications"]', title: 'الإشعارات', content: 'ستصلك إشعارات فورية عن المهام المسندة، الفواتير المتأخرة، وتحديثات المشاريع.', position: 'bottom' },
  { target: '[data-tour="fab"]', title: 'الإنشاء السريع', content: 'اضغط على هذا الزر لإنشاء عميل، مهمة، فاتورة، أو مشروع جديد بسرعة.', position: 'top' },
];

const TOOLTIP_W = 320;
const TOOLTIP_H = 200;
const GAP = 12;
const EDGE_PAD = 16;

function clampToViewport(style: { top: number; left: number }) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return {
    top: Math.max(EDGE_PAD, Math.min(style.top, vh - TOOLTIP_H - EDGE_PAD)),
    left: Math.max(EDGE_PAD, Math.min(style.left, vw - TOOLTIP_W - EDGE_PAD)),
  };
}

function calcTooltipPos(pos: 'top' | 'bottom' | 'left' | 'right' | undefined, rect: { top: number; left: number; width: number; height: number }) {
  let top: number, left: number;
  const centerX = rect.left + rect.width / 2 - TOOLTIP_W / 2;
  const centerY = rect.top + rect.height / 2 - TOOLTIP_H / 2;

  switch (pos) {
    case 'top':
      top = rect.top - TOOLTIP_H - GAP;
      left = centerX;
      break;
    case 'left':
      top = centerY;
      left = rect.left - TOOLTIP_W - GAP;
      break;
    case 'right':
      top = centerY;
      left = rect.left + rect.width + GAP;
      break;
    case 'bottom':
    default:
      top = rect.top + rect.height + GAP;
      left = centerX;
      break;
  }

  return clampToViewport({ top, left });
}

export default function OnboardingTour() {
  const [isActive, setIsActive] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('erpflex_tour_completed');
    if (!hasSeenTour) {
      const timer = setTimeout(() => setShowWelcome(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const startTour = useCallback(() => {
    setShowWelcome(false);
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const skipTour = useCallback(() => {
    setShowWelcome(false);
    localStorage.setItem('erpflex_tour_completed', 'true');
  }, []);

  useEffect(() => {
    if (!isActive) return;
    const step = tourSteps[currentStep];
    const element = document.querySelector(step.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      setPosition({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentStep, isActive]);

  const next = () => {
    if (currentStep < tourSteps.length - 1) setCurrentStep(s => s + 1);
    else finish();
  };

  const prev = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  };

  const finish = () => {
    setIsActive(false);
    localStorage.setItem('erpflex_tour_completed', 'true');
  };

  // Welcome dialog
  if (showWelcome) {
    return (
      <>
        <div className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm" onClick={skipTour} />
        <div className="fixed z-[10000] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center" dir="rtl">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30">
            <Rocket size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">مرحباً بك في ERPFlex!</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">هل تحب نأخذ جولة سريعة نشرحلك فيها أساسيات النظام؟ مش هتاخد أكتر من دقيقة.</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={startTour}
              className="w-full py-3 bg-gradient-to-l from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md shadow-blue-500/25 flex items-center justify-center gap-2"
            >
              <Sparkles size={18} />
              يلا نبدأ الجولة
            </button>
            <button
              onClick={skipTour}
              className="w-full py-3 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl text-sm transition-all"
            >
              تخطي، أنا عارف النظام
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!isActive) return null;

  const step = tourSteps[currentStep];
  const tooltipPos = calcTooltipPos(step.position, position);

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[9998]" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={finish} />

      {/* Spotlight */}
      <div
        className="fixed z-[9999] rounded-xl transition-all duration-300 ease-out"
        style={{
          top: position.top - 6,
          left: position.left - 6,
          width: position.width + 12,
          height: position.height + 12,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.55), 0 0 20px 4px rgba(59,130,246,0.3)',
          pointerEvents: 'none',
        }}
      />

      {/* Tooltip */}
      <div
        className="fixed z-[10000] bg-white rounded-2xl shadow-2xl p-5 transition-all duration-300 ease-out"
        style={{ top: tooltipPos.top, left: tooltipPos.left, width: TOOLTIP_W }}
        dir="rtl"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Sparkles size={16} className="text-blue-500" />
            </div>
            <span className="font-bold text-gray-800">{step.title}</span>
          </div>
          <button onClick={finish} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><X size={16} className="text-gray-400" /></button>
        </div>
        <p className="text-sm text-gray-600 mb-5 leading-relaxed pr-1">{step.content}</p>
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {tourSteps.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'bg-blue-500 w-6' : 'bg-gray-200 w-1.5'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <button onClick={prev} className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronRight size={14} /> السابق
              </button>
            )}
            <button onClick={next} className="flex items-center gap-1 px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm">
              {currentStep === tourSteps.length - 1 ? 'إنهاء الجولة' : 'التالي'} <ChevronLeft size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Export restart function for settings
export function resetTour() {
  localStorage.removeItem('erpflex_tour_completed');
  window.location.reload();
}
