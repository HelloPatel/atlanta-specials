import { useState, useEffect } from 'react';
import { ArrowRight, X } from 'lucide-react';

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Phera! 🎉',
    description: 'The only wedding planner built for Indian weddings. Let\'s get you set up in under 2 minutes.',
  },
  {
    id: 'events',
    title: 'Start with your events',
    description: 'Add Mehndi, Sangeet, Haldi, Ceremony, Reception — each gets its own guest list and seating.',
  },
  {
    id: 'guests',
    title: 'Import your guest list',
    description: 'Upload an Excel sheet or add guests manually. We auto-detect columns, group families, and catch duplicates.',
  },
  {
    id: 'seating',
    title: 'Drag & drop seating',
    description: 'Mix round, estate, and head tables. Set keep-together rules. Use Auto-Seat to fill tables intelligently.',
  },
  {
    id: 'rsvp',
    title: 'Share your RSVP link',
    description: 'One link works for everyone. Guests find their name, see their events, and respond. No login needed.',
  },
];

const STORAGE_KEY = 'phera-onboarding-complete';

export default function OnboardingTour({ show }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!show) return;
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) setVisible(true);
  }, [show]);

  const handleNext = () => {
    if (step < ONBOARDING_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  };

  if (!visible) return null;

  const current = ONBOARDING_STEPS[step];
  const isLast = step === ONBOARDING_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md mx-4 rounded-2xl bg-white shadow-2xl p-8 animate-fade-in">
        <button
          onClick={handleComplete}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Skip tour"
        >
          <X size={20} />
        </button>

        <div className="flex items-center justify-center gap-1.5 mb-6">
          {ONBOARDING_STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-wine-600' : 'w-1.5 bg-gray-200'}`}
            />
          ))}
        </div>

        <div className="text-center">
          <h2 className="text-xl font-display font-bold text-gray-900 mb-3">{current.title}</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-8">{current.description}</p>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={handleComplete}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Skip tour
          </button>
          <button
            onClick={handleNext}
            className="flex items-center gap-2 rounded-xl bg-wine-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-wine-800 transition-colors shadow-sm"
          >
            {isLast ? "Let's go!" : 'Next'} <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function resetOnboarding() {
  localStorage.removeItem(STORAGE_KEY);
}
