import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface TourStep {
  target: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
  { target: '[data-tour="dashboard"]', title: 'لوحة التحكم', content: 'هنا تجد نظرة شاملة على أداء شركتك - الإيرادات، المهام، العملاء، والمزيد.', position: 'bottom' },
  { target: '[data-tour="sidebar"]', title: 'القائمة الجانبية', content: 'تصفح الأقسام المختلفة: العملاء، المشاريع، المالية، الموارد البشرية، والنظام.', position: 'left' },
  { target: '[data-tour="search"]', title: 'البحث السريع', content: 'استخدم Ctrl+K للبحث السريع في أي شيء - عملاء، مهام، فواتير، والمزيد.', position: 'bottom' },
  { target: '[data-tour="notifications"]', title: 'الإشعارات', content: 'ستصلك إشعارات فورية عن المهام المسندة، الفواتير المتأخرة، وتحديثات المشاريع.', position: 'bottom' },
  { target: '[data-tour="fab"]', title: 'الإنشاء السريع', content: 'اضغط على هذا الزر لإنشاء عميل، مهمة، فاتورة، أو مشروع جديد بسرعة.', position: 'top' },
];

export default function OnboardingTour() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('erpflex_tour_completed');
    if (!hasSeenTour) {
      const timer = setTimeout(() => setIsActive(true), 1500);
      return () => clearTimeout(timer);
    }
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

  const restart = () => {
    setCurrentStep(0);
    setIsActive(true);
  };

  if (!isActive) return null;

  const step = tourSteps[currentStep];
  const tooltipStyle: React.CSSProperties = {};

  switch (step.position) {
    case 'bottom':
      tooltipStyle.top = position.top + position.height + 12;
      tooltipStyle.left = Math.max(10, position.left + position.width / 2 - 160);
      break;
    case 'top':
      tooltipStyle.top = position.top - 180;
      tooltipStyle.left = Math.max(10, position.left + position.width / 2 - 160);
      break;
    case 'left':
      tooltipStyle.top = position.top;
      tooltipStyle.left = position.left - 340;
      break;
    case 'right':
      tooltipStyle.top = position.top;
      tooltipStyle.left = position.left + position.width + 12;
      break;
    default:
      tooltipStyle.top = position.top + position.height + 12;
      tooltipStyle.left = position.left;
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[9998]" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={finish} />

      {/* Spotlight */}
      <div
        className="fixed z-[9999] rounded-lg transition-all duration-300"
        style={{
          top: position.top - 4,
          left: position.left - 4,
          width: position.width + 8,
          height: position.height + 8,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
          pointerEvents: 'none',
        }}
      />

      {/* Tooltip */}
      <div
        className="fixed z-[10000] bg-white rounded-2xl shadow-2xl p-5 w-80 animate-in fade-in"
        style={tooltipStyle}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-blue-500" />
            <span className="font-bold text-gray-800">{step.title}</span>
          </div>
          <button onClick={finish} className="p-1 hover:bg-gray-100 rounded"><X size={16} /></button>
        </div>
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">{step.content}</p>
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {tourSteps.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i === currentStep ? 'bg-blue-500' : 'bg-gray-300'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <button onClick={prev} className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                <ChevronRight size={14} /> السابق
              </button>
            )}
            <button onClick={next} className="flex items-center gap-1 px-4 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              {currentStep === tourSteps.length - 1 ? 'إنهاء' : 'التالي'} <ChevronLeft size={14} />
            </button>
          </div>
        </div>
        <div className="mt-2 text-center">
          <span className="text-xs text-gray-400">{currentStep + 1} / {tourSteps.length}</span>
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
