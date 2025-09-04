import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyIdTokenFromCookies } from '../../lib/auth-server';
import { isAdmin } from '../../lib/admin-config';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const decodedToken = await verifyIdTokenFromCookies(cookieStore);

  if (!decodedToken?.email) {
    redirect('/admin/login');
  }

  const adminCheck = isAdmin(decodedToken.email);
  if (!adminCheck) {
    redirect('/admin/login');
  }

  return children;
} 