import { useAuthStore } from '../store/authStore';
import Unauthorized from '../pages/Unauthorized';

interface Props {
  permission: string;
  children: React.ReactNode;
}

export default function RoleGuard({ permission, children }: Props) {
  const hasPermission = useAuthStore(s => s.hasPermission);

  if (!hasPermission(permission)) {
    return <Unauthorized />;
  }

  return <>{children}</>;
}
