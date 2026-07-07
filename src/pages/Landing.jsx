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
          <Link to="/login"><Button variant="ghost" className="link-flourish text-sm" tabIndex={-1}>Sign in</Button></Link>
          <Link to="/register"><Button className="text-sm" tabIndex={-1}>Start Planning</Button></Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative text-center px-6 pt-16 sm:pt-20 pb-24 sm:pb-28 max-w-4xl mx-auto animate-fade-in">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-gradient-to-b from-wine-50/80 via-phera-50/40 to-transparent blur-3xl"></div>
        </div>
        <p className="text-sm font-medium text-wine-600 tracking-wide uppercase mb-4">Built for 200, 500, and 1000+ guest weddings</p>
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-display font-bold text-gray-900 leading-[1.1] mb-6 text-balance">
          Stop managing your shaadi<br className="hidden sm:block" />
          <span className="text-wine-700">from 7 WhatsApp groups</span>
        </h1>
        <p className="text-base sm:text-lg text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed text-pretty">
          Your Mom has a notebook. Your sister has a spreadsheet. Your cousin made a Google Form nobody filled out.
          Phera replaces the mess with one calm place — built specifically for the chaos of Indian weddings.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link to="/register">
            <Button size="lg" className="shadow-glow hover:scale-[1.02] transition-transform w-full sm:w-auto" tabIndex={-1}>
              Start Planning — It's Free <ArrowRight size={16} />
            </Button>
          </Link>
          <p className="text-xs text-gray-400">Set up in under 2 minutes. No credit card ever.</p>
        </div>
      </section>

      {/* Social proof bar — Bandwagon Effect */}
      <div className="border-y border-gray-200/60 bg-white/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-center gap-4 sm:gap-8 flex-wrap text-sm text-gray-500">
          <span className="flex items-center gap-1.5"><Check size={14} className="text-green-600" /> Multi-event support</span>
          <span className="flex items-center gap-1.5"><Check size={14} className="text-green-600" /> Family-group RSVPs</span>
          <span className="flex items-center gap-1.5"><Check size={14} className="text-green-600" /> Drag & drop seating</span>
          <span className="flex items-center gap-1.5"><Check size={14} className="text-green-600" /> 100% free forever</span>
        </div>
      </div>

      {/* Stats bar — Authority & Specificity */}
      <div className="max-w-4xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        <div>
          <p className="text-3xl font-display font-bold text-wine-700 tabular-nums">6+</p>
          <p className="text-sm text-gray-500 mt-1">Event types supported</p>
        </div>
        <div>
          <p className="text-3xl font-display font-bold text-wine-700 tabular-nums">1000+</p>
          <p className="text-sm text-gray-500 mt-1">Guest capacity</p>
        </div>
        <div>
          <p className="text-3xl font-display font-bold text-wine-700 tabular-nums">60s</p>
          <p className="text-sm text-gray-500 mt-1">Excel import time</p>
        </div>
        <div>
          <p className="text-3xl font-display font-bold text-wine-700 tabular-nums">$0</p>
          <p className="text-sm text-gray-500 mt-1">Price. Always.</p>
        </div>
      </div>

      {/* Features — benefit-focused, Jobs to Be Done framing */}
      <section className="px-6 py-20 max-w-6xl mx-auto section-warm">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 mb-3 text-balance">
            Every headache your shaadi throws at you — handled
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-pretty">
            We didn't build features. We solved the problems that made us lose sleep before our own wedding.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={Calendar}
            title="One wedding, six events, zero confusion"
            description="Mehndi with 80 guests, Sangeet with 200, Reception with 500. Each event gets its own invite list, timeline, and dress code — no more 'wait, is Masi invited to the Haldi?'"
          />
          <FeatureCard
            icon={Users}
            title="500 guests imported before your chai gets cold"
            description="Paste from Excel. We auto-detect columns, group by family, catch duplicates, and tag dietary needs. Your entire list — organized — in 60 seconds."
          />
          <FeatureCard
            icon={Grid3X3}
            title="Seat 50 tables without a single argument"
            description="Drag guests onto tables. Set 'keep apart' rules for Uncle Raj and Uncle Mohan. Mix round tables of 10 with estate tables of 14. Print place cards without touching Canva."
          />
          <FeatureCard
            icon={Mail}
            title="RSVPs even Nani can figure out"
            description="One link. Tap your name. See your events. Respond. No login, no download, no 'beta, how do I use this app?' Literally works for everyone from Gen-Z cousins to grandparents."
          />
          <FeatureCard
            icon={Camera}
            title="Never miss 'Bride's college friends' shot"
            description="Build a photographer shot list. Display it live at the venue. The MC calls groups. Photographer never asks 'who's next?' again."
          />
          <FeatureCard
            icon={Trophy}
            title="Keep 400 guests entertained between events"
            description="Custom predictions ('Who dances first?'), live voting on phones, real-time leaderboard on the big screen. Guests talk about it for months."
          />
        </div>
      </section>

      {/* Pain → Solution — Loss Aversion framing */}
      <section className="px-6 py-20 max-w-5xl mx-auto section-blush">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 mb-3 text-balance">
            Sound familiar?
          </h2>
          <p className="text-gray-500">Every Indian wedding hits these walls. Here's how Phera breaks through them.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ScenarioCard
            number="01"
            title="The 3 AM guest list panic"
            problem="Names scattered across WhatsApp groups, Mom's notebook, three spreadsheets, and a Google Doc nobody can find. You WILL forget someone important."
            solution="One source of truth. Import from anywhere. Duplicates caught instantly. Everyone sees the same list — nobody can accidentally break it."
          />
          <ScenarioCard
            number="02"
            title="The seating nightmare"
            problem="Uncle Raj and Uncle Mohan at the same table = drama for decades. The Shahs need 12 seats. The Patels need 14. Your Excel chart just broke for the 6th time."
            solution="Drag-and-drop with custom table sizes (8, 10, 12, 14 — whatever you need). Set conflict rules. See warnings before they become family feuds."
          />
          <ScenarioCard
            number="03"
            title="The RSVP black hole"
            problem="Aunties ignore emails. Cousins forget apps. Dada doesn't know what a QR code is. You've sent 3 reminders and still have 200 'maybes.'"
            solution="One WhatsApp-friendly link. Tap your name. Done. Large text, no login, no app. Your RSVP rate goes from 40% to 90%+ because there's zero friction."
          />
        </div>
      </section>

      {/* How it works — Goal-Gradient + Present Bias */}
      <section className="px-6 py-20 bg-white border-y border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 text-center mb-4 text-balance">
            Set up in 2 minutes. Seriously.
          </h2>
          <p className="text-gray-500 text-center mb-14 max-w-lg mx-auto">No 30-minute onboarding. No tutorial videos. Three steps and you're managing your wedding like a pro.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
            <StepCard step="1" title="Add your events" description="Pick from pre-built templates (Mehndi, Sangeet, Haldi, Garba, Ceremony, Reception) or create custom ones. 30 seconds." />
            <StepCard step="2" title="Import your people" description="Drag in your Excel sheet. We auto-detect names, families, dietary needs, and phone numbers. Duplicates caught. Done." />
            <StepCard step="3" title="Share & manage" description="Send RSVP links via WhatsApp. Arrange seating with drag-and-drop. Print place cards. Track everything in real-time." />
          </div>
        </div>
      </section>

      {/* Free forever banner */}
      <section className="px-6 py-20 max-w-4xl mx-auto text-center">
        <div className="rounded-3xl border border-wine-200/60 bg-gradient-to-b from-wine-50/80 to-white p-10 sm:p-14 shadow-card">
          <span className="inline-block text-[11px] font-bold text-wine-700 uppercase tracking-wider bg-wine-100 px-3 py-1.5 rounded-full mb-5">100% Free</span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-4">Every feature. Unlimited guests. $0.</h2>
          <p className="text-gray-600 max-w-lg mx-auto mb-8 leading-relaxed">
            No trials, no tiers, no surprise paywalls. Plan your entire wedding — from the Mehndi to the Reception — without paying a rupee.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto mb-8">
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
          <Link to="/register">
            <Button size="lg" className="shadow-glow" tabIndex={-1}>Start Planning Free <ArrowRight size={16} /></Button>
          </Link>
          <p className="mt-4 text-xs text-gray-400">Optional: $5 for advanced wedding website customization (custom fonts, colors, sections).</p>
        </div>
      </section>

      {/* Comparison table — Anchoring + Competitive framing */}
      <section className="px-6 py-20 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 mb-3 text-balance">Zola and WithJoy weren't made for your wedding</h2>
          <p className="text-gray-500">They support one event, 150 guests, and fixed table sizes. Indian weddings need more.</p>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-gray-200/80 shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Feature</th>
                <th className="py-3 px-4 font-display font-bold text-wine-700">Phera</th>
                <th className="py-3 px-4 font-semibold text-gray-500">Zola</th>
                <th className="py-3 px-4 font-semibold text-gray-500">WithJoy</th>
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

      {/* FAQ — Objection Handling + Regret Aversion */}
      <section className="px-6 py-20 max-w-3xl mx-auto section-warm">
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 text-center mb-12 text-balance">
          Quick answers
        </h2>
        <div className="space-y-3">
          <FAQItem
            question="How is this different from Zola or WithJoy?"
            answer="Those platforms are designed for American weddings — one event, 150 guests, fixed seating. Phera handles 6+ events with different invite lists each, 500–1000 guests, family-group RSVPs, variable table sizes (10, 12, 14+), and WhatsApp-friendly links. If your wedding has a Mehndi, Sangeet, AND Reception with different guest lists — those tools will fight you. This one won't."
          />
          <FAQItem
            question="Can I import my existing guest list?"
            answer="Yes — any Excel or CSV file. Drag it in, and we auto-detect columns (name, phone, family, dietary, side). Duplicates caught. Families auto-grouped. Takes about 60 seconds for 500 guests."
          />
          <FAQItem
            question="Do guests need to create an account?"
            answer="No. They get a link (works great via WhatsApp), search their name, and respond. No login, no download, no app store. We designed it so your 80-year-old Dada and your 19-year-old cousin can both figure it out in seconds."
          />
          <FAQItem
            question="What about different guest lists per event?"
            answer="That's the core reason Phera exists. Your Mehndi might be 80 people, your Reception 500. Each event has its own invite list, RSVP tracking, and seating chart. No more accidentally inviting the neighbors to the Haldi."
          />
          <FAQItem
            question="Wait — this is actually free?"
            answer="Yes. Unlimited guests, events, tables, seating charts, RSVPs, photo groups, games — all free, forever. The only optional paid feature is $5 for advanced wedding website customization (custom fonts, colors, and sections). Everything else: $0."
          />
          <FAQItem
            question="Can I print place cards?"
            answer="Yes. Generate printable place cards (guest name + table number), full table assignment sheets, and alphabetical lookup lists for the venue entrance display. Per event. Export as PDF. No Canva needed."
          />
        </div>
      </section>

      {/* Final CTA — Loss Aversion + Present Bias */}
      <section className="relative text-center px-6 py-24 bg-gradient-to-br from-wine-800 via-wine-900 to-gray-900 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-phera-500/10 blur-3xl"></div>
        <div className="relative max-w-2xl mx-auto">
          <Sparkles className="mx-auto mb-4 text-phera-400" size={28} />
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-3 text-balance">Every hour you spend on spreadsheets is an hour you don't spend enjoying your own wedding</h2>
          <p className="text-wine-200 mb-8 text-lg">Free. Unlimited. Ready in 2 minutes.</p>
          <Link to="/register"><Button variant="secondary" size="lg" className="hover:scale-[1.02] transition-transform" tabIndex={-1}>Start Planning Now <ArrowRight size={16} /></Button></Link>
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
    <div className="group rounded-2xl border border-gray-200/80 bg-white p-6 shadow-card hover:shadow-lifted hover:-translate-y-1 transition-all duration-300">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-wine-50 to-phera-50 mb-4 group-hover:from-wine-100 group-hover:to-phera-100 transition-colors">
        <Icon size={20} className="text-wine-700" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}

function ScenarioCard({ number, title, problem, solution }) {
  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-card hover:shadow-lifted transition-all duration-300">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-wine-50 text-xs font-bold text-wine-600">{number}</span>
      <h3 className="text-base font-semibold text-gray-900 mt-3 mb-4">{title}</h3>
      <div className="mb-4">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">The mess</p>
        <p className="text-sm text-gray-500">{problem}</p>
      </div>
      <div className="pt-3 border-t border-gray-100">
        <p className="text-[11px] font-semibold text-wine-600 uppercase tracking-wider mb-1">With Phera</p>
        <p className="text-sm text-gray-700 leading-relaxed">{solution}</p>
      </div>
    </div>
  );
}

function StepCard({ step, title, description }) {
  return (
    <div>
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-wine-100 to-phera-100 text-wine-700 font-display font-bold text-xl mb-4 shadow-sm">
        {step}
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-gray-200/80 bg-white overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-gray-50/50 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-900 pr-4">{question}</span>
        <span className={`text-gray-300 transition-transform duration-200 text-lg ${open ? 'rotate-180' : ''}`}>&#9662;</span>
      </button>
      {open && (
        <div className="px-6 pb-5 animate-fade-in">
          <p className="text-sm text-gray-600 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}


function ComparisonRow({ feature, phera, zola, withjoy }) {
  const renderCell = (value) => {
    if (value === true) return <span className="text-green-600 font-bold">✓</span>;
    if (value === false) return <span className="text-gray-300">✗</span>;
    return <span className="text-amber-600 text-xs font-medium">{value}</span>;
  };
  return (
    <tr className="hover:bg-gray-50/50">
      <td className="py-2.5 px-4 text-gray-700">{feature}</td>
      <td className="py-2.5 px-4 text-center">{renderCell(phera)}</td>
      <td className="py-2.5 px-4 text-center">{renderCell(zola)}</td>
      <td className="py-2.5 px-4 text-center">{renderCell(withjoy)}</td>
    </tr>
  );
}
