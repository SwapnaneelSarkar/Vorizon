import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import type { AIEmployeeDTO } from '@vorizon/shared';
import { contactApi } from '../../../lib/api/endpoints';
import { Button, Card, Spinner } from '../../../components/ui';

export function ContactsStep({ employee: _employee }: { employee: AIEmployeeDTO }) {
  const { data, isLoading } = useQuery({
    queryKey: ['contacts', 'valid'],
    queryFn: () => contactApi.list({ validationStatus: 'valid' }),
  });

  return (
    <Card>
      <h2 className="mb-1 text-lg font-semibold text-slate-800">Contact List</h2>
      <p className="mb-4 text-sm text-slate-500">
        Outbound campaigns call contacts from your list. Upload a CSV/XLSX or add contacts manually.
      </p>
      {isLoading ? (
        <Spinner />
      ) : (
        <p className="mb-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
          You currently have <strong>{data?.total ?? 0}</strong> valid contact(s).
        </p>
      )}
      <Link to="/contacts">
        <Button>Manage contacts</Button>
      </Link>
    </Card>
  );
}
