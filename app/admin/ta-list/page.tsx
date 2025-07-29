"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "../../../components/LanguageContext";
import Image from "next/image";
import { auth } from "../../../lib/firebase";
import { DataTable } from '@/components/ui/data-table';
import { Eye, Edit, Trash2 } from 'lucide-react';

// 다국어 텍스트
const TEXT = {
  title: { ko: "TA 목록", en: "TA List" },
  addNew: { ko: "새 TA 추가", en: "Add New TA" },
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
  const [tas, setTas] = useState<TA[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      try {
        const response = await fetch(`/api/ta/${id}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || '삭제에 실패했습니다.');
        }

        // 활동 기록
        try {
          const user = auth.currentUser;
          if (user) {
            const deletedTA = tas.find(ta => ta.id === id);
            const idToken = await user.getIdToken();
            await fetch('/api/users/activity', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
              },
              body: JSON.stringify({
                action: 'taDelete',
                details: `TA "${deletedTA?.companyName}" 삭제`,
                userId: user.uid,
                userEmail: user.email
              })
            });
          }
        } catch (error) {
          console.error('활동 기록 실패:', error);
        }
        
        alert("TA가 성공적으로 삭제되었습니다.");
        
        // 목록에서 삭제된 TA 제거
        setTas(prev => prev.filter(ta => ta.id !== id));
        
      } catch (error) {
        console.error("삭제 실패:", error);
        alert(error instanceof Error ? error.message : "삭제에 실패했습니다.");
      }
    }
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
      {/* 검색 */}
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

      </div>

      {/* TA 목록 테이블 */}
      <div className="bg-white rounded-lg shadow">
        <DataTable 
          data={filteredTAs}
          columns={[
            {
              key: "logo",
              header: TEXT.logo[lang],
              cell: (ta) => (
                <div className="relative w-12 h-12">
                  {ta.logo ? (
                    <Image
                      src={ta.logo}
                      alt={`${ta.companyName} 로고`}
                      width={48}
                      height={48}
                      className="object-contain rounded hover:opacity-80 transition-opacity"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300 transition-colors">
                      <span className="text-gray-500 text-xs">No Logo</span>
                    </div>
                  )}
                </div>
              ),
              sortable: false,
            },
            {
              key: "companyName",
              header: TEXT.companyName[lang],
              cell: (ta) => (
                <div className="max-w-xs truncate hover:text-blue-600 transition-colors" title={ta.companyName}>
                  {ta.companyName}
                </div>
              ),
              sortable: true,
            },
            {
              key: "taCode",
              header: TEXT.taCode[lang],
              cell: (ta) => <div>{ta.taCode}</div>,
              sortable: true,
            },
            {
              key: "phone",
              header: TEXT.phone[lang],
              cell: (ta) => <div>{ta.phone}</div>,
              sortable: true,
            },
            {
              key: "address",
              header: TEXT.address[lang],
              cell: (ta) => (
                <div className="max-w-xs truncate" title={ta.address}>
                  {ta.address}
                </div>
              ),
              sortable: true,
            },
            {
              key: "email",
              header: TEXT.email[lang],
              cell: (ta) => (
                <div className="max-w-xs truncate hover:text-blue-600 transition-colors" title={ta.email}>
                  {ta.email}
                </div>
              ),
              sortable: true,
            },
            {
              key: "contactPerson",
              header: TEXT.contactPerson[lang],
              cell: (ta) => (
                <div>
                  {ta.contactPersons.length > 0 ? (
                    <>
                      <div className="font-medium">{ta.contactPersons[0].name}</div>
                      <div className="text-xs text-gray-400">{ta.contactPersons[0].phone}</div>
                    </>
                  ) : '-'}
                </div>
              ),
              sortable: false,
            },
          ]}
          actions={[
            {
              label: "보기",
              icon: <Eye className="h-4 w-4" />,
              href: (ta) => `/admin/ta-list/${ta.id}`,
              variant: "ghost",
            },
            {
              label: "수정",
              icon: <Edit className="h-4 w-4" />,
              href: (ta) => `/admin/ta-list/${ta.id}/edit`,
              variant: "ghost",
            },
            {
              label: "삭제",
              icon: <Trash2 className="h-4 w-4" />,
              onClick: (ta) => handleDelete(ta.id),
              variant: "ghost",
            },
          ]}
          searchKey="companyName"
          searchPlaceholder="회사명, TA코드, 이메일로 검색..."
          itemsPerPage={10}
          emptyMessage={TEXT.noData[lang]}
        />
      </div>
    </div>
  );
} 