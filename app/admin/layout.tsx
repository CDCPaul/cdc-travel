"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { checkAuth } from "@/lib/auth";
import { LanguageProvider } from "../../components/LanguageContext";
import AdminSidebar from "./components/AdminSidebar";

export default function AdminUILayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    checkAuth().then(user => {
      if (!user) {
        router.replace("/admin-login");
      }
    });
  }, [router]);

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