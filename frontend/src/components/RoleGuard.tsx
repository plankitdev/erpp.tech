import { useAuthStore } from '../store/authStore';
import Unauthorized from '../pages/Unauthorized';
import type { UserRole } from '../types';

interface Props {
  permission?: string;
  roles?: UserRole[];
  children: React.ReactNode;
}

export default function RoleGuard({ permission, roles, children }: Props) {
  const { hasPermission, user } = useAuthStore();

  if (permission && !hasPermission(permission)) {
    return <Unauthorized />;
  }

  if (roles && roles.length > 0 && !roles.includes(user?.role as UserRole)) {
    return <Unauthorized />;
  }

  return <>{children}</>;
}
