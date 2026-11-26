import fs from 'node:fs';
import path from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CompactGoalRow } from '@/components/ui/CompactGoalRow';
import { InfoPopover } from '@/components/ui/InfoPopover';
import { StrengthBadge } from '@/components/ui/StrengthBadge';
import { validateSupabaseEnv } from '@/lib/env';

function collectSourceFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(fullPath));
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

describe('Design System & Infrastructure Guards (Milestone 1)', () => {
  it('renders CompactGoalRow collapsed by default and toggles details on click', async () => {
    const user = userEvent.setup();
    render(
      <CompactGoalRow title="הקמת עגלת קפה קהילתית בימי שישי" primaryMetric="38 נק׳">
        <div>דני כהן: הניסוח המקורי שלי</div>
      </CompactGoalRow>,
    );

    const toggleButton = screen.getByRole('button', {
      name: /הקמת עגלת קפה קהילתית בימי שישי/i,
    });

    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('דני כהן: הניסוח המקורי שלי')).not.toBeInTheDocument();

    await user.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('דני כהן: הניסוח המקורי שלי')).toBeInTheDocument();

    await user.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('דני כהן: הניסוח המקורי שלי')).not.toBeInTheDocument();
  });

  it('renders StrengthBadge with exact semantic colors and Hebrew labels', () => {
    const { container } = render(
      <div>
        <StrengthBadge level="strong" />
        <StrengthBadge level="medium" />
        <StrengthBadge level="low" />
      </div>,
    );

    expect(screen.getByText('חזק')).toBeInTheDocument();
    expect(screen.getByText('בינוני')).toBeInTheDocument();
    expect(screen.getByText('נמוך')).toBeInTheDocument();

    const badges = container.querySelectorAll('span.inline-flex');
    expect(badges[0].className).toContain('bg-[#F0FDF4]');
    expect(badges[0].className).toContain('text-[#15803D]');
    expect(badges[1].className).toContain('bg-[#FFFBEB]');
    expect(badges[1].className).toContain('text-[#B45309]');
    expect(badges[2].className).toContain('bg-[#F1F5F9]');
    expect(badges[2].className).toContain('text-[#475569]');
  });

  it('opens InfoPopover helper content when clicked', async () => {
    const user = userEvent.setup();
    render(
      <InfoPopover label="הנחיה לניסוח" title="הרמת כוסית בראש השנה">
        <p>תוכן עזר ממוקד לניסוח יעד קונקרטי.</p>
      </InfoPopover>,
    );

    expect(screen.queryByText('תוכן עזר ממוקד לניסוח יעד קונקרטי.')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'הנחיה לניסוח' }));

    expect(screen.getByText('הרמת כוסית בראש השנה')).toBeInTheDocument();
    expect(screen.getByText('תוכן עזר ממוקד לניסוח יעד קונקרטי.')).toBeInTheDocument();
  });

  it('validates Supabase env values and rejects placeholder credentials', () => {
    expect(validateSupabaseEnv(undefined, undefined)).toMatchObject({
      configured: false,
      reason: 'missing',
    });

    expect(
      validateSupabaseEnv(
        'https://your-project-id.supabase.co',
        'your-public-anon-key',
      ),
    ).toMatchObject({
      configured: false,
      reason: 'placeholder',
    });

    expect(
      validateSupabaseEnv('not-a-valid-url', 'valid-length-key-1234567890'),
    ).toMatchObject({
      configured: false,
      reason: 'invalid',
    });

    expect(
      validateSupabaseEnv(
        'https://abcdefghijklmno.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
      ),
    ).toMatchObject({
      configured: true,
      reason: 'ok',
    });
  });

  it('enforces zero-emoji guard across all src TypeScript files', () => {
    const srcDir = path.resolve(process.cwd(), 'src');
    const sourceFiles = collectSourceFiles(srcDir);
    const emojiPattern = /\p{Extended_Pictographic}/u;
    const violations: string[] = [];

    for (const filePath of sourceFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (emojiPattern.test(content)) {
        violations.push(path.relative(process.cwd(), filePath));
      }
    }

    expect(violations).toEqual([]);
  });
});
