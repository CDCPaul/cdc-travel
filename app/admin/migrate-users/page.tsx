"use client";

import { useState } from "react";
import { createAdminUser, verifyAdminRole } from "@/lib/admin-setup";
import { useAuth } from '@/context/AuthContext';

export default function MigrateUsersPage() {
  const [uid, setUid] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { user } = useAuth();

  // AuthContext에서 user 정보 사용 - 중복된 onAuthStateChanged 제거
  const currentUser = user;

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (!uid.trim() || !email.trim()) {
        setMessage("UID와 이메일을 모두 입력해주세요.");
        return;
      }

      await createAdminUser(uid.trim(), email.trim(), name.trim() || undefined);
      setMessage("관리자 사용자가 성공적으로 생성되었습니다.");
      setUid("");
      setEmail("");
      setName("");
    } catch (error) {
      setMessage(`오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAdmin = async () => {
    if (!uid.trim()) {
      setMessage("확인할 UID를 입력해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const isAdmin = await verifyAdminRole(uid.trim());
      setMessage(isAdmin ? "해당 사용자는 관리자입니다." : "해당 사용자는 관리자가 아닙니다.");
    } catch (error) {
      setMessage(`확인 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h1>
          <p className="text-gray-600">관리자 마이그레이션 페이지에 접근하려면 로그인해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">관리자 사용자 마이그레이션</h1>
          
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">사용 방법</h2>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Firebase Console → Authentication → Users에서 관리자 UID를 확인하세요</li>
              <li>2. 아래 폼에 UID와 이메일을 입력하여 관리자 사용자를 생성하세요</li>
              <li>3. 생성된 사용자가 Firestore의 users 컬렉션에 저장됩니다</li>
              <li>4. Firebase Storage Rules를 UID 기반으로 업데이트하세요</li>
            </ol>
          </div>

          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div>
              <label htmlFor="uid" className="block text-sm font-medium text-gray-700 mb-1">
                사용자 UID *
              </label>
              <input
                type="text"
                id="uid"
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Firebase Console에서 확인한 UID"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                이메일 *
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="user@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                이름 (선택사항)
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="사용자 이름"
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "생성 중..." : "관리자 사용자 생성"}
              </button>

              <button
                type="button"
                onClick={handleVerifyAdmin}
                disabled={loading || !uid.trim()}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "확인 중..." : "관리자 권한 확인"}
              </button>
            </div>
          </form>

          {message && (
            <div className={`mt-4 p-3 rounded-md ${
              message.includes("성공") || message.includes("관리자입니다") 
                ? "bg-green-50 text-green-800" 
                : "bg-red-50 text-red-800"
            }`}>
              {message}
            </div>
          )}

          <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">다음 단계</h3>
            <ol className="text-sm text-yellow-800 space-y-1">
              <li>1. 모든 관리자 사용자를 생성한 후</li>
              <li>2. Firebase Console → Storage → Rules에서 새로운 규칙을 적용하세요</li>
              <li>3. 기존 이메일 기반 규칙을 UID 기반으로 교체하세요</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
} 