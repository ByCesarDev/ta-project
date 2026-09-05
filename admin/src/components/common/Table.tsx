import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (item: T) => void;
}

export function Table<T extends { id?: string | number }>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No se encontraron registros.',
  className,
  onRowClick,
}: TableProps<T>) {
  return (
    <div className={cn('w-full overflow-x-auto rounded-2xl border border-slate-800/80 bg-[#0b0f19]/80', className)}>
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="bg-[#0e1424] text-xs uppercase font-semibold text-slate-400 border-b border-slate-800/80 tracking-wider">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className={cn('px-5 py-4', col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="py-16 text-center text-slate-400">
                <div className="flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
                  <span className="text-xs">Cargando datos...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-slate-500 text-sm">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, rowIdx) => (
              <tr
                key={item.id ?? rowIdx}
                onClick={() => onRowClick && onRowClick(item)}
                className={cn(
                  'hover:bg-slate-800/40 transition-colors',
                  onRowClick && 'cursor-pointer'
                )}
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className={cn('px-5 py-4 align-middle', col.className)}>
                    {col.cell
                      ? col.cell(item)
                      : col.accessorKey
                      ? String(item[col.accessorKey] ?? '—')
                      : '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
