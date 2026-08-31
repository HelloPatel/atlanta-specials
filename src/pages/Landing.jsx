import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui';
import HeroDemo from '../components/ui/HeroDemo';
import FeatureTiles from '../components/ui/FeatureTiles';
import LegalFooter from '../components/legal/LegalFooter';
import { APP_NAME } from '../config/constants';
import { Users, Calendar, Grid3X3, Mail, Camera, ArrowRight, Sparkles, Play } from 'lucide-react';
import {
  CountUp,
  SplitText,
  ShinyText,
  SpotlightCard,
  StarBorder,
  Magnet,
  ClickSpark,
  Reveal,
  RevealStagger,
  RevealItem,
} from '../components/ui/reactbits';

function useReveal() {  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Fallback: reveal everything after 1.5s in case observer doesn't fire
    const fallback = setTimeout(() => {
      el.querySelectorAll('.reveal').forEach((child) => child.classList.add('revealed'));
    }, 1500);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.reveal').forEach((child) => child.classList.add('revealed'));
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px 50px 0px' }
    );
    observer.observe(el);
    return () => { observer.disconnect(); clearTimeout(fallback); };
  }, []);
  return ref;
}

// Cinematic phera (walking around the sacred fire) loop used purely as an
// ambient aesthetic backdrop behind the landing hero. Faces are intentionally
// de-emphasized — the clip favors the outfits and the motion. Swaps to a
// portrait encode on small screens and falls back to a still for users who
// prefer reduced motion.
function HeroVideoBackdrop() {
  const [src, setSrc] = useState('/hero/phera-desktop.mp4');
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const small = window.matchMedia('(max-width: 640px)');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      setSrc(small.matches ? '/hero/phera-mobile.mp4' : '/hero/phera-desktop.mp4');
      setReduceMotion(reduce.matches);
    };
    update();
    small.addEventListener('change', update);
    reduce.addEventListener('change', update);
    return () => {
      small.removeEventListener('change', update);
      reduce.removeEventListener('change', update);
    };
  }, []);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      {reduceMotion ? (
        <img src="/hero/phera-poster.jpg" alt="" className="h-full w-full object-cover object-center" />
      ) : (
        <video
          key={src}
          className="h-full w-full object-cover object-center"
          autoPlay
          muted
          loop
          playsInline
          poster="/hero/phera-poster.jpg"
        >
          <source src={src} type="video/mp4" />
        </video>
      )}
      {/* Soft blush-white scrim keeps the dark hero text fully legible while the
          motion shimmers through underneath. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(255,255,255,0.86) 0%, rgba(255,250,252,0.64) 42%, rgba(255,255,255,0.9) 100%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(60% 55% at 50% 0%, rgba(171, 32, 77, 0.08), transparent 68%)' }}
      />
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen font-body">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 max-w-7xl mx-auto mt-3 sm:mt-4 mx-4 sm:mx-auto rounded-2xl toolbar-glass">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-wine-700 to-wine-900 text-white font-display font-bold text-sm shadow-sm">P</div>
            <span className="text-lg sm:text-xl font-display font-bold text-gray-900 tracking-tight">{APP_NAME}</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/login" className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-100/80 transition-all duration-300 ease-spring link-flourish">Sign in</Link>
            <Link to="/register" className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-wine-700 hover:bg-wine-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 ease-spring hover:scale-[1.02] active:scale-[0.98]">Start Planning</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <HeroVideoBackdrop />
        <RevealStagger className="text-center px-6 pt-28 sm:pt-36 pb-16 sm:pb-28 max-w-5xl mx-auto" stagger={0.14}>
          <RevealItem as="p" className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-wine-600 tracking-[0.15em] uppercase mb-4 sm:mb-5 px-3 py-1.5 rounded-full bg-wine-50/80 border border-wine-100/60">
            <Sparkles size={12} /> For 200 to 1000+ guest weddings
          </RevealItem>
          <RevealItem as="h1" className="text-3xl sm:text-5xl md:text-6xl font-display font-bold text-gray-900 leading-[1.08] mb-5 sm:mb-7 text-balance">
            <SplitText text="One place for your entire" stagger={0.05} />
            <br className="hidden sm:block" />{' '}
            <span className="relative inline-block">
              <ShinyText text="Indian wedding" baseColor="#ab204d" shineColor="#f4aabb" speed={5} />
              <svg className="absolute -bottom-1 left-0 w-full h-3 text-wine-200/60" viewBox="0 0 200 12" preserveAspectRatio="none">
                <path d="M0 8 Q50 0 100 8 T200 8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
          </RevealItem>
          <RevealItem as="p" className="text-sm sm:text-lg text-gray-600 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed text-pretty">
            Guest lists, seating charts, RSVPs, multiple events, different invite lists. All handled. No more WhatsApp chaos.
          </RevealItem>
          <RevealItem className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <ClickSpark as="div" sparkColor="#ab204d" className="w-full sm:w-auto">
              <Magnet strength={0.25} className="w-full sm:w-auto">
                <Link to="/register" className="group inline-flex items-center gap-2 px-7 py-3.5 text-base font-semibold text-white bg-wine-700 hover:bg-wine-800 rounded-2xl shadow-glow hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ease-spring w-full sm:w-auto justify-center">
                  Start Planning Free
                  <span className="inline-flex items-center justify-center size-6 rounded-full bg-white/15 group-hover:translate-x-0.5 transition-transform duration-300 ease-spring">
                    <ArrowRight size={14} />
                  </span>
                </Link>
              </Magnet>
            </ClickSpark>
            <p className="text-xs text-gray-400">Takes 2 minutes. No credit card.</p>
          </RevealItem>
        </RevealStagger>
      </section>

      {/* Stats band */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 rounded-2xl sm:rounded-[1.25rem] border border-wine-100/70 bg-gradient-to-br from-wine-50/70 via-white to-phera-50/40 shadow-card overflow-hidden divide-x divide-y sm:divide-y-0 divide-wine-100/60">
          <Stat value={<CountUp to={6} suffix="+" duration={1.4} />} label="Events" />
          <Stat value={<CountUp to={1000} suffix="+" separator="," duration={1.8} />} label="Guests" />
          <Stat value={<CountUp to={60} suffix="s" duration={1.6} />} label="Import time" />
          <Stat value="0" label="Apps for guests" />
        </div>
      </div>

      {/* Demo showcase section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-8 sm:pb-12">
        <div className="text-center mb-5 sm:mb-8">
          <h2 className="text-lg sm:text-2xl font-display font-bold text-gray-900 mb-2">See it in action</h2>
          <p className="text-sm text-gray-500">Watch how 500+ guests get organized in minutes</p>
        </div>
        <SpotlightCard className="rounded-[1.25rem] p-1.5 bg-gray-900/5 border border-gray-200/60" spotlightColor="rgba(171, 32, 77, 0.18)">
          <HeroDemo />
        </SpotlightCard>
      </div>

      {/* Features */}
      <section className="section-warm bg-pattern-floral relative">
        <div className="px-4 sm:px-6 py-12 sm:py-20 max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-3xl font-display font-bold text-gray-900 mb-2 text-balance">
              What you get
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">Tap any tile to see it in action.</p>
          </div>
          <FeatureTiles />
        </div>
      </section>
      {/* Pain → Solution */}
      <section className="section-blush bg-pattern-mandala relative">
        <div className="px-4 sm:px-6 py-12 sm:py-20 max-w-5xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-3xl font-display font-bold text-gray-900 mb-2 text-balance">
              Problems we solve
            </h2>
            <p className="text-sm text-gray-500">The stuff that actually made our own wedding stressful.</p>
          </div>
          <RevealGrid className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
            <ScenarioCard
              number="01"
              title="Parents who want to help (and hover)"
              problem="Your parents keep asking to see the seating chart, the guest list, the RSVPs. Every question is another text and another screenshot."
              solution="Give them a view-only login. They see the seating, RSVPs, and invite list anytime, and still can't change a thing."
            />
            <ScenarioCard
              number="02"
              title="Seating you can actually import"
              problem="You build the whole arrangement in a spreadsheet, then move one table and the entire thing falls apart."
              solution="Build your guest list, drag people to tables, or import a full arrangement in one go. Everything stays put when you move a table."
            />
            <ScenarioCard
              number="03"
              title="The photo line nobody wants to stand in"
              problem="Family and friends stand around waiting for group photos while their food goes cold and no one knows when they're up."
              solution="A live photo queue on one link. Everyone sees when their group is coming, so they can go eat and show up right on time."
            />
            <ScenarioCard
              number="04"
              title="RSVPs scattered across the family"
              problem="One cousin replies, three go quiet, and you're chasing a whole family just to pin down a single head count."
              solution="Guests are grouped by family with RSVPs tracked together. See who's in, who's out, and exactly who to nudge."
            />
          </RevealGrid>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 sm:px-6 py-12 sm:py-20 bg-white border-y border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl sm:text-3xl font-display font-bold text-gray-900 text-center mb-8 sm:mb-12 text-balance">
            How it works
          </h2>
          <RevealGrid className="relative grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
            <div className="hidden sm:block absolute top-6 left-[16.6%] right-[16.6%] h-px bg-gradient-to-r from-wine-200 via-phera-300 to-wine-200" aria-hidden="true" />
            <Step n="1" title="Add your events" description="Pick from templates (Mehndi, Sangeet, Haldi, Ceremony, Reception) or create your own." />
            <Step n="2" title="Import guests" description="Drag in your Excel. Names, families, and dietary needs detected automatically." />
            <Step n="3" title="Share and manage" description="Send RSVP links via WhatsApp. Arrange seating. Print place cards. Track responses." />
          </RevealGrid>
        </div>
      </section>

      {/* Free forever banner */}
      <section className="px-4 sm:px-6 py-16 sm:py-24 max-w-4xl mx-auto text-center">
        <div className="rounded-[1.5rem] sm:rounded-[2rem] bg-gradient-to-b from-wine-50/40 to-transparent p-1.5 sm:p-2 border border-wine-100/40">
          <div className="rounded-[1.25rem] sm:rounded-[1.75rem] border border-wine-200/40 bg-gradient-to-b from-white to-wine-50/30 p-6 sm:p-12 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8)]">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-wine-700 uppercase tracking-[0.15em] bg-wine-100/80 px-3 py-1.5 rounded-full mb-5 border border-wine-200/40">100% Free</span>
            <h2 className="text-2xl sm:text-4xl font-display font-bold text-gray-900 mb-4">Every feature. Unlimited guests. Free.</h2>
            <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto mb-6 sm:mb-8">Unlimited guests, events, tables, seating charts, and RSVPs — with no hidden upgrades and no paywalls.</p>
            <Link to="/register" className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-wine-700 text-white font-semibold shadow-glow hover:bg-wine-800 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ease-spring">
              Start Planning Free
              <span className="inline-flex items-center justify-center size-6 rounded-full bg-white/15 group-hover:translate-x-0.5 transition-transform duration-300 ease-spring">
                <ArrowRight size={14} />
              </span>
            </Link>
            <p className="mt-4 text-xs text-gray-400">No catch. No paywalls. Just plan your wedding.</p>
          </div>
        </div>
      </section>

      {/* Built for big Indian weddings */}
      <section className="px-4 sm:px-6 py-12 sm:py-20 max-w-5xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-3xl font-display font-bold text-gray-900 mb-2 text-balance">Built for a big Indian wedding</h2>
          <p className="text-sm text-gray-500">Most planners assume one event and 150 guests. Yours isn't that.</p>
        </div>
        <RevealGrid className="grid grid-cols-2 sm:grid-cols-4 auto-rows-[128px] sm:auto-rows-[150px] gap-3 sm:gap-4">
          <BentoTile className="col-span-2 row-span-2" icon={Calendar} title="Every event, its own guest list" description="Mehndi, Sangeet, Haldi, Ceremony, Reception \u2014 each with a different invite list and RSVP count." dark large />
          <BentoTile icon={Users} title="500 to 1000 guests" description="Imported from Excel in about a minute." />
          <BentoTile icon={Mail} title="Family RSVPs" description="Tracked as one group, not one cousin at a time." />
          <BentoTile icon={Grid3X3} title="Tables in any size" description="10, 12, or more \u2014 auto-suggest seating." />
          <BentoTile icon={Camera} title="Live photo queue" description="Guests see when their group is up." />
          <BentoTile className="col-span-2 sm:col-span-4" icon={Sparkles} title="Free, forever" description="Unlimited guests, events, tables, and RSVPs. No hidden upgrades, no paywalls." accent />
        </RevealGrid>
      </section>

      {/* FAQ */}
      <section className="section-warm">
        <div className="px-4 sm:px-6 py-12 sm:py-20 max-w-3xl mx-auto">
          <h2 className="text-xl sm:text-3xl font-display font-bold text-gray-900 text-center mb-8 sm:mb-12 text-balance">
            Questions
          </h2>
          <div className="space-y-3">
            <FAQItem
              question="How is this different from other wedding planners?"
              answer="Most tools support one event with about 150 guests and fixed table sizes. Phera handles 6+ events with different invite lists, 500 to 1000 guests, family-group RSVPs, and custom table sizes."
            />
            <FAQItem
              question="Can I import my existing guest list?"
              answer="Yes. Any Excel or CSV file. Drag it in, columns get detected, duplicates get caught within each family, families get grouped. Takes about 60 seconds for 500 guests."
            />
            <FAQItem
              question="Do guests need to create an account?"
              answer="No. They get a link via WhatsApp, search their name, and respond. No login, no app, no download."
            />
            <FAQItem
              question="Is this actually free?"
              answer="Yes. Unlimited guests, events, tables, seating charts, and RSVPs. Free forever. No hidden upgrades or paywalls."
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative text-center px-4 sm:px-6 py-20 sm:py-28 bg-gradient-to-br from-wine-800 via-wine-900 to-gray-900 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(50% 60% at 50% 0%, rgba(255, 255, 255, 0.06), transparent 70%)' }}
        ></div>
        <Reveal className="relative max-w-2xl mx-auto" y={28} amount={0.4}>
          <div className="inline-flex items-center justify-center size-12 rounded-2xl bg-white/10 backdrop-blur-sm mb-5 sm:mb-6 shadow-sm">
            <Sparkles className="text-phera-400" size={22} />
          </div>
          <h2 className="text-2xl sm:text-4xl font-display font-bold text-white mb-3 sm:mb-4 text-balance">Your wedding, organized in one place</h2>
          <p className="text-wine-200/80 mb-8 sm:mb-10 text-base sm:text-lg leading-relaxed">Free. Unlimited. Takes 2 minutes to set up.</p>
          <ClickSpark as="div" sparkColor="#ec7a97">
            <StarBorder color="#ec7a97" speed="5s" className="rounded-2xl">
              <Link to="/register" className="group inline-flex items-center gap-3 px-7 py-3.5 rounded-2xl bg-white text-wine-800 font-semibold hover:bg-gray-50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ease-spring shadow-lg">
                Get Started
                <span className="inline-flex items-center justify-center size-7 rounded-full bg-wine-100 group-hover:bg-wine-200 group-hover:translate-x-0.5 transition-all duration-300 ease-spring">
                  <ArrowRight size={14} className="text-wine-700" />
                </span>
              </Link>
            </StarBorder>
          </ClickSpark>
        </Reveal>
      </section>

      {/* Footer */}
      <LegalFooter />
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="px-3 py-5 sm:py-7 text-center">
      <p className="text-2xl sm:text-4xl font-display font-bold text-wine-700 tabular-nums leading-none">{value}</p>
      <p className="text-[10px] sm:text-xs text-gray-500 mt-1.5 sm:mt-2 uppercase tracking-wider">{label}</p>
    </div>
  );
}

function BentoTile({ icon: Icon, title, description, className = '', dark, large, accent }) {
  return (
    <div
      className={`reveal group relative overflow-hidden rounded-2xl border p-4 sm:p-5 flex flex-col justify-between transition-all duration-500 ease-spring hover:-translate-y-0.5 hover:shadow-lifted ${
        dark
          ? 'border-wine-800/40 bg-gradient-to-br from-wine-700 to-wine-900 shadow-glow'
          : accent
          ? 'border-wine-200/60 bg-gradient-to-br from-wine-50 to-phera-50/60 shadow-card'
          : 'border-gray-200/70 bg-white shadow-card'
      } ${className}`}
    >
      <span
        className={`inline-flex size-9 sm:size-10 items-center justify-center rounded-xl shadow-sm ${
          dark ? 'bg-white/15 text-white' : 'bg-gradient-to-br from-wine-50 to-phera-50 text-wine-700'
        }`}
      >
        <Icon size={large ? 22 : 18} />
      </span>
      <div>
        <h3 className={`font-semibold mb-1 ${large ? 'text-base sm:text-xl' : 'text-sm sm:text-[15px]'} ${dark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
        <p className={`leading-relaxed ${large ? 'text-xs sm:text-sm' : 'text-[11px] sm:text-xs'} ${dark ? 'text-wine-100/80' : 'text-gray-500'}`}>{description}</p>
      </div>
    </div>
  );
}

function Step({ n, title, description }) {
  return (
    <div className="reveal relative text-center">
      <span className="relative z-10 inline-flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-wine-600 to-wine-800 text-white font-display font-bold text-lg shadow-glow ring-4 ring-white">
        {n}
      </span>
      <h3 className="mt-4 text-sm sm:text-base font-semibold text-gray-900">{title}</h3>
      <p className="mt-1.5 text-xs sm:text-sm text-gray-500 leading-relaxed max-w-[15rem] mx-auto">{description}</p>
    </div>
  );
}

function ScenarioCard({ number, title, problem, solution }) {
  return (
    <div className="reveal rb-spotlight rounded-xl sm:rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-6 shadow-card hover:shadow-lifted transition-all duration-300"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--rb-x', `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty('--rb-y', `${e.clientY - r.top}px`);
      }}>
      <span className="inline-flex size-7 sm:size-8 items-center justify-center rounded-full bg-wine-50 text-[10px] sm:text-xs font-bold text-wine-600">{number}</span>
      <h3 className="text-sm sm:text-base font-semibold text-gray-900 mt-2 sm:mt-3 mb-3 sm:mb-4">{title}</h3>
      <div className="mb-3 sm:mb-4">
        <p className="text-[10px] sm:text-[11px] font-semibold text-red-400 uppercase tracking-wider mb-1">Before</p>
        <p className="text-xs sm:text-sm text-gray-500">{problem}</p>
      </div>
      <div className="pt-2 sm:pt-3 border-t border-gray-100">
        <p className="text-[10px] sm:text-[11px] font-semibold text-green-600 uppercase tracking-wider mb-1">After</p>
        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">{solution}</p>
      </div>
    </div>
  );
}

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-gray-200/60 bg-white overflow-hidden shadow-sm hover:shadow-card transition-shadow duration-300">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 sm:px-6 py-4 sm:py-5 text-left hover:bg-gray-50/50 transition-colors duration-200"
      >
        <span className="text-xs sm:text-sm font-semibold text-gray-900 pr-4">{question}</span>
        <span className={`text-gray-400 transition-transform duration-300 ease-spring text-sm shrink-0 ${open ? 'rotate-180' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg>
        </span>
      </button>
      <div className={`grid transition-all duration-300 ease-spring ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="px-5 sm:px-6 pb-5 sm:pb-6">
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{answer}</p>
          </div>
        </div>
      </div>
    </div>
  );
}


function RevealGrid({ className, children }) {
  const ref = useReveal();
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
