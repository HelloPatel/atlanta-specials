import { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, Send, Bot, User, Trash2, AlertCircle, X, Minus, Check, Loader2, Wand2 } from 'lucide-react';
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
import { describeAction, executeAction } from '../../services/assistantActions';

const SUGGESTIONS = [
  'Which events still have the most pending RSVPs?',
  'Who hasn\u2019t RSVP\u2019d to the Haldi yet?',
  'Add my cousin Priya Patel on the bride\u2019s side and invite her to the Sangeet.',
  'Mark Rohit Sharma as attending the reception.',
  'How is our budget looking, and where might we be overspending?',
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
  if (!content) return null;
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

// A single proposed change the user can Confirm or Dismiss.
function ActionCard({ action, describe, onConfirm, onCancel }) {
  const { status, result } = action;
  const blocked = !!describe.error;
  const done = status === 'done';
  const failed = status === 'error';
  const cancelled = status === 'cancelled';
  const running = status === 'running';
  const settled = done || failed || cancelled;

  return (
    <div
      className={`rounded-xl border px-3 py-2.5 text-sm shadow-sm animate-message-in ${
        done
          ? 'border-green-200 bg-green-50'
          : failed
            ? 'border-red-200 bg-red-50'
            : blocked
              ? 'border-amber-200 bg-amber-50'
              : 'border-wine-200 bg-white'
      }`}
    >
      <div className="flex items-start gap-2">
        <div
          className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center ${
            done
              ? 'bg-green-100 text-green-700'
              : failed
                ? 'bg-red-100 text-red-700'
                : 'bg-wine-100 text-wine-700'
          }`}
        >
          {done ? <Check className="w-3.5 h-3.5" /> : running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`font-medium leading-snug ${done ? 'text-green-800' : failed ? 'text-red-800' : blocked ? 'text-amber-800' : 'text-gray-800'}`}>
            {describe.label}
          </p>
          {blocked && !settled && (
            <p className="text-xs text-amber-700 mt-0.5">{describe.error}</p>
          )}
          {settled && result && (
            <p className={`text-xs mt-0.5 ${failed ? 'text-red-700' : 'text-gray-500'}`}>{result}</p>
          )}
          {cancelled && !result && <p className="text-xs text-gray-400 mt-0.5">Dismissed.</p>}
        </div>
      </div>

      {!settled && (
        <div className="flex items-center gap-2 mt-2 pl-8">
          {!blocked && (
            <button
              onClick={onConfirm}
              disabled={running}
              className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-60 ${
                describe.destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-wine-600 hover:bg-wine-700'
              }`}
            >
              {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {describe.destructive ? 'Delete' : 'Confirm'}
            </button>
          )}
          <button
            onClick={onCancel}
            disabled={running}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 disabled:opacity-60"
          >
            {blocked ? 'Dismiss' : 'Cancel'}
          </button>
        </div>
      )}
    </div>
  );
}

// Keep a short rolling history per wedding so closing the panel (or a refresh)
// doesn't wipe the recent conversation. Only the plain role/content/error is
// stored — proposed actions are intentionally dropped so reloaded history is
// read-only and can't re-trigger stale writes.
const HISTORY_LIMIT = 30;
function historyKey(id) {
  return id ? `phera:assistantHistory:${id}` : null;
}
function loadHistory(id) {
  const key = historyKey(id);
  if (!key || typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function saveHistory(id, messages) {
  const key = historyKey(id);
  if (!key || typeof window === 'undefined') return;
  try {
    const slim = messages
      .slice(-HISTORY_LIMIT)
      .map((m) => ({ role: m.role, content: m.content, error: !!m.error }));
    window.localStorage.setItem(key, JSON.stringify(slim));
  } catch {
    /* storage disabled / private mode — history just won't persist */
  }
}

export default function AssistantChat({ onClose, onMinimize, dragHandleProps }) {
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

  // Always-fresh snapshot of the data executors need, so confirm handlers created
  // in earlier renders still run against the latest guests/events.
  const dataRef = useRef({ weddingId, guests, events });
  dataRef.current = { weddingId, guests, events };

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

  // Restore recent conversation for this wedding (runs before the persist
  // effect below, so a fresh mount never clobbers saved history with []).
  useEffect(() => {
    setMessages(loadHistory(weddingId));
  }, [weddingId]);

  // Persist on every change. Skip empty saves so mounting doesn't wipe history;
  // clearing is handled explicitly by clearConversation().
  useEffect(() => {
    if (weddingId && messages.length > 0) saveHistory(weddingId, messages);
  }, [messages, weddingId]);

  function clearConversation() {
    setMessages([]);
    saveHistory(weddingId, []);
  }

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
      const { reply, actions } = await sendAssistantMessage({
        messages: nextMessages,
        context: contextText,
      });
      const proposed = (actions || []).map((a, idx) => ({
        id: a.id || `act-${Date.now()}-${idx}`,
        name: a.name,
        arguments: a.arguments || {},
        status: 'pending',
        result: null,
      }));
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: reply, actions: proposed },
      ]);
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

  // Update one action inside one message by id.
  function patchAction(msgIndex, actionId, patch) {
    setMessages((prev) =>
      prev.map((m, i) =>
        i === msgIndex
          ? { ...m, actions: m.actions.map((a) => (a.id === actionId ? { ...a, ...patch } : a)) }
          : m
      )
    );
  }

  async function runAction(msgIndex, action) {
    patchAction(msgIndex, action.id, { status: 'running', result: null });
    try {
      const result = await executeAction(action.name, action.arguments, dataRef.current);
      patchAction(msgIndex, action.id, { status: 'done', result });
      toast.success(result);
    } catch (err) {
      const message = err?.message || 'That change could not be made.';
      patchAction(msgIndex, action.id, { status: 'error', result: message });
      toast.error(message);
    }
  }

  function cancelAction(msgIndex, action) {
    patchAction(msgIndex, action.id, { status: 'cancelled' });
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
      {/* Header — doubles as the drag handle on desktop */}
      <div
        {...dragHandleProps}
        className={`flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white/70 backdrop-blur ${
          dragHandleProps ? 'cursor-move select-none touch-none' : ''
        }`}
      >
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
              onClick={clearConversation}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-wine-700 hover:bg-wine-50 transition-colors"
              title="Clear conversation"
              aria-label="Clear conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {onMinimize && (
            <button
              onClick={onMinimize}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="Minimize"
              aria-label="Minimize assistant"
            >
              <Minus className="w-4 h-4" />
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
              Ask about planning, RSVPs, seating, or the budget — or ask me to add a
              guest, set an RSVP, or change a seat. I&apos;ll confirm before saving.
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
            <div key={i} className="space-y-2">
              <MessageBubble role={m.role} content={m.content} error={m.error} />
              {m.actions?.length > 0 && (
                <div className="ml-10 space-y-2">
                  {m.actions.map((a) => (
                    <ActionCard
                      key={a.id}
                      action={a}
                      describe={describeAction(a.name, a.arguments, { guests, events })}
                      onConfirm={() => runAction(i, a)}
                      onCancel={() => cancelAction(i, a)}
                    />
                  ))}
                </div>
              )}
            </div>
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
          I can get things wrong, and any change I suggest waits for your confirmation
          before it&apos;s saved. Double-check anything important.
        </p>
      </div>
    </div>
  );
}
