"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkAuth } from "@/lib/auth";
import { LanguageProvider } from "../../components/LanguageContext";
import AdminSidebar from "./components/AdminSidebar";

export default function AdminUILayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth().then(user => {
      if (!user) {
        router.replace("/admin-login");
      } else {
        setIsLoading(false);
      }
    });
  }, [router]);

  if (isLoading) {
    return (
      <LanguageProvider>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">인증 확인 중...</p>
          </div>
        </div>
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider>
      <div className="hidden md:block">
        <AdminSidebar />
      </div>
      <div className="md:ml-64">
        {children}
      </div>
    </LanguageProvider>
  );
} 