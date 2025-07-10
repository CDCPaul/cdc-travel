import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyIdTokenFromCookies, isAdminByEmail } from '../../lib/auth-server';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const decodedToken = await verifyIdTokenFromCookies(cookieStore);

  if (!decodedToken?.email) {
    redirect('/admin/login');
  }

  const isAdmin = await isAdminByEmail(decodedToken.email);
  if (!isAdmin) {
    redirect('/admin/login');
  }

  return children;
} 