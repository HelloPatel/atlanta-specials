import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { ArrowRight, X } from 'lucide-react';

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Phera',
    description: 'The only wedding planner built for Indian weddings. Let\'s get you set up in under 2 minutes.',
  },
  {
    id: 'events',
    title: 'Start with your events',
    description: 'Add Mehndi, Sangeet, Haldi, Ceremony, Reception. Each gets its own guest list and seating.',
  },
  {
    id: 'guests',
    title: 'Import your guest list',
    description: 'Upload an Excel sheet or add guests manually. We auto-detect columns, group families, and catch duplicates.',
  },
  {
    id: 'seating',
    title: 'Drag and drop seating',
    description: 'Mix round, estate, and head tables. Set keep-together rules. Use Auto-Seat to fill tables quickly.',
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
    <Dialog open={visible} onClose={handleComplete} className="relative z-[100]">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" aria-hidden="true" />
      <div className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-4">
      <Dialog.Panel className="relative w-full max-w-md rounded-t-2xl bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl animate-slide-up sm:rounded-2xl sm:p-8 sm:animate-fade-in">
        <button
          onClick={handleComplete}
          className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine-600"
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
          <Dialog.Title className="text-xl font-display font-bold text-gray-900 mb-3">{current.title}</Dialog.Title>
          <p className="text-sm text-gray-600 leading-relaxed mb-8">{current.description}</p>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={handleComplete}
            className="min-h-11 rounded-xl px-3 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine-600"
          >
            Skip tour
          </button>
          <button
            onClick={handleNext}
            className="flex min-h-11 items-center gap-2 rounded-xl bg-wine-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-wine-800 active:scale-[0.98] transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine-600 focus-visible:ring-offset-2"
          >
            {isLast ? "Let's go" : 'Next'} <ArrowRight size={14} />
          </button>
        </div>
        </Dialog.Panel>
      </div>
      </Dialog>
  );
}

export function resetOnboarding() {
  localStorage.removeItem(STORAGE_KEY);
}
