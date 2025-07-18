"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "../../../components/LanguageContext";
import Link from "next/link";
import Image from "next/image";

// 다국어 텍스트
const TEXT = {
  title: { ko: "TA 목록", en: "TA List" },
  addNew: { ko: "새 TA 추가", en: "Add New TA" },
  sendEmail: { ko: "이메일 보내기", en: "Send Email" },
  selectAll: { ko: "전체 선택", en: "Select All" },
  deselectAll: { ko: "전체 해제", en: "Deselect All" },
  search: { ko: "검색", en: "Search" },
  logo: { ko: "로고", en: "Logo" },
  companyName: { ko: "회사명", en: "Company Name" },
  taCode: { ko: "TA 코드", en: "TA Code" },
  phone: { ko: "전화번호", en: "Phone" },
  address: { ko: "주소", en: "Address" },
  email: { ko: "이메일", en: "Email" },
  contactPerson: { ko: "담당자", en: "Contact Person" },
  actions: { ko: "작업", en: "Actions" },
  edit: { ko: "편집", en: "Edit" },
  delete: { ko: "삭제", en: "Delete" },
  noData: { ko: "데이터가 없습니다.", en: "No data available." },
  backToAdmin: { ko: "관리자로 돌아가기", en: "Back to Admin" },
  loading: { ko: "로딩중...", en: "Loading..." },
  error: { ko: "데이터를 불러오는데 실패했습니다.", en: "Failed to load data." }
};

interface TA {
  id: string;
  companyName: string;
  taCode: string;
  phone: string;
  address: string;
  email: string;
  logo: string;
  contactPersons: Array<{ name: string; phone: string; email: string }>;
  createdAt: { seconds: number; nanoseconds: number } | null;
}

export default function TAListPage() {
  const { lang } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tas, setTas] = useState<TA[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTAs, setSelectedTAs] = useState<string[]>([]);

  // TA 데이터 가져오기
  useEffect(() => {
    const fetchTAs = async () => {
      try {
        const response = await fetch('/api/ta');
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to load data.");
        }

        setTas(result.data || []);
      } catch (error) {
        console.error('TA 데이터 로드 실패:', error);
        setError(error instanceof Error ? error.message : "Failed to load data.");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchTAs();
  }, []);

  const filteredTAs = tas.filter(ta =>
    ta.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ta.taCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ta.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ta.contactPersons.some(person => 
      person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.phone.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleDelete = async (id: string) => {
    if (confirm("정말 삭제하시겠습니까?")) {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/ta/${id}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || '삭제에 실패했습니다.');
        }

        alert("TA가 성공적으로 삭제되었습니다.");
        
        // 목록에서 삭제된 TA 제거
        setTas(prev => prev.filter(ta => ta.id !== id));
        setSelectedTAs(prev => prev.filter(taId => taId !== id));
        
      } catch (error) {
        console.error("삭제 실패:", error);
        alert(error instanceof Error ? error.message : "삭제에 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSelectAll = () => {
    if (selectedTAs.length === filteredTAs.length) {
      setSelectedTAs([]);
    } else {
      setSelectedTAs(filteredTAs.map(ta => ta.id));
    }
  };

  const handleSelectTA = (id: string) => {
    setSelectedTAs(prev => 
      prev.includes(id) 
        ? prev.filter(taId => taId !== id)
        : [...prev, id]
    );
  };

  const handleSendEmail = () => {
    if (selectedTAs.length === 0) {
      alert("이메일을 보낼 TA를 선택해주세요.");
      return;
    }
    window.location.href = `/admin/ta-list/send-email?selected=${selectedTAs.join(',')}`;
  };

  if (isLoadingData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <p className="text-lg text-gray-600">{TEXT.loading[lang]}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <p className="text-lg text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{TEXT.title[lang]}</h1>
        <div className="flex gap-4">
          <Link
            href="/admin"
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            {TEXT.backToAdmin[lang]}
          </Link>
          <Link
            href="/admin/ta-list/new"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {TEXT.addNew[lang]}
          </Link>
          <button
            onClick={handleSendEmail}
            disabled={selectedTAs.length === 0}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {TEXT.sendEmail[lang]}
          </button>
        </div>
      </div>

      {/* 검색 및 선택 */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder={TEXT.search[lang]}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {filteredTAs.length > 0 && (
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {selectedTAs.length === filteredTAs.length ? TEXT.deselectAll[lang] : TEXT.selectAll[lang]}
              </button>
              {selectedTAs.length > 0 && (
                <span className="text-sm text-gray-600">
                  {selectedTAs.length}개 선택됨
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* TA 목록 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={selectedTAs.length === filteredTAs.length && filteredTAs.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {TEXT.logo[lang]}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {TEXT.companyName[lang]}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {TEXT.taCode[lang]}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {TEXT.phone[lang]}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {TEXT.address[lang]}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {TEXT.email[lang]}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {TEXT.contactPerson[lang]}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {TEXT.actions[lang]}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTAs.length > 0 ? (
              filteredTAs.map((ta) => (
                <tr key={ta.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedTAs.includes(ta.id)}
                      onChange={() => handleSelectTA(ta.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="relative w-12 h-12">
                      {ta.logo ? (
                        <Image
                          src={ta.logo}
                          alt={`${ta.companyName} 로고`}
                          width={48}
                          height={48}
                          className="object-contain rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-gray-500 text-xs">No Logo</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {ta.companyName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ta.taCode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ta.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ta.address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ta.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ta.contactPersons.length > 0 ? (
                      <div>
                        <div className="font-medium">{ta.contactPersons[0].name}</div>
                        <div className="text-xs text-gray-400">{ta.contactPersons[0].phone}</div>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/ta-list/${ta.id}/edit`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {TEXT.edit[lang]}
                      </Link>
                      <button 
                        onClick={() => handleDelete(ta.id)}
                        disabled={isLoading}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        {TEXT.delete[lang]}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="px-6 py-4 text-center text-sm text-gray-500">
                  {TEXT.noData[lang]}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 