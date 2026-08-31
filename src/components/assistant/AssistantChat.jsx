import { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, Send, Bot, User, Trash2, AlertCircle } from 'lucide-react';
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
      <span className="w-1.5 h-1.5 rounded-full bg-wine-400 animate-bounce [animation-delay:-0.15s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-wine-400 animate-bounce" />
    </span>
  );
}

function MessageBubble({ role, content }) {
  const isUser = role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-wine-600 text-white' : 'bg-wine-100 text-wine-700'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words ${
          isUser
            ? 'bg-wine-600 text-white rounded-tr-sm'
            : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
        }`}
      >
        {content}
      </div>
    </div>
  );
}

export default function AssistantChat() {
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
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

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
    <div className="flex flex-col h-[calc(100vh-9rem)] min-h-[480px] bg-gradient-to-b from-wine-50/40 to-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-gray-200 bg-white/70 backdrop-blur">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-wine-500 to-wine-700 text-white flex items-center justify-center shadow-sm">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-900 leading-tight">
            Phera Assistant
          </h2>
          <p className="text-xs text-gray-500 leading-tight">
            Your AI wedding-planning helper — grounded in your wedding data
          </p>
        </div>
        {!isEmpty && (
          <button
            onClick={() => setMessages([])}
            className="ml-auto inline-flex items-center gap-1 text-xs text-gray-500 hover:text-wine-700 transition-colors"
            title="Clear conversation"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-wine-500 to-wine-700 text-white flex items-center justify-center shadow-md mb-4">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              How can I help with your wedding?
            </h3>
            <p className="text-sm text-gray-500 mt-1 mb-5">
              Ask about planning, timelines, RSVPs, seating, catering, or your budget.
              I can see your current wedding details.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs sm:text-sm px-3 py-2 rounded-full border border-wine-200 bg-white text-wine-700 hover:bg-wine-50 hover:border-wine-300 transition-colors text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <MessageBubble key={i} role={m.role} content={m.content} />
          ))
        )}

        {loading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-wine-100 text-wine-700 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3">
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
            Open or select a wedding so I can use its details.
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask anything about your wedding…"
            className="flex-1 resize-none max-h-32 rounded-xl border border-gray-300 focus:border-wine-500 focus:ring-2 focus:ring-wine-200 outline-none px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400"
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="flex-shrink-0 w-11 h-11 rounded-xl bg-wine-600 text-white flex items-center justify-center hover:bg-wine-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Send"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[11px] text-gray-400 mt-1.5 px-1">
          Phera Assistant can make mistakes. It can&apos;t change your wedding yet — it gives
          guidance and answers. Double-check important details.
        </p>
      </div>
    </div>
  );
}
