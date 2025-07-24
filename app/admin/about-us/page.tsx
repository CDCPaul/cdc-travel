"use client";

export default function AdminAboutUsPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">회사소개</h1>
      <p className="text-gray-700 mb-4">회사소개 관련 콘텐츠를 관리할 수 있습니다.</p>
      <ul className="list-disc pl-6 text-gray-600">
        <li>eBook 관리: 회사소개 eBook 등록/수정/삭제/공개여부 설정</li>
      </ul>
    </div>
  );
} 