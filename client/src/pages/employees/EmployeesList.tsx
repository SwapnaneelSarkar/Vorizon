import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Bot, PhoneIncoming, PhoneOutgoing, Plus, Trash2 } from 'lucide-react';
import { employeeApi } from '../../lib/api/endpoints';
import { apiErrorMessage } from '../../lib/api/client';
import {
  Badge,
  Button,
  Card,
  ConfirmButton,
  EmptyState,
  PageHeader,
  Spinner,
  toast,
} from '../../components/ui';
import { cn } from '../../lib/utils';

export function EmployeesPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeApi.list(),
  });

  const remove = useMutation({
    mutationFn: (id: string) => employeeApi.remove(id),
    onSuccess: () => {
      toast.success('AI employee deleted');
      qc.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <div>
      <PageHeader
        title="AI Employees"
        description="Build, train and deploy your AI workforce"
        action={
          <Link to="/employees/new">
            <Button>
              <Plus className="h-4 w-4" /> New AI Employee
            </Button>
          </Link>
        }
      />

      {isLoading ? (
        <Spinner />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={<Bot className="h-6 w-6" />}
          title="No AI employees yet"
          hint="Create your first inbound receptionist or outbound caller — the guided wizard takes you from blank to launched."
          action={
            <Link to="/employees/new">
              <Button>
                <Plus className="h-4 w-4" /> Create your first AI employee
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.items.map((e) => (
            <Link key={e.id} to={`/employees/${e.id}`} className="group">
              <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-card-hover">
                <div className="mb-4 flex items-center justify-between">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl',
                      e.type === 'inbound' ? 'bg-blue-50 text-blue-600' : 'bg-violet-50 text-violet-600',
                    )}
                  >
                    {e.type === 'inbound' ? (
                      <PhoneIncoming className="h-5 w-5" />
                    ) : (
                      <PhoneOutgoing className="h-5 w-5" />
                    )}
                  </div>
                  <span className="flex items-center gap-1.5">
                    <Badge>{e.status}</Badge>
                    <span onClick={(ev) => ev.preventDefault()}>
                      <ConfirmButton
                        onConfirm={() => remove.mutate(e.id)}
                        title="Delete this AI employee?"
                        message={`${e.name} will be removed permanently, along with its knowledge base and responsibilities.`}
                        className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </ConfirmButton>
                    </span>
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{e.name}</h3>
                <p className="text-sm text-slate-500">
                  <span className="capitalize">{e.type}</span>
                  {e.department ? ` · ${e.department}` : ''}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
