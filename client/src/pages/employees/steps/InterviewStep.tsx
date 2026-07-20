import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Send, CheckCircle2 } from 'lucide-react';
import type { AIEmployeeDTO } from '@vorizon/shared';
import { employeeApi, interviewApi } from '../../../lib/api/endpoints';
import { apiErrorMessage } from '../../../lib/api/client';
import { Button, Card, Field, Input, Textarea } from '../../../components/ui';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

export function InterviewStep({ employee, onSaved }: { employee: AIEmployeeDTO; onSaved: () => void }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [tone, setTone] = useState(employee.tone ?? '');
  const [rules, setRules] = useState((employee.rules ?? []).join('\n'));
  const [error, setError] = useState('');

  const send = useMutation({
    mutationFn: (msg: string) => interviewApi.send(employee.id, msg, sessionId),
    onSuccess: (res) => {
      setSessionId(res.sessionId);
      setMessages((m) => [...m, { role: 'assistant', content: res.reply }]);
    },
    onError: (e) => setError(apiErrorMessage(e)),
  });

  const saveConfig = useMutation({
    mutationFn: () =>
      employeeApi.update(employee.id, {
        tone,
        rules: rules.split('\n').map((r) => r.trim()).filter(Boolean),
      }),
    onError: (e) => setError(apiErrorMessage(e)),
  });

  const markTested = useMutation({
    mutationFn: () => employeeApi.markTested(employee.id),
    onSuccess: onSaved,
    onError: (e) => setError(apiErrorMessage(e)),
  });

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((m) => [...m, { role: 'user', content: input }]);
    send.mutate(input);
    setInput('');
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
      <Card className="flex h-[520px] flex-col">
        <h2 className="mb-3 text-lg font-semibold text-slate-800">Interview / Testing</h2>
        <div className="flex-1 space-y-3 overflow-y-auto rounded-lg bg-slate-50 p-4">
          {messages.length === 0 && (
            <p className="text-center text-sm text-slate-400">
              Talk to your AI like a real customer. Ask questions, test objection handling, and refine
              until it's perfect.
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
              <span
                className={`inline-block max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  m.role === 'user'
                    ? 'bg-brand-blue text-white'
                    : 'bg-white text-slate-700 shadow-sm'
                }`}
              >
                {m.content}
              </span>
            </div>
          ))}
          {send.isPending && <p className="text-sm text-slate-400">AI is typing…</p>}
        </div>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        <div className="mt-3 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message…"
          />
          <Button onClick={handleSend} disabled={send.isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      <div className="space-y-4">
        <Card>
          <h3 className="mb-3 font-semibold text-slate-800">Live Config</h3>
          <Field label="Tone">
            <Input value={tone} onChange={(e) => setTone(e.target.value)} placeholder="friendly, concise" />
          </Field>
          <Field label="Strict rules (one per line)">
            <Textarea
              rows={4}
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              placeholder="Never give discounts without approval"
            />
          </Field>
          <Button variant="secondary" onClick={() => saveConfig.mutate()} disabled={saveConfig.isPending}>
            {saveConfig.isPending ? 'Applying…' : 'Apply & re-test'}
          </Button>
        </Card>

        <Card>
          <h3 className="mb-2 font-semibold text-slate-800">Ready?</h3>
          <p className="mb-3 text-sm text-slate-500">
            When the AI behaves exactly as expected, mark it as tested to unlock activation.
          </p>
          <Button onClick={() => markTested.mutate()} disabled={markTested.isPending}>
            <CheckCircle2 className="h-4 w-4" />
            {employee.tested ? 'Tested ✓ (re-confirm)' : 'Mark as tested'}
          </Button>
        </Card>
      </div>
    </div>
  );
}
