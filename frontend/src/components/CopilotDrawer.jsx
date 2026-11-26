import { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  X,
  Send,
  Mic,
  MicOff,
  Truck,
  Radio,
  Building2,
  CheckCircle2,
  Trash2,
  ArrowRight,
  Clock,
  Navigation,
  Zap,
} from 'lucide-react';
import { COPILOT_QUICK_CHIPS, runCopilotQuery } from '../utils/copilotEngine';
import { BG_COLORS } from '../constants/blood';

function renderFormattedText(text) {
  const lines = String(text || '').split('\n');
  return lines.map((line, lineIdx) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={lineIdx} className={lineIdx > 0 ? 'mt-1.5' : ''}>
        {parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={pIdx} className="font-bold text-white">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <span key={pIdx}>{part}</span>;
        })}
      </p>
    );
  });
}

export default function CopilotDrawer({
  liveContext,
  geminiApiKey = '',
  onExecuteTransfer,
  onBroadcastDonorAlert,
  onInspectHospital,
  onNavigateView,
  readOnly = false,
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [executedActionIds, setExecutedActionIds] = useState(() => new Set());
  const [executingActionId, setExecutingActionId] = useState(null);
  const [listening, setListening] = useState(false);
  const [voiceHint, setVoiceHint] = useState('');

  const [messages, setMessages] = useState(() => [
    {
      id: 'welcome-copilot',
      role: 'assistant',
      mode: geminiApiKey?.trim() ? 'gemini' : 'smart',
      text: `Hello! I'm **HemoSync Copilot**, connected live to all **${
        liveContext?.hospitals?.length || 12
      } Ranchi hospitals & blood banks**.\n\nAsk me about urgent shortages, expiring <24h batches, optimal cold-chain routes, or speak a command using the mic.`,
      actions: [],
      timestamp: new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
  ]);

  const scrollEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (open) {
      scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, thinking]);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore cleanup errors
      }
    };
  }, []);

  const criticalAlerts = liveContext?.kpi?.critical_alerts || 0;
  const hasUrgent = criticalAlerts > 0 || liveContext?.traumaActive;
  const llmEnabled = Boolean(String(geminiApiKey || '').trim());

  const handleSend = async overrideText => {
    const q = String(overrideText ?? input).trim();
    if (!q || thinking) return;

    const nowLabel = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMsg = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: q,
      timestamp: nowLabel,
    };

    setMessages(prev => [...prev, userMsg]);
    if (!overrideText) setInput('');
    setVoiceHint('');
    setThinking(true);

    try {
      const response = await runCopilotQuery(q, liveContext, { geminiApiKey });
      const assistantMsg = {
        id: `ast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        role: 'assistant',
        mode: response.mode,
        text: response.text,
        actions: response.actions || [],
        timestamp: new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } finally {
      setThinking(false);
    }
  };

  const handleActionClick = async action => {
    if (!action || executingActionId) return;

    if (action.type === 'inspect_hospital' && action.hospital) {
      onInspectHospital(action.hospital);
      return;
    }

    if (action.type === 'navigate_view' && action.view) {
      onNavigateView(action.view, action.bloodGroup);
      return;
    }

    setExecutingActionId(action.id);
    try {
      if (action.type === 'execute_transfer') {
        await onExecuteTransfer(action.payload);
        setExecutedActionIds(prev => new Set([...prev, action.id]));
      } else if (action.type === 'broadcast_donor_alert') {
        await onBroadcastDonorAlert(action.payload.bloodGroup, action.payload.options);
        setExecutedActionIds(prev => new Set([...prev, action.id]));
      }
    } finally {
      setExecutingActionId(null);
    }
  };

  const handleVoiceToggle = () => {
    if (listening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore stop errors
      }
      setListening(false);
      return;
    }

    const SpeechRec =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    if (!SpeechRec) {
      setVoiceHint(
        'Voice-to-text requires Chrome/Edge SpeechRecognition API — type your command below.'
      );
      inputRef.current?.focus();
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = 'en-IN';
      recognition.interimResults = true;
      recognition.continuous = false;
      recognitionRef.current = recognition;

      setVoiceHint('Listening... speak a command like "Find O-negative blood in Ranchi"');
      setListening(true);

      let finalTranscript = '';

      recognition.onresult = event => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const transcript = event.results[i][0]?.transcript || '';
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interim += transcript;
          }
        }
        const combined = (finalTranscript || interim).trim();
        if (combined) setInput(combined);
      };

      recognition.onerror = () => {
        setListening(false);
        setVoiceHint('Microphone unavailable or permission denied — type your query below.');
      };

      recognition.onend = () => {
        setListening(false);
        const spoken = finalTranscript.trim();
        if (spoken) {
          setVoiceHint('');
          void handleSend(spoken);
        }
      };

      recognition.start();
    } catch {
      setListening(false);
      setVoiceHint('Voice input unavailable in this browser — type your command below.');
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `reset-${Date.now()}`,
        role: 'assistant',
        mode: llmEnabled ? 'gemini' : 'smart',
        text: `Context refreshed across all **${
          liveContext?.hospitals?.length || 12
        } Ranchi nodes**. What would you like to inspect or dispatch?`,
        actions: [],
        timestamp: new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    ]);
  };

  return (
    <>
      {/* Floating 'Ask HemoSync AI' Button in Bottom-Right Corner */}
      {!open && (
        <button
          id="tour-copilot-btn"
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open HemoSync AI Copilot"
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[1130] group flex items-center gap-2 sm:gap-2.5 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs font-extrabold text-white bg-gradient-to-r from-rose-600 via-red-600 to-indigo-700 hover:from-rose-500 hover:to-indigo-600 border border-rose-300/40 shadow-[0_10px_35px_rgba(225,29,72,0.45),0_0_24px_rgba(99,102,241,0.3)] transition-colors cursor-pointer"
        >
          <span className="relative flex items-center justify-center w-6 h-6 rounded-lg bg-white/15">
            <Sparkles size={14} className="text-white" />
            {hasUrgent && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-85" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400 border border-slate-950" />
              </span>
            )}
          </span>
          <span>Ask HemoSync AI</span>
          {criticalAlerts > 0 && (
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-slate-950/55 text-amber-200 border border-amber-300/35">
              {criticalAlerts}
            </span>
          )}
        </button>
      )}

      {/* Non-Blocking Dark Right-Side Copilot Slide-Over Drawer */}
      {open && (
        <aside
          aria-label="HemoSync AI Copilot Drawer"
          className="fixed bottom-3 right-[2.5vw] sm:top-16 sm:right-4 sm:bottom-4 z-[1140] w-[95vw] sm:w-[430px] max-h-[88vh] sm:max-h-[calc(100vh-5rem)] rounded-2xl bg-[#070e1f] border border-slate-700/85 shadow-[0_24px_65px_rgba(0,0,0,0.75),0_0_35px_rgba(225,29,72,0.16)] flex flex-col overflow-y-auto sm:overflow-hidden slide-in"
        >
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-slate-800/90 bg-gradient-to-r from-rose-950/45 via-slate-900/90 to-indigo-950/45 flex items-center justify-between gap-2 flex-shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500/25 to-indigo-500/25 border border-rose-400/40 flex items-center justify-center text-rose-300 flex-shrink-0">
                <Bot size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xs font-extrabold text-white truncate">HemoSync Copilot</h2>
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full border ${
                      llmEnabled
                        ? 'bg-violet-500/20 text-violet-300 border-violet-400/40'
                        : 'bg-emerald-500/15 text-emerald-300 border-emerald-400/35'
                    }`}
                  >
                    {llmEnabled ? 'Gemini 3 Flash' : 'Live State Engine'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {liveContext?.hospitals?.length || 12} Ranchi nodes synced ·{' '}
                  {criticalAlerts} critical alerts
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={handleClearChat}
                title="Reset conversation"
                aria-label="Clear Copilot chat"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <Trash2 size={14} />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close HemoSync Copilot"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Scrollable Message Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(msg => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white rounded-br-sm shadow-lg'
                        : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-bl-sm'
                    }`}
                  >
                    {renderFormattedText(msg.text)}

                    {/* Executable Action Cards Inside Assistant Chat Bubble */}
                    {!isUser &&
                      msg.actions?.filter(
                        a =>
                          !readOnly ||
                          (a.type !== 'execute_transfer' && a.type !== 'broadcast_donor_alert')
                      ).length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-2">
                        {msg.actions
                          .filter(
                            a =>
                              !readOnly ||
                              (a.type !== 'execute_transfer' && a.type !== 'broadcast_donor_alert')
                          )
                          .map(action => {
                          const isExecuted = executedActionIds.has(action.id);
                          const isBusy = executingActionId === action.id;

                          if (action.type === 'execute_transfer') {
                            const bgColor =
                              BG_COLORS[action.meta?.blood_group] || '#f43f5e';
                            return (
                              <div
                                key={action.id}
                                className="rounded-xl p-3 bg-slate-950/90 border border-sky-500/35 space-y-2"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] font-mono font-bold text-amber-300 flex items-center gap-1">
                                    <Zap size={11} />
                                    AI RECOMMENDED DISPATCH
                                  </span>
                                  <span
                                    className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                                    style={{
                                      background: `${bgColor}22`,
                                      color: bgColor,
                                      border: `1px solid ${bgColor}40`,
                                    }}
                                  >
                                    {action.meta?.units}u {action.meta?.blood_group}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white flex-wrap">
                                  <span className="text-sky-300">
                                    {action.meta?.from_hospital}
                                  </span>
                                  <ArrowRight size={11} className="text-slate-500" />
                                  <span>{action.meta?.to_hospital}</span>
                                </div>

                                <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
                                  <span className="flex items-center gap-1">
                                    <Navigation size={10} className="text-sky-400" />
                                    {action.meta?.distance_km} km
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock size={10} className="text-amber-400" />
                                    ETA ~{action.meta?.eta_minutes}m
                                  </span>
                                  {action.meta?.note && (
                                    <span className="text-rose-300">{action.meta.note}</span>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  disabled={isExecuted || isBusy}
                                  onClick={() => handleActionClick(action)}
                                  className={`w-full py-2 px-3 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                    isExecuted
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                                      : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/40'
                                  }`}
                                >
                                  {isExecuted ? (
                                    <>
                                      <CheckCircle2 size={13} />
                                      Transfer Executed &amp; En Route
                                    </>
                                  ) : isBusy ? (
                                    <>
                                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      Dispatching Courier...
                                    </>
                                  ) : (
                                    <>
                                      <Truck size={13} />
                                      {action.label}
                                    </>
                                  )}
                                </button>
                              </div>
                            );
                          }

                          if (action.type === 'broadcast_donor_alert') {
                            return (
                              <div
                                key={action.id}
                                className="rounded-xl p-3 bg-slate-950/90 border border-rose-500/35 space-y-2"
                              >
                                <div className="flex items-center justify-between text-[10px] font-mono">
                                  <span className="text-rose-300 font-bold flex items-center gap-1">
                                    <Radio size={11} />
                                    SMS + WHATSAPP + PUSH DRAFT
                                  </span>
                                  <span className="text-slate-400">
                                    {action.meta?.radius_km} km geo-fence
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-300 bg-slate-900/90 border border-slate-800 rounded-lg p-2 font-mono leading-relaxed">
                                  {action.draftMessage}
                                </p>
                                <button
                                  type="button"
                                  disabled={isExecuted || isBusy}
                                  onClick={() => handleActionClick(action)}
                                  className={`w-full py-2 px-3 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                    isExecuted
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                                      : 'bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white border border-rose-400/40'
                                  }`}
                                >
                                  {isExecuted ? (
                                    <>
                                      <CheckCircle2 size={13} />
                                      Emergency Alert Broadcasted
                                    </>
                                  ) : isBusy ? (
                                    <>
                                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      Sending Blast...
                                    </>
                                  ) : (
                                    <>
                                      <Radio size={13} />
                                      {action.label}
                                    </>
                                  )}
                                </button>
                              </div>
                            );
                          }

                          return (
                            <button
                              key={action.id}
                              type="button"
                              onClick={() => handleActionClick(action)}
                              className="w-full py-1.5 px-3 rounded-lg text-[11px] font-semibold bg-slate-800/90 hover:bg-slate-700 text-sky-300 border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <Building2 size={12} />
                              {action.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <span className="text-[9px] font-mono text-slate-500 mt-1 px-1">
                    {isUser
                      ? `You · ${msg.timestamp}`
                      : `${
                          msg.mode === 'gemini'
                            ? 'Gemini 3 Flash'
                            : msg.mode === 'smart-fallback'
                            ? 'Smart Engine (Fallback)'
                            : 'HemoSync AI'
                        } · ${msg.timestamp}`}
                  </span>
                </div>
              );
            })}

            {thinking && (
              <div className="flex items-start">
                <div className="rounded-2xl rounded-bl-sm bg-slate-900/90 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-400 flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                  Analyzing live Ranchi telemetry...
                </div>
              </div>
            )}
            <div ref={scrollEndRef} />
          </div>

          {/* Clickable Quick Action Chips Above Input Box */}
          <div className="px-3.5 pt-2.5 pb-2 border-t border-slate-800/80 bg-slate-950/60 flex-shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Quick Command Chips
            </p>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {COPILOT_QUICK_CHIPS.map(chip => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleSend(chip)}
                  className="flex-shrink-0 px-2.5 py-1.5 rounded-xl text-[11px] font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-rose-500/45 transition-all cursor-pointer whitespace-nowrap"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Input Bar + Voice-to-Text Mic Button */}
          <form
            onSubmit={e => {
              e.preventDefault();
              void handleSend();
            }}
            className="p-3 border-t border-slate-800/90 bg-[#060b19]/95 flex-shrink-0 space-y-1.5"
          >
            {voiceHint && (
              <p className="text-[10px] text-amber-300 px-1 leading-snug">{voiceHint}</p>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleVoiceToggle}
                title={listening ? 'Stop voice recognition' : 'Speak voice command'}
                aria-label={listening ? 'Stop voice recognition' : 'Voice command microphone'}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex-shrink-0 ${
                  listening
                    ? 'bg-rose-600 text-white border-rose-400 animate-pulse shadow-[0_0_18px_rgba(225,29,72,0.6)]'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700'
                }`}
              >
                {listening ? <MicOff size={15} /> : <Mic size={15} />}
              </button>

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={
                  listening
                    ? 'Listening for command...'
                    : 'Ask about O-, RIMS, <24h expiry, transfers...'
                }
                aria-label="Ask HemoSync AI Copilot"
                className="flex-1 min-w-0 px-3 py-2.5 rounded-xl text-xs bg-slate-900/95 border border-slate-700/80 text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500/65"
              />

              <button
                type="submit"
                disabled={!input.trim() || thinking}
                aria-label="Send message to HemoSync Copilot"
                className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white border border-rose-400/40 cursor-pointer disabled:cursor-not-allowed flex-shrink-0 transition-all"
              >
                <Send size={15} />
              </button>
            </div>
          </form>
        </aside>
      )}
    </>
  );
}
