import { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, Send, Bot, User, Trash2, AlertCircle, X } from 'lucide-react';
import { useWedding } from '../../contexts/WeddingContext';
import { useToast } from '../ui';
import { subscribeToGuests } from '../../services/guestService';
import { subscribeToEvents } from '../../services/eventService';
import {
  subscribeToBudgetItems,
  subscribeToBudgetTarget,
} from '../../services/budgetService';
import {
  buildWeddingContext,
  sendAssistantMessage,
} from '../../services/assistantService';

const SUGGESTIONS = [
  'What should I be working on next for our wedding?',
  'Which events still have the most pending RSVPs?',
  'Help me draft a day-of timeline for the ceremony and reception.',
  'How is our budget looking, and where might we be overspending?',
  'Give me a checklist for the 4 weeks before the wedding.',
];

function TypingDots() {
  return (
    <span className="inline-flex gap-1 items-center" aria-label="Assistant is typing">
      <span className="w-1.5 h-1.5 rounded-full bg-wine-400 animate-bounce [animation-delay:-0.3s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-wine-500 animate-bounce [animation-delay:-0.15s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-wine-600 animate-bounce" />
    </span>
  );
}

function Avatar({ isUser }) {
  return (
    <div
      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
        isUser
          ? 'bg-gradient-to-br from-wine-500 to-wine-700 text-white'
          : 'bg-white ring-1 ring-wine-100 text-wine-700'
      }`}
    >
      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
    </div>
  );
}

function MessageBubble({ role, content, error }) {
  const isUser = role === 'user';
  return (
    <div className={`flex gap-2.5 animate-message-in ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <Avatar isUser={isUser} />
      <div
        className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
          isUser
            ? 'bg-gradient-to-br from-wine-600 to-wine-700 text-white rounded-tr-md'
            : error
              ? 'bg-amber-50 border border-amber-200 text-amber-800 rounded-tl-md'
              : 'bg-white border border-gray-200/80 text-gray-800 rounded-tl-md'
        }`}
      >
        {content}
      </div>
    </div>
  );
}

export default function AssistantChat({ onClose }) {
  const { activeWedding } = useWedding();
  const toast = useToast();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Live wedding data for grounding.
  const [guests, setGuests] = useState([]);
  const [events, setEvents] = useState([]);
  const [budgetItems, setBudgetItems] = useState([]);
  const [budgetTarget, setBudgetTarget] = useState(0);

  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const weddingId = activeWedding?.id;

  useEffect(() => {
    if (!weddingId) {
      setGuests([]);
      setEvents([]);
      setBudgetItems([]);
      setBudgetTarget(0);
      return;
    }
    const unsubs = [
      subscribeToGuests(weddingId, setGuests),
      subscribeToEvents(weddingId, setEvents),
      subscribeToBudgetItems(weddingId, setBudgetItems),
      subscribeToBudgetTarget(weddingId, setBudgetTarget),
    ];
    return () => unsubs.forEach((u) => u && u());
  }, [weddingId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? 'auto' : 'smooth' });
  }, [messages, loading]);

  // Focus the composer when the chat opens.
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const contextText = useMemo(
    () =>
      activeWedding
        ? buildWeddingContext(activeWedding, {
            guests,
            events,
            budgetItems,
            budgetTarget,
          })
        : '',
    [activeWedding, guests, events, budgetItems, budgetTarget]
  );

  async function send(text) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const nextMessages = [...messages, { role: 'user', content }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const { reply } = await sendAssistantMessage({
        messages: nextMessages,
        context: contextText,
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      const message = err?.message || 'The assistant is unavailable right now.';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ ${message}`, error: true },
      ]);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-wine-50/40 to-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white/70 backdrop-blur">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-wine-500 to-wine-700 text-white flex items-center justify-center shadow-sm">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-900 leading-tight">
            Phera Assistant
          </h2>
          <p className="text-xs text-gray-500 leading-tight truncate">
            Here to help with the wedding
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          {!isEmpty && (
            <button
              onClick={() => setMessages([])}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-wine-700 hover:bg-wine-50 transition-colors"
              title="Clear conversation"
              aria-label="Clear conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="Close"
              aria-label="Close assistant"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-wine-500 to-wine-700 text-white flex items-center justify-center shadow-md mb-4 animate-message-in">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 animate-message-in [animation-delay:60ms]">
              What can I help you with?
            </h3>
            <p className="text-sm text-gray-500 mt-1 mb-5 animate-message-in [animation-delay:120ms]">
              Ask about planning, timelines, RSVPs, seating, or the budget.
              I can see the details for this wedding.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  style={{ animationDelay: `${180 + i * 60}ms` }}
                  className="animate-message-in text-xs sm:text-sm px-3 py-2 rounded-full border border-wine-200 bg-white text-wine-700 hover:bg-wine-50 hover:border-wine-300 hover:-translate-y-0.5 active:translate-y-0 transition-all text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <MessageBubble key={i} role={m.role} content={m.content} error={m.error} />
          ))
        )}

        {loading && (
          <div className="flex gap-2.5 animate-message-in">
            <Avatar isUser={false} />
            <div className="bg-white border border-gray-200/80 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
              <TypingDots />
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-gray-200 bg-white/80 backdrop-blur px-3 sm:px-4 py-3">
        {!weddingId && (
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Pick a wedding first so I can pull in its details.
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              const el = e.target;
              el.style.height = 'auto';
              el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
            }}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask anything about the wedding…"
            className="flex-1 resize-none max-h-32 rounded-xl border border-gray-300 focus:border-wine-500 focus:ring-2 focus:ring-wine-200 outline-none px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 transition-shadow"
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="flex-shrink-0 w-11 h-11 rounded-xl bg-wine-600 text-white flex items-center justify-center hover:bg-wine-700 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all shadow-sm"
            title="Send"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[11px] text-gray-400 mt-1.5 px-1">
          I can get things wrong, and I can&apos;t edit your wedding yet — I just give
          advice and answers. Double-check anything important.
        </p>
      </div>
    </div>
  );
}
