import * as React from 'react';
import {
  CheckCircle2,
  Database,
  GitMerge,
  Layers,
  ListOrdered,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CompactGoalRow,
  InfoPopover,
  Input,
  StatusBadge,
  StrengthBadge,
  Tooltip,
  type GoalStrengthLevel,
} from '@/components/ui';
import type { SupabaseConnectionResult } from '@/lib/supabase';

export interface HomePageProps {
  connection: SupabaseConnectionResult;
  checkingConnection: boolean;
  onRecheckConnection: () => void;
}

interface PreviewPersonalGoal {
  id: string;
  content: string;
}

interface PreviewUnifiedGoal {
  id: string;
  title: string;
  metric: string;
  strength: GoalStrengthLevel;
  authors: { name: string; original: string }[];
  distribution: { points: number; count: number }[];
}

const PROCESS_STAGES = [
  {
    step: 1,
    title: 'שלב 1 – כתיבת יעדים אישיים',
    description: 'כתיבה פרטית בטלפון האישי עם עריכה ומחיקה חופשית עד לרגע ההצגה.',
    icon: Lock,
  },
  {
    step: 2,
    title: 'שלב 2 – איחוד יעדים בקבוצה',
    description: 'סבב שיתוף יעד-יעד בשולחן ואיחוד ניסוחים דומים ללא ויתור על רעיונות.',
    icon: GitMerge,
  },
  {
    step: 3,
    title: 'שלב 3 – הצבעה בקבוצה וצמצום ל-10',
    description: 'סימון 7 יעדים ודירוגם בגרירה (7 עד 1 נק׳), שקיפות שמית והעלאת 10 המובילים.',
    icon: ListOrdered,
  },
  {
    step: 4,
    title: 'שלב 4 – איחוד בין הקבוצות',
    description: 'חיבור היעדים שעלו מהשולחנות לרשימת יעדים אחודים סופית וייצוא לאקסל.',
    icon: Layers,
  },
] as const;

const INITIAL_UNIFIED_EXAMPLES: PreviewUnifiedGoal[] = [
  {
    id: 'ug-1',
    title: 'הפעלת עגלת קפה קהילתית בימי שישי במדשאה המרכזית כמקום מפגש בין-דורי',
    metric: '44 נק׳ • 7 מצביעים',
    strength: 'strong',
    authors: [
      {
        name: 'דני כהן',
        original: 'אני מודה על כך שהקמנו עגלת קפה קהילתית שפועלת בימי שישי במדשאה המרכזית',
      },
      {
        name: 'רותי לוי',
        original: 'אני מודה על פתיחת בית קפה קהילתי שבועי בימי שישי למפגש בין ותיקים לצעירים',
      },
    ],
    distribution: [
      { points: 7, count: 4 },
      { points: 6, count: 2 },
      { points: 4, count: 1 },
    ],
  },
  {
    id: 'ug-2',
    title: 'הקמת גינה קהילתית יצרנית ומתחם קומפוסט בשיתוף משפחות וילדי הגנים',
    metric: '24 נק׳ • 6 מצביעים',
    strength: 'medium',
    authors: [
      {
        name: 'תמר פרץ',
        original: 'אני מודה על הקמת גינה קהילתית יצרנית וקומפוסטר שכונתי פעיל עם ילדי הגנים',
      },
    ],
    distribution: [
      { points: 5, count: 1 },
      { points: 4, count: 4 },
      { points: 3, count: 1 },
    ],
  },
  {
    id: 'ug-3',
    title: 'שדרוג תאורת השבילים והצבת ספסלי ישיבה מוצלים לאורך הטיילת ההיקפית',
    metric: '8 נק׳ • 7 מצביעים',
    strength: 'low',
    authors: [
      {
        name: 'דני כהן',
        original: 'אני מודה על שדרוג תאורת השבילים והצבת ספסלים מוצלים בטיילת',
      },
    ],
    distribution: [
      { points: 2, count: 1 },
      { points: 1, count: 6 },
    ],
  },
];

export function HomePage({
  connection,
  checkingConnection,
  onRecheckConnection,
}: HomePageProps) {
  const [goalInput, setGoalInput] = React.useState('');
  const [personalGoals, setPersonalGoals] = React.useState<PreviewPersonalGoal[]>([
    {
      id: 'pg-1',
      content: 'אני מודה על הקמת מסלול אופניים בטוח ומואר סביב היישוב',
    },
    {
      id: 'pg-2',
      content: 'אני מודה על פתיחת שוק קח-תן קהילתי חודשי ברחבת המועדון',
    },
  ]);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingText, setEditingText] = React.useState('');

  function handleAddGoal(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = goalInput.trim();
    if (!trimmed) return;
    setPersonalGoals((prev) => [{ id: `pg-${Date.now()}`, content: trimmed }, ...prev]);
    setGoalInput('');
  }

  function startEdit(goal: PreviewPersonalGoal) {
    setEditingId(goal.id);
    setEditingText(goal.content);
  }

  function saveEdit(id: string) {
    const trimmed = editingText.trim();
    if (!trimmed) return;
    setPersonalGoals((prev) =>
      prev.map((item) => (item.id === id ? { ...item, content: trimmed } : item)),
    );
    setEditingId(null);
    setEditingText('');
  }

  function deleteGoal(id: string) {
    setPersonalGoals((prev) => prev.filter((item) => item.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setEditingText('');
    }
  }

  return (
    <div className="space-y-6">
      {/* כרטיס מוכנות תשתית וחיבור Supabase */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle>מוכנות המערכת וחיבור מסד הנתונים</CardTitle>
              <CardDescription>{connection.message}</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              loading={checkingConnection}
              onClick={onRecheckConnection}
            >
              {!checkingConnection ? (
                <RefreshCw className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
              ) : null}
              <span>בדיקת חיבור</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm text-[#475569]">
          <div className="flex items-center gap-2">
            {connection.status === 'connected' ? (
              <CheckCircle2
                className="h-[18px] w-[18px] text-[#15803D]"
                strokeWidth={1.75}
                aria-hidden="true"
              />
            ) : (
              <Database
                className="h-[18px] w-[18px] text-[#1D4ED8]"
                strokeWidth={1.75}
                aria-hidden="true"
              />
            )}
            <span>
              {connection.status === 'connected'
                ? 'חיבור Supabase ומדיניות הפרטיות (RLS) זמינים ופעילים.'
                : 'קובץ הסכמה המלא מוכן להרצה ב-Supabase SQL Editor. בינתיים ניתן לבדוק כאן את רכיבי העיצוב וה-RTL.'}
            </span>
          </div>
          {connection.latencyMs !== undefined ? (
            <StatusBadge tone="neutral">{connection.latencyMs}ms</StatusBadge>
          ) : null}
        </CardContent>
      </Card>

      {/* סקירת 4 השלבים המאושרים */}
      <section aria-labelledby="stages-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="stages-heading" className="text-base font-semibold text-[#0F172A]">
            מבנה התהליך (4 שלבים ממוקדים)
          </h2>
          <span className="text-xs text-[#475569]">לפי מסמך האפיון הנעול</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PROCESS_STAGES.map((stage) => {
            const IconComponent = stage.icon;
            return (
              <Card key={stage.step}>
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#1D4ED8]">
                    <IconComponent className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-[15px] font-medium leading-6 text-[#0F172A]">
                      {stage.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[#475569]">{stage.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* בדיקת מערכת העיצוב: כתיבה פרטית ורשימה קומפקטית מתרחבת */}
      <section aria-labelledby="design-preview-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 id="design-preview-heading" className="text-base font-semibold text-[#0F172A]">
              תצוגה מקדימה למערכת העיצוב (אבן דרך 1)
            </h2>
            <p className="text-sm text-[#475569]">
              בדיקת קריאות בעברית (RTL), תצוגה קומפקטית כברירת מחדל והרחבה בלחיצה.
            </p>
          </div>
          <InfoPopover label="הנחיה לניסוח" title="הנחיית הרמת הכוסית">
            <p>
              דמיינו הרמת כוסית בראש השנה בעוד 8 חודשים. נסחו בלשון הווה תודה על הישג קונקרטי
              שניתן לקלוט בחושים או לצלם במצלמה. היעדים נשארים פרטיים אצלך עד שתבחר להציג אותם.
            </p>
          </InfoPopover>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>היעדים שלי (דוגמת שלב 1 בנייד)</CardTitle>
            <CardDescription>
              כתיבה, עריכה ומחיקה מקומית לבדיקת נוחות ההקלדה והאייקונים.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <form onSubmit={handleAddGoal} className="flex flex-col gap-2 sm:flex-row">
              <div className="flex-1">
                <Input
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  placeholder="אני מודה על כך ש..."
                  aria-label="היעד האישי שלי"
                />
              </div>
              <Button type="submit" disabled={!goalInput.trim()}>
                <Plus className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
                <span>הוסף</span>
              </Button>
            </form>

            <div className="space-y-2">
              {personalGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] p-3"
                >
                  {editingId === goal.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        aria-label="עריכת נוסח היעד"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingId(null)}
                        >
                          ביטול
                        </Button>
                        <Button size="sm" onClick={() => saveEdit(goal.id)}>
                          שמור
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[15px] font-medium leading-6 text-[#0F172A]">
                        {goal.content}
                      </p>
                      <div className="flex shrink-0 items-center gap-1">
                        <Tooltip content="עריכת יעד">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="עריכת יעד"
                            onClick={() => startEdit(goal)}
                          >
                            <Pencil
                              className="h-[18px] w-[18px]"
                              strokeWidth={1.75}
                              aria-hidden="true"
                            />
                          </Button>
                        </Tooltip>
                        <Tooltip content="מחיקת יעד">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="מחיקת יעד"
                            onClick={() => deleteGoal(goal.id)}
                          >
                            <Trash2
                              className="h-[18px] w-[18px]"
                              strokeWidth={1.75}
                              aria-hidden="true"
                            />
                          </Button>
                        </Tooltip>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>רשימת יעדים אחודים (תצוגה קומפקטית מתרחבת)</CardTitle>
                <CardDescription>
                  לחיצה על כל שורה חושפת את הניסוחים האישיים והתפלגות הניקוד.
                </CardDescription>
              </div>
              <InfoPopover label="מה זה חוזק היעד?" title="חישוב חוזק היעד">
                <p>
                  חוזק היעד משקלל בין סך הנקודות שקיבל היעד לבין שיעור המצביעים שדירגו אותו
                  במקומות הגבוהים ביותר (6–7 נקודות).
                </p>
              </InfoPopover>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {INITIAL_UNIFIED_EXAMPLES.map((goal) => (
              <CompactGoalRow
                key={goal.id}
                title={goal.title}
                primaryMetric={goal.metric}
                leadingControl={<StrengthBadge level={goal.strength} />}
              >
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="text-xs font-medium text-[#0F172A]">
                      הניסוחים האישיים שהרכיבו את היעד:
                    </div>
                    {goal.authors.map((author) => (
                      <div
                        key={author.name}
                        className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] px-3 py-2 text-sm text-[#0F172A]"
                      >
                        <span className="font-medium text-[#1D4ED8]">{author.name}: </span>
                        <span>{author.original}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-[#0F172A]">התפלגות ציונים:</span>
                    {goal.distribution.map((item) => (
                      <StatusBadge key={item.points} tone="neutral">
                        {item.points} נק׳: {item.count} מצביעים
                      </StatusBadge>
                    ))}
                  </div>
                </div>
              </CompactGoalRow>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
