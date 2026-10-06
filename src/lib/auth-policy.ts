export type AppRole = 'corretor' | 'lead' | 'admin_corretora' | 'super_admin';

export function isAppRole(value: unknown): value is AppRole {
  return value === 'corretor' || value === 'lead' || value === 'admin_corretora' || value === 'super_admin';
}

export function isAdminRole(role: AppRole | null | undefined): boolean {
  return role === 'admin_corretora' || role === 'super_admin';
}

export function canAccessPage(role: AppRole, pathname: string): boolean {
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) return true;
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return isAdminRole(role);
  }
  if (pathname === '/leads' || pathname.startsWith('/leads/') || pathname === '/funil' || pathname.startsWith('/funil/')) {
    return role !== 'lead';
  }
  if (pathname === '/imoveis/novo' || /^\/imoveis\/[^/]+\/editar(?:\/|$)/.test(pathname)) {
    return role !== 'lead';
  }
  return pathname === '/imoveis' || pathname.startsWith('/imoveis/');
}
