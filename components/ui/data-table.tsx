"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import Link from "next/link";

// 간단한 Input 컴포넌트
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ type, ...props }, ref) => {
    return (
      <input
        type={type}
        className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export interface Column<T> {
  key: string;
  header: string | React.ReactNode;
  cell: (item: T) => React.ReactNode;
  sortable?: boolean;
  searchable?: boolean;
}

export interface Action<T> {
  label: string;
  icon: React.ReactNode;
  onClick?: (item: T) => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  href?: (item: T) => string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: Action<T>[];
  searchKey?: string;
  searchPlaceholder?: string;
  itemsPerPage?: number;
  emptyMessage?: string;
  className?: string;
  expandable?: boolean;
  expandedRow?: (item: T) => React.ReactNode;
  onRowClick?: (item: T) => void;
  onRowDoubleClick?: (item: T) => void;
}

export function DataTable<T>({
  data,
  columns,
  actions = [],
  searchKey,
  searchPlaceholder = "검색...",
  itemsPerPage = 10,
  emptyMessage = "데이터가 없습니다.",
  className = "",
  expandable = false,
  expandedRow,
  onRowClick,
  onRowDoubleClick,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = React.useState<Array<{
    key: string;
    direction: 'asc' | 'desc';
  }>>([]);
  
  const [searchTerm, setSearchTerm] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [expandedRows, setExpandedRows] = React.useState<Set<number>>(new Set());

  // 검색 필터링
  const filteredData = React.useMemo(() => {
    if (!searchTerm || !searchKey) return data;
    
    return data.filter(item => {
      const searchValue = (item as Record<string, unknown>)[searchKey];
      if (typeof searchValue === 'string') {
        return searchValue.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return false;
    });
  }, [data, searchTerm, searchKey]);

  // 다중 정렬
  const sortedData = React.useMemo(() => {
    if (sortConfig.length === 0) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      for (const sort of sortConfig) {
        const aValue = (a as Record<string, unknown>)[sort.key];
        const bValue = (b as Record<string, unknown>)[sort.key];
        
        // 타입 가드 추가
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
          if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
          if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
        }
        
        // 값이 같으면 다음 정렬 기준으로 넘어감
        if (aValue !== bValue) {
          return 0;
        }
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  // 페이지네이션
  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      const existingIndex = prev.findIndex(sort => sort.key === key);
      
      if (existingIndex >= 0) {
        // 이미 정렬된 컬럼인 경우 방향 변경
        const newConfig = [...prev];
        if (newConfig[existingIndex].direction === 'asc') {
          newConfig[existingIndex].direction = 'desc';
        } else {
          // desc에서 다시 클릭하면 해당 컬럼 제거
          newConfig.splice(existingIndex, 1);
        }
        return newConfig;
      } else {
        // 새로운 컬럼 정렬 추가 (기본값: asc)
        return [...prev, { key, direction: 'asc' }];
      }
    });
  };

  const getSortIcon = (key: string) => {
    const sort = sortConfig.find(s => s.key === key);
    if (!sort) return <ArrowUpDown className="ml-2 h-4 w-4 text-gray-400" />;
    
    return sort.direction === 'asc' 
      ? <ArrowUpDown className="ml-2 h-4 w-4 text-blue-600" />
      : <ArrowUpDown className="ml-2 h-4 w-4 text-blue-600 rotate-180" />;
  };

  const getSortOrder = (key: string) => {
    const index = sortConfig.findIndex(s => s.key === key);
    return index >= 0 ? index + 1 : null;
  };

  const handleRowClick = (index: number, item: T) => {
    if (expandable) {
      setExpandedRows(prev => {
        const newSet = new Set(prev);
        if (newSet.has(index)) {
          newSet.delete(index);
        } else {
          newSet.add(index);
        }
        return newSet;
      });
    }
    onRowClick?.(item);
  };

  const handleRowDoubleClick = (item: T) => {
    onRowDoubleClick?.(item);
  };

  const SortableHeader = ({ sortKey, children }: { sortKey: string; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      onClick={() => handleSort(sortKey)}
      className="h-auto p-0 font-medium relative"
    >
      {children}
      {getSortIcon(sortKey)}
      {getSortOrder(sortKey) && (
        <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
          {getSortOrder(sortKey)}
        </span>
      )}
    </Button>
  );

  if (data.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {/* 검색 및 컨트롤 */}
      <div className="flex items-center justify-between py-2 px-4">
        <div className="flex items-center space-x-4">
          {searchKey && (
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          )}
          {/* 정렬 상태 표시 */}
          {sortConfig.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">정렬:</span>
              <div className="flex space-x-1">
                {sortConfig.map((sort) => (
                  <span key={sort.key} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {sort.key} {sort.direction === 'asc' ? '↑' : '↓'}
                    <button
                      onClick={() => handleSort(sort.key)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="text-sm text-gray-500">
          총 {filteredData.length}개 중 {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredData.length)}개 표시
        </div>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {column.sortable ? (
                    <SortableHeader sortKey={column.key}>
                      {typeof column.header === 'string' ? column.header : column.header}
                    </SortableHeader>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
              {actions.length > 0 && (
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-44">
                  액션
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((item, index) => (
              <React.Fragment key={index}>
                <tr 
                  className={`hover:bg-gray-50 ${expandable ? 'cursor-pointer' : ''}`}
                  onClick={() => handleRowClick(index, item)}
                  onDoubleClick={() => handleRowDoubleClick(item)}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                      {column.cell(item)}
                    </td>
                  ))}
                  {actions.length > 0 && (
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                      <div className="flex items-center justify-center space-x-3">
                        {actions.map((action, actionIndex) => {
                          if (action.href) {
                            return (
                              <Link key={actionIndex} href={action.href(item)}>
                                <Button 
                                  variant={action.variant || "ghost"} 
                                  size="sm" 
                                  className="h-10 w-10 p-0 hover:bg-gray-100 border border-gray-200"
                                  title={action.label}
                                >
                                  {action.icon}
                                </Button>
                              </Link>
                            );
                          }
                          return (
                            <Button
                              key={actionIndex}
                              variant={action.variant || "ghost"}
                              size="sm"
                              className="h-10 w-10 p-0 hover:bg-gray-100 border border-gray-200"
                              onClick={() => action.onClick?.(item)}
                              title={action.label}
                            >
                              {action.icon}
                            </Button>
                          );
                        })}
                      </div>
                    </td>
                  )}
                </tr>
                {/* 확장된 행 */}
                {expandable && expandedRows.has(index) && expandedRow && (
                  <tr className="bg-gray-50">
                    <td colSpan={columns.length + (actions.length > 0 ? 1 : 0)} className="px-3 py-4">
                      <div className="bg-white rounded-lg border border-gray-200 p-4">
                        {expandedRow(item)}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2">
          <div className="text-sm text-gray-500">
            페이지 {currentPage} / {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              이전
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              다음
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 