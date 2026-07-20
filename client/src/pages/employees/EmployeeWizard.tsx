import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AIEmployeeDTO } from '@vorizon/shared';
import { employeeApi } from '../../lib/api/endpoints';
import { apiErrorMessage } from '../../lib/api/client';
import { Button, Card, Field, Input, Select, Spinner } from '../../components/ui';
import { KnowledgeStep } from './steps/KnowledgeStep';
import { ResponsibilitiesStep } from './steps/ResponsibilitiesStep';
import { PhoneStep } from './steps/PhoneStep';
import { BillingStep } from './steps/BillingStep';
import { InterviewStep } from './steps/InterviewStep';
import { ContactsStep } from './steps/ContactsStep';
import { CampaignStep } from './steps/CampaignStep';
import { ActivateStep } from './steps/ActivateStep';
import { Stepper } from './Stepper';

export function EmployeeWizardPage() {
  const { id } = useParams();
  if (!id) return <CreateEmployeeForm />;
  return <EmployeeSetup employeeId={id} />;
}

function CreateEmployeeForm() {
  const navigate = useNavigate();
  const [type, setType] = useState<'inbound' | 'outbound'>('inbound');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => employeeApi.create({ type, name, department, language: 'en-US', voice: 'default' }),
    onSuccess: (e) => navigate(`/employees/${e.id}`),
    onError: (err) => setError(apiErrorMessage(err)),
  });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 text-2xl font-bold text-slate-800">Create AI Employee</h1>
      <p className="mb-6 text-sm text-slate-500">Step 1 — choose the type and give it a name</p>
      <Card>
        <Field label="Type">
          <div className="grid grid-cols-2 gap-3">
            {(['inbound', 'outbound'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`rounded-lg border p-4 text-left transition ${
                  type === t ? 'border-brand-blue bg-brand-blue/5' : 'border-slate-200'
                }`}
              >
                <p className="font-semibold capitalize text-slate-800">{t}</p>
                <p className="text-xs text-slate-500">
                  {t === 'inbound' ? 'Answers incoming calls' : 'Calls your contact list'}
                </p>
              </button>
            ))}
          </div>
        </Field>
        <Field label="Employee Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Riley" />
        </Field>
        <Field label="Department / Role">
          <Input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="e.g. Front Desk"
          />
        </Field>
        {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
        <Button
          onClick={() => mutation.mutate()}
          disabled={!name || !department || mutation.isPending}
          className="w-full"
        >
          {mutation.isPending ? 'Creating…' : 'Create & continue'}
        </Button>
      </Card>
    </div>
  );
}

interface StepDef {
  key: string;
  title: string;
  render: (e: AIEmployeeDTO, refetch: () => void) => JSX.Element;
}

function stepsFor(type: 'inbound' | 'outbound'): StepDef[] {
  const knowledge: StepDef = {
    key: 'knowledge',
    title: 'Company Knowledge',
    render: (e) => <KnowledgeStep employeeId={e.id} />,
  };
  const responsibilities: StepDef = {
    key: 'responsibilities',
    title: 'Responsibilities',
    render: (e, r) => <ResponsibilitiesStep employeeId={e.id} onSaved={r} />,
  };
  const billing: StepDef = {
    key: 'billing',
    title: 'Billing',
    render: (e, r) => <BillingStep employee={e} onSaved={r} />,
  };
  const interview: StepDef = {
    key: 'interview',
    title: 'Interview & Testing',
    render: (e, r) => <InterviewStep employee={e} onSaved={r} />,
  };

  if (type === 'inbound') {
    return [
      knowledge,
      responsibilities,
      { key: 'phone', title: 'Phone Numbers', render: (e, r) => <PhoneStep employee={e} onSaved={r} /> },
      billing,
      interview,
      { key: 'activate', title: 'Activate', render: (e, r) => <ActivateStep employee={e} onSaved={r} /> },
    ];
  }
  return [
    knowledge,
    responsibilities,
    billing,
    interview,
    { key: 'contacts', title: 'Contact List', render: (e) => <ContactsStep employee={e} /> },
    { key: 'campaign', title: 'Campaign', render: (e, r) => <CampaignStep employee={e} onSaved={r} /> },
    { key: 'activate', title: 'Launch', render: (e, r) => <ActivateStep employee={e} onSaved={r} /> },
  ];
}

function EmployeeSetup({ employeeId }: { employeeId: string }) {
  const qc = useQueryClient();
  const { data: employee, isLoading, refetch } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => employeeApi.get(employeeId),
  });
  const [active, setActive] = useState(0);

  if (isLoading || !employee) return <Spinner />;

  const steps = stepsFor(employee.type);
  const refresh = () => {
    refetch();
    qc.invalidateQueries({ queryKey: ['employees'] });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">{employee.name}</h1>
        <p className="text-sm capitalize text-slate-500">
          {employee.type} AI employee · status: {employee.status.replace(/_/g, ' ')}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <Stepper steps={steps.map((s) => s.title)} active={active} onSelect={setActive} />
        <div>{steps[active].render(employee, refresh)}</div>
      </div>
    </div>
  );
}
