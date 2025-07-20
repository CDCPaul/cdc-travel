"use client";

import dynamic from 'next/dynamic';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';

interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  lang?: string;
}

function TiptapEditorComponent({ 
  value, 
  onChange, 
  className = "",
  lang = "ko"
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Color,
      TextStyle,
      Image,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
    },
    // SSR 호환성을 위한 설정
    immediatelyRender: false,
  });

  if (!editor) {
    return null;
  }

  const TEXT = {
    bold: { ko: "굵게", en: "Bold" },
    italic: { ko: "기울임", en: "Italic" },
    underline: { ko: "밑줄", en: "Underline" },
    strike: { ko: "취소선", en: "Strike" },
    code: { ko: "코드", en: "Code" },
    h1: { ko: "제목1", en: "H1" },
    h2: { ko: "제목2", en: "H2" },
    h3: { ko: "제목3", en: "H3" },
    bulletList: { ko: "목록", en: "List" },
    orderedList: { ko: "번호목록", en: "Ordered List" },
    blockquote: { ko: "인용", en: "Quote" },
    codeBlock: { ko: "코드블록", en: "Code Block" },
    alignLeft: { ko: "왼쪽", en: "Left" },
    alignCenter: { ko: "가운데", en: "Center" },
    alignRight: { ko: "오른쪽", en: "Right" },
    alignJustify: { ko: "양쪽", en: "Justify" },
    link: { ko: "링크", en: "Link" },
    image: { ko: "이미지", en: "Image" },
    table: { ko: "표", en: "Table" },
    undo: { ko: "실행취소", en: "Undo" },
    redo: { ko: "다시실행", en: "Redo" },
  };

  const addLink = () => {
    const url = window.prompt('URL을 입력하세요:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = window.prompt('이미지 URL을 입력하세요:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className={`border rounded-md ${className}`}>
      {/* 툴바 */}
      <div className="border-b border-gray-200 bg-gray-50 p-2 flex flex-wrap items-center gap-1">
        {/* 기본 스타일 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive('bold') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {TEXT.bold[lang as keyof typeof TEXT.bold]}
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive('italic') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {TEXT.italic[lang as keyof typeof TEXT.italic]}
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive('strike') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {TEXT.strike[lang as keyof typeof TEXT.strike]}
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive('code') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {TEXT.code[lang as keyof typeof TEXT.code]}
        </button>

        {/* 구분선 */}
        <div className="w-px h-6 bg-gray-300"></div>

        {/* 제목 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive('heading', { level: 1 }) ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {TEXT.h1[lang as keyof typeof TEXT.h1]}
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive('heading', { level: 2 }) ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {TEXT.h2[lang as keyof typeof TEXT.h2]}
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive('heading', { level: 3 }) ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {TEXT.h3[lang as keyof typeof TEXT.h3]}
        </button>

        {/* 구분선 */}
        <div className="w-px h-6 bg-gray-300"></div>

        {/* 목록 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive('bulletList') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {TEXT.bulletList[lang as keyof typeof TEXT.bulletList]}
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive('orderedList') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {TEXT.orderedList[lang as keyof typeof TEXT.orderedList]}
        </button>

        {/* 구분선 */}
        <div className="w-px h-6 bg-gray-300"></div>

        {/* 정렬 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive({ textAlign: 'left' }) ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {TEXT.alignLeft[lang as keyof typeof TEXT.alignLeft]}
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive({ textAlign: 'center' }) ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {TEXT.alignCenter[lang as keyof typeof TEXT.alignCenter]}
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive({ textAlign: 'right' }) ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {TEXT.alignRight[lang as keyof typeof TEXT.alignRight]}
        </button>

        {/* 구분선 */}
        <div className="w-px h-6 bg-gray-300"></div>

        {/* 링크, 이미지, 표 */}
        <button
          type="button"
          onClick={addLink}
          className="px-2 py-1 rounded text-sm bg-white text-gray-700 hover:bg-gray-100"
        >
          {TEXT.link[lang as keyof typeof TEXT.link]}
        </button>
        <button
          type="button"
          onClick={addImage}
          className="px-2 py-1 rounded text-sm bg-white text-gray-700 hover:bg-gray-100"
        >
          {TEXT.image[lang as keyof typeof TEXT.image]}
        </button>
        <button
          type="button"
          onClick={addTable}
          className="px-2 py-1 rounded text-sm bg-white text-gray-700 hover:bg-gray-100"
        >
          {TEXT.table[lang as keyof typeof TEXT.table]}
        </button>

        {/* 구분선 */}
        <div className="w-px h-6 bg-gray-300"></div>

        {/* 실행취소/다시실행 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="px-2 py-1 rounded text-sm bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          {TEXT.undo[lang as keyof typeof TEXT.undo]}
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="px-2 py-1 rounded text-sm bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          {TEXT.redo[lang as keyof typeof TEXT.redo]}
        </button>
      </div>

      {/* 에디터 영역 */}
      <div className="p-3 min-h-32">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

// SSR 호환성을 위한 dynamic export
const TiptapEditor = dynamic(() => Promise.resolve(TiptapEditorComponent), {
  ssr: false,
  loading: () => (
    <div className="border rounded-md p-4 bg-gray-50">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded"></div>
      </div>
    </div>
  ),
});

export default TiptapEditor; 