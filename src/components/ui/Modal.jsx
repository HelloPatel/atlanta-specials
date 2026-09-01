import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
  };

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="duration-200 ease-out"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="duration-150 ease-in"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px]" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
            enterFrom="opacity-0 translate-y-2 scale-[0.98]"
            enterTo="opacity-100 translate-y-0 scale-100"
            leave="duration-150 ease-[cubic-bezier(0.4,0,0.2,1)]"
            leaveFrom="opacity-100 translate-y-0 scale-100"
            leaveTo="opacity-0 translate-y-1 scale-[0.98]"
          >
            <Dialog.Panel className={`w-full ${sizeClasses[size]} max-h-[90dvh] rounded-2xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-xl flex flex-col sm:max-h-[85dvh] sm:p-6`}>
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <Dialog.Title className="text-lg font-semibold text-gray-900 text-balance">
                  {title}
                </Dialog.Title>
                <button
                  onClick={onClose}
                  aria-label="Close dialog"
                  className="rounded-lg p-2.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors duration-150"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 -mx-1 px-1">
                {children}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
