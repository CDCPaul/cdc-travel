import { LanguageProvider } from "../../components/LanguageContext";
import AdminSidebar from "./components/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 pl-56 min-h-screen bg-gray-50">
          {children}
        </main>
      </div>
    </LanguageProvider>
  );
} 