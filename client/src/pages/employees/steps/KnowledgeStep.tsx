import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, Upload } from 'lucide-react';
import { KNOWLEDGE_KINDS } from '@vorizon/shared';
import { knowledgeApi } from '../../../lib/api/endpoints';
import { apiErrorMessage } from '../../../lib/api/client';
import { Button, Card, Field, Input, Select, Spinner, Textarea } from '../../../components/ui';

const TEXT_KINDS = KNOWLEDGE_KINDS.filter((k) => k !== 'file');

export function KnowledgeStep({ employeeId }: { employeeId: string }) {
  const qc = useQueryClient();
  const [kind, setKind] = useState('description');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  const { data: items, isLoading } = useQuery({
    queryKey: ['knowledge', employeeId],
    queryFn: () => knowledgeApi.list(employeeId),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['knowledge', employeeId] });
    qc.invalidateQueries({ queryKey: ['employee', employeeId] });
  };

  const addText = useMutation({
    mutationFn: () => knowledgeApi.addText(employeeId, { kind, title, content }),
    onSuccess: () => {
      setTitle('');
      setContent('');
      setError('');
      invalidate();
    },
    onError: (e) => setError(apiErrorMessage(e)),
  });

  const addFile = useMutation({
    mutationFn: (file: File) => knowledgeApi.addFile(employeeId, file),
    onSuccess: invalidate,
    onError: (e) => setError(apiErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (kid: string) => knowledgeApi.remove(employeeId, kid),
    onSuccess: invalidate,
  });

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Add Company Knowledge</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <Select value={kind} onChange={(e) => setKind(e.target.value)}>
              {TEXT_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
        </div>
        <Field label="Content">
          <Textarea rows={4} value={content} onChange={(e) => setContent(e.target.value)} />
        </Field>
        {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
        <div className="flex items-center gap-3">
          <Button onClick={() => addText.mutate()} disabled={!title || !content || addText.isPending}>
            Add knowledge
          </Button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Upload className="h-4 w-4" />
            Upload file (PDF, DOCX, TXT, CSV, XLSX)
            <input
              type="file"
              className="hidden"
              accept=".pdf,.docx,.txt,.csv,.xlsx,.xls"
              onChange={(e) => e.target.files?.[0] && addFile.mutate(e.target.files[0])}
            />
          </label>
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 font-semibold text-slate-800">Knowledge Base</h3>
        {isLoading ? (
          <Spinner />
        ) : !items || items.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">No knowledge added yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((k) => (
              <li key={k.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-slate-700">{k.title}</p>
                  <p className="text-xs uppercase text-slate-400">{k.kind}</p>
                  {k.parsedTextPreview && (
                    <p className="mt-1 text-xs text-slate-400">{k.parsedTextPreview}…</p>
                  )}
                </div>
                <button
                  onClick={() => remove.mutate(k.id)}
                  className="text-slate-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
