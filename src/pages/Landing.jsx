import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui';
import { APP_NAME } from '../config/constants';
import { Users, Calendar, Grid3X3, Mail, Camera, Trophy, ArrowRight, Check, Sparkles } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen font-body">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-wine-700 to-wine-900 text-white font-display font-bold text-sm shadow-sm">P</div>
          <span className="text-lg sm:text-xl font-display font-bold text-gray-900 tracking-tight">{APP_NAME}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/login" className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors link-flourish">Sign in</Link>
          <Link to="/register" className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-wine-700 hover:bg-wine-800 rounded-lg shadow-sm transition-colors">Start Planning</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative text-center px-6 pt-12 sm:pt-20 pb-16 sm:pb-28 max-w-4xl mx-auto animate-fade-in">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-gradient-to-b from-wine-50/80 via-phera-50/40 to-transparent blur-3xl"></div>
        </div>
        <p className="text-xs sm:text-sm font-medium text-wine-600 tracking-wide uppercase mb-3 sm:mb-4">Built for 200, 500, and 1000+ guest weddings</p>
        <h1 className="text-2xl sm:text-5xl md:text-6xl font-display font-bold text-gray-900 leading-[1.1] mb-4 sm:mb-6 text-balance">
          Stop managing your shaadi<br className="hidden sm:block" />
          <span className="text-wine-700">from 7 WhatsApp groups</span>
        </h1>
        <p className="text-sm sm:text-lg text-gray-600 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed text-pretty">
          Your Mom has a notebook. Your sister has a spreadsheet. Your cousin made a Google Form nobody filled out.
          Phera replaces the mess with one calm place — built specifically for the chaos of Indian weddings.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-white bg-wine-700 hover:bg-wine-800 rounded-xl shadow-glow hover:scale-[1.02] transition-all w-full sm:w-auto justify-center">
            Start Planning — It's Free <ArrowRight size={16} />
          </Link>
          <p className="text-xs text-gray-400">Set up in under 2 minutes. No credit card ever.</p>
        </div>
      </section>

      {/* Social proof bar */}
      <div className="border-y border-gray-200/60 bg-white/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-center gap-3 sm:gap-8 flex-wrap text-xs sm:text-sm text-gray-500">
          <span className="flex items-center gap-1.5"><Check size={14} className="text-green-600" /> Multi-event</span>
          <span className="flex items-center gap-1.5"><Check size={14} className="text-green-600" /> Family RSVPs</span>
          <span className="flex items-center gap-1.5"><Check size={14} className="text-green-600" /> Drag & drop</span>
          <span className="flex items-center gap-1.5"><Check size={14} className="text-green-600" /> 100% free</span>
        </div>
      </div>

      {/* Stats bar */}
      <div className="max-w-4xl mx-auto px-6 py-6 sm:py-10 grid grid-cols-4 gap-3 sm:gap-6 text-center">
        <div>
          <p className="text-xl sm:text-3xl font-display font-bold text-wine-700 tabular-nums">6+</p>
          <p className="text-[10px] sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Events</p>
        </div>
        <div>
          <p className="text-xl sm:text-3xl font-display font-bold text-wine-700 tabular-nums">1000+</p>
          <p className="text-[10px] sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Guests</p>
        </div>
        <div>
          <p className="text-xl sm:text-3xl font-display font-bold text-wine-700 tabular-nums">60s</p>
          <p className="text-[10px] sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Import</p>
        </div>
        <div>
          <p className="text-xl sm:text-3xl font-display font-bold text-wine-700 tabular-nums">$0</p>
          <p className="text-[10px] sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Always</p>
        </div>
      </div>

      {/* Visual mockup — breaks up text */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8">
        <div className="rounded-2xl border border-gray-200/80 bg-white shadow-lifted overflow-hidden">
          <div className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
            <div className="size-2.5 rounded-full bg-red-300"></div>
            <div className="size-2.5 rounded-full bg-amber-300"></div>
            <div className="size-2.5 rounded-full bg-green-300"></div>
            <span className="ml-3 text-[10px] text-gray-400 font-mono">phera.app/dashboard</span>
          </div>
          <div className="p-4 sm:p-6 grid grid-cols-3 gap-3 sm:gap-4">
            {/* Mini seating chart mockup */}
            <div className="col-span-2 rounded-xl bg-gray-50 border border-gray-100 p-4 sm:p-5 relative overflow-hidden min-h-[120px] sm:min-h-[180px]">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Seating Chart</p>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="size-8 sm:size-12 rounded-full border-2 border-wine-200 bg-wine-50 flex items-center justify-center">
                    <span className="text-[8px] sm:text-[10px] font-bold text-wine-600">T{i}</span>
                  </div>
                ))}
              </div>
              <div className="absolute bottom-3 right-3 text-[9px] text-gray-400">50 tables • 487 seated</div>
            </div>
            {/* Mini guest list mockup */}
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 sm:p-4">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Guests</p>
              <div className="space-y-1.5">
                {['Patel Family','Shah Family','Mehta Family','Desai Family'].map(f => (
                  <div key={f} className="flex items-center gap-1.5">
                    <div className="size-4 sm:size-5 rounded-full bg-wine-100"></div>
                    <span className="text-[9px] sm:text-[10px] text-gray-600 truncate">{f}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-[9px] text-green-600 font-medium">✓ 312 RSVPs received</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <section className="px-4 sm:px-6 py-12 sm:py-20 max-w-6xl mx-auto section-warm bg-pattern-floral relative">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-3xl font-display font-bold text-gray-900 mb-2 text-balance">
            Everything your shaadi actually needs
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          <FeatureCard
            icon={Calendar}
            title="6 events, different guest lists"
            description="Mehndi 80 guests, Sangeet 200, Reception 500. Each event gets its own invite list and seating chart."
          />
          <FeatureCard
            icon={Users}
            title="500 guests imported in 60 seconds"
            description="Paste from Excel. Auto-detect columns, group by family, catch duplicates. Done."
          />
          <FeatureCard
            icon={Grid3X3}
            title="Drag-and-drop seating"
            description="Mix table sizes (8, 10, 12, 14). Set keep-apart rules. Print place cards. No Canva needed."
          />
          <FeatureCard
            icon={Mail}
            title="RSVPs that actually work"
            description="One WhatsApp link. Tap name, respond. No login, no app. Works for Nani and Gen-Z alike."
          />
          <FeatureCard
            icon={Camera}
            title="Photo group shot list"
            description="Live queue on a screen at the venue. MC calls groups. Never miss a family combination."
          />
          <FeatureCard
            icon={Trophy}
            title="Guest games & predictions"
            description="Live voting on phones. Real-time leaderboard on the big screen. Guests talk about it for months."
          />
        </div>
      </section>

      {/* Pain → Solution */}
      <section className="px-4 sm:px-6 py-12 sm:py-20 max-w-5xl mx-auto section-blush bg-pattern-mandala relative">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-3xl font-display font-bold text-gray-900 mb-2 text-balance">
            Sound familiar?
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
          <ScenarioCard
            number="01"
            title="The scattered guest list"
            problem="Names in WhatsApp, Mom's notebook, and 3 spreadsheets nobody can find."
            solution="One list. Import from anywhere. Duplicates caught. Families auto-grouped."
          />
          <ScenarioCard
            number="02"
            title="The seating nightmare"
            problem="Uncle Raj + Uncle Mohan = drama. Shahs need 12 seats. Your Excel just broke again."
            solution="Drag-and-drop. Custom table sizes. Conflict rules. See warnings before problems."
          />
          <ScenarioCard
            number="03"
            title="The RSVP black hole"
            problem="Aunties ignore emails. Cousins forget apps. 200 'maybes' after 3 reminders."
            solution="One WhatsApp link. Tap name. Done. RSVP rate: 40% → 90%+."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 sm:px-6 py-12 sm:py-20 bg-white border-y border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl sm:text-3xl font-display font-bold text-gray-900 text-center mb-8 sm:mb-12 text-balance">
            Set up in 2 minutes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-10 text-center">
            <StepCard step="1" title="Add your events" description="Pick from templates (Mehndi, Sangeet, Haldi, Ceremony, Reception) or create custom ones." />
            <StepCard step="2" title="Import your people" description="Drag in your Excel. Auto-detect names, families, dietary needs. Duplicates caught." />
            <StepCard step="3" title="Share & manage" description="Send RSVP links via WhatsApp. Arrange seating. Print place cards. Track everything." />
          </div>
        </div>
      </section>

      {/* Free forever banner */}
      <section className="px-4 sm:px-6 py-12 sm:py-20 max-w-4xl mx-auto text-center">
        <div className="rounded-2xl sm:rounded-3xl border border-wine-200/60 bg-gradient-to-b from-wine-50/80 to-white p-6 sm:p-12 shadow-card">
          <span className="inline-block text-[11px] font-bold text-wine-700 uppercase tracking-wider bg-wine-100 px-3 py-1.5 rounded-full mb-4">100% Free</span>
          <h2 className="text-2xl sm:text-4xl font-display font-bold text-gray-900 mb-3">Every feature. Unlimited guests. $0.</h2>
          <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-xl mx-auto mb-5 sm:mb-6">
            <div className="rounded-xl bg-white border border-gray-100 p-3">
              <p className="text-lg font-bold text-gray-900">∞</p>
              <p className="text-xs text-gray-500">Guests</p>
            </div>
            <div className="rounded-xl bg-white border border-gray-100 p-3">
              <p className="text-lg font-bold text-gray-900">∞</p>
              <p className="text-xs text-gray-500">Events</p>
            </div>
            <div className="rounded-xl bg-white border border-gray-100 p-3">
              <p className="text-lg font-bold text-gray-900">∞</p>
              <p className="text-xs text-gray-500">Tables</p>
            </div>
            <div className="rounded-xl bg-white border border-gray-100 p-3">
              <p className="text-lg font-bold text-gray-900">∞</p>
              <p className="text-xs text-gray-500">RSVPs</p>
            </div>
          </div>
          <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-wine-700 text-white font-semibold shadow-glow hover:bg-wine-800 transition-colors">
            Start Planning Free <ArrowRight size={16} />
          </Link>
          <p className="mt-3 text-xs text-gray-400">Optional: $5 for advanced wedding website customization.</p>
        </div>
      </section>

      {/* Comparison table */}
      <section className="px-4 sm:px-6 py-12 sm:py-20 max-w-4xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-3xl font-display font-bold text-gray-900 mb-2 text-balance">Zola and WithJoy weren't made for your wedding</h2>
        </div>
        <div className="overflow-x-auto rounded-xl sm:rounded-2xl border border-gray-200/80 shadow-card">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left py-2.5 sm:py-3 px-3 sm:px-4 font-semibold text-gray-700">Feature</th>
                <th className="py-2.5 sm:py-3 px-2 sm:px-4 font-display font-bold text-wine-700">Phera</th>
                <th className="py-2.5 sm:py-3 px-2 sm:px-4 font-semibold text-gray-500">Zola</th>
                <th className="py-2.5 sm:py-3 px-2 sm:px-4 font-semibold text-gray-500">WithJoy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <ComparisonRow feature="Multi-event (Mehndi, Sangeet, etc.)" phera={true} zola={false} withjoy="Partial" />
              <ComparisonRow feature="Different guest list per event" phera={true} zola={false} withjoy={false} />
              <ComparisonRow feature="500+ guest import" phera={true} zola={true} withjoy={true} />
              <ComparisonRow feature="Family-group RSVPs" phera={true} zola={false} withjoy={false} />
              <ComparisonRow feature="Variable table sizes (10-12+)" phera={true} zola={false} withjoy="Partial" />
              <ComparisonRow feature="Auto-suggest seating" phera={true} zola={false} withjoy={false} />
              <ComparisonRow feature="Keep-apart / keep-together rules" phera={true} zola={false} withjoy={false} />
              <ComparisonRow feature="QR code table finder" phera={true} zola={false} withjoy={false} />
              <ComparisonRow feature="Place card PDF export" phera={true} zola={false} withjoy={false} />
              <ComparisonRow feature="WhatsApp-friendly RSVP" phera={true} zola={false} withjoy={false} />
              <ComparisonRow feature="Photo group shot list" phera={true} zola={false} withjoy={false} />
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 sm:px-6 py-12 sm:py-20 max-w-3xl mx-auto section-warm">
        <h2 className="text-xl sm:text-3xl font-display font-bold text-gray-900 text-center mb-8 sm:mb-12 text-balance">
          Quick answers
        </h2>
        <div className="space-y-3">
          <FAQItem
            question="How is this different from Zola or WithJoy?"
            answer="They handle one event, ~150 guests, fixed seating. Phera handles 6+ events with different invite lists, 500–1000 guests, family-group RSVPs, variable table sizes, and WhatsApp-friendly links."
          />
          <FAQItem
            question="Can I import my existing guest list?"
            answer="Yes — any Excel or CSV. Drag it in, columns auto-detected, duplicates caught, families grouped. 60 seconds for 500 guests."
          />
          <FAQItem
            question="Do guests need to create an account?"
            answer="No. They get a link via WhatsApp, search their name, and respond. No login, no app, no download."
          />
          <FAQItem
            question="Wait — this is actually free?"
            answer="Yes. Unlimited guests, events, tables, seating charts, RSVPs — all free, forever. Only $5 optional for advanced wedding website customization."
          />
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative text-center px-4 sm:px-6 py-14 sm:py-20 bg-gradient-to-br from-wine-800 via-wine-900 to-gray-900 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-phera-500/10 blur-3xl"></div>
        <div className="relative max-w-2xl mx-auto">
          <Sparkles className="mx-auto mb-3 sm:mb-4 text-phera-400" size={24} />
          <h2 className="text-xl sm:text-3xl font-display font-bold text-white mb-3 text-balance">Stop spending hours on spreadsheets</h2>
          <p className="text-wine-200 mb-6 sm:mb-8 text-base sm:text-lg">Free. Unlimited. Ready in 2 minutes.</p>
          <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-wine-800 font-semibold hover:bg-gray-100 hover:scale-[1.02] transition-all">
            Start Planning Now <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center px-6 py-8 text-sm text-gray-400 bg-gray-50 border-t border-gray-100">
        <p>&copy; {new Date().getFullYear()} {APP_NAME}. Built for Indian weddings.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="group rounded-xl sm:rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-6 shadow-card hover:shadow-lifted hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex size-9 sm:size-11 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-wine-50 to-phera-50 mb-3 sm:mb-4 group-hover:from-wine-100 group-hover:to-phera-100 transition-colors">
        <Icon size={18} className="text-wine-700" />
      </div>
      <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 sm:mb-2">{title}</h3>
      <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}

function ScenarioCard({ number, title, problem, solution }) {
  return (
    <div className="rounded-xl sm:rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-6 shadow-card hover:shadow-lifted transition-all duration-300">
      <span className="inline-flex size-7 sm:size-8 items-center justify-center rounded-full bg-wine-50 text-[10px] sm:text-xs font-bold text-wine-600">{number}</span>
      <h3 className="text-sm sm:text-base font-semibold text-gray-900 mt-2 sm:mt-3 mb-3 sm:mb-4">{title}</h3>
      <div className="mb-3 sm:mb-4">
        <p className="text-[10px] sm:text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">The mess</p>
        <p className="text-xs sm:text-sm text-gray-500">{problem}</p>
      </div>
      <div className="pt-2 sm:pt-3 border-t border-gray-100">
        <p className="text-[10px] sm:text-[11px] font-semibold text-wine-600 uppercase tracking-wider mb-1">With Phera</p>
        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">{solution}</p>
      </div>
    </div>
  );
}

function StepCard({ step, title, description }) {
  return (
    <div>
      <div className="inline-flex size-10 sm:size-12 items-center justify-center rounded-full bg-gradient-to-br from-wine-100 to-phera-100 text-wine-700 font-display font-bold text-lg sm:text-xl mb-3 sm:mb-4 shadow-sm">
        {step}
      </div>
      <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 sm:mb-2">{title}</h3>
      <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-gray-200/80 bg-white overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 sm:px-6 py-3 sm:py-4 text-left hover:bg-gray-50/50 transition-colors"
      >
        <span className="text-xs sm:text-sm font-semibold text-gray-900 pr-4">{question}</span>
        <span className={`text-gray-300 transition-transform duration-200 text-lg shrink-0 ${open ? 'rotate-180' : ''}`}>&#9662;</span>
      </button>
      {open && (
        <div className="px-4 sm:px-6 pb-4 sm:pb-5 animate-fade-in">
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}


function ComparisonRow({ feature, phera, zola, withjoy }) {
  const renderCell = (value) => {
    if (value === true) return <span className="text-green-600 font-bold">✓</span>;
    if (value === false) return <span className="text-gray-300">✗</span>;
    return <span className="text-amber-600 text-[10px] sm:text-xs font-medium">{value}</span>;
  };
  return (
    <tr className="hover:bg-gray-50/50">
      <td className="py-2 sm:py-2.5 px-3 sm:px-4 text-gray-700">{feature}</td>
      <td className="py-2 sm:py-2.5 px-2 sm:px-4 text-center">{renderCell(phera)}</td>
      <td className="py-2 sm:py-2.5 px-2 sm:px-4 text-center">{renderCell(zola)}</td>
      <td className="py-2 sm:py-2.5 px-2 sm:px-4 text-center">{renderCell(withjoy)}</td>
    </tr>
  );
}
