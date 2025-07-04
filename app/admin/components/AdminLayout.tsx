"use client";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 ml-56">{/* 사이드바 너비만큼 여백 */}
        {children}
      </main>
    </div>
  );
} 