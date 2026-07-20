import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PhoneIncoming, PhoneOutgoing, Plus } from 'lucide-react';
import { employeeApi } from '../../lib/api/endpoints';
import { Badge, Button, Card, EmptyState, Spinner } from '../../components/ui';

export function EmployeesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeApi.list(),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">AI Employees</h1>
          <p className="text-sm text-slate-500">Build, train and deploy your AI workforce</p>
        </div>
        <Link to="/employees/new">
          <Button>
            <Plus className="h-4 w-4" /> New AI Employee
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <Spinner />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="No AI employees yet" hint="Create your first inbound or outbound AI employee." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.items.map((e) => (
            <Link key={e.id} to={`/employees/${e.id}`}>
              <Card className="transition hover:shadow-md">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {e.type === 'inbound' ? (
                      <PhoneIncoming className="h-5 w-5 text-brand-blue" />
                    ) : (
                      <PhoneOutgoing className="h-5 w-5 text-brand-purple" />
                    )}
                    <span className="text-xs font-medium uppercase text-slate-400">{e.type}</span>
                  </div>
                  <Badge>{e.status}</Badge>
                </div>
                <h3 className="text-lg font-semibold text-slate-800">{e.name}</h3>
                <p className="text-sm text-slate-500">{e.department || '—'}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
