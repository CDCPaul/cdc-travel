import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyIdTokenFromCookies, isAdminByEmail } from '../../lib/auth-server';
import { LanguageProvider } from "../../components/LanguageContext";
import AdminSidebar from "./components/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const decodedToken = await verifyIdTokenFromCookies(cookieStore);
  
  if (!decodedToken?.email) {
    redirect('/admin/login');
  }

  const isAdmin = await isAdminByEmail(decodedToken.email);
  if (!isAdmin) {
    redirect('/admin/login');
  }

  return (
    <LanguageProvider>
      {/* 데스크탑 사이드바 */}
      <div className="hidden md:block">
        <AdminSidebar />
      </div>
      {/* 메인 컨텐츠 */}
      <div className="md:ml-64">
        {children}
      </div>
    </LanguageProvider>
  );
} 