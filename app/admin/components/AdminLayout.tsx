"use client";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
} 