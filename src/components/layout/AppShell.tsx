import * as React from 'react';
import { Compass, Database, CheckCircle2, AlertCircle } from 'lucide-react';
import { StatusBadge } from '@/components/ui';
import type { SupabaseConnectionResult } from '@/lib/supabase';

export interface AppShellProps {
  connection: SupabaseConnectionResult;
  children: React.ReactNode;
}

export function AppShell({ connection, children }: AppShellProps) {
  const statusBadge = (() => {
    if (connection.status === 'connected') {
      return (
        <StatusBadge
          tone="success"
          icon={<CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />}
        >
          מחובר ל-Supabase
        </StatusBadge>
      );
    }

    if (connection.status === 'schema_missing' || connection.status === 'error') {
      return (
        <StatusBadge
          tone="warning"
          icon={<AlertCircle className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />}
        >
          {connection.status === 'schema_missing' ? 'נדרשת הרצת SQL' : 'שגיאת חיבור'}
        </StatusBadge>
      );
    }

    return (
      <StatusBadge
        tone="neutral"
        icon={<Database className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />}
      >
        ממתין להגדרת Supabase
      </StatusBadge>
    );
  })();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <header className="border-b border-[#E2E8F0] bg-[#FFFFFF]">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#1D4ED8]">
              <Compass className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </div>
            <div>
              <div className="text-base font-semibold leading-tight text-[#0F172A]">
                פלטפורמת יעדים קהילתיים
              </div>
              <div className="text-xs text-[#475569]">
                תשתית Production MVP • אבן דרך 1
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">{statusBadge}</div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
