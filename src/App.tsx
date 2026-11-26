import * as React from 'react';
import { DirectionProvider } from '@radix-ui/react-direction';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { TooltipProvider } from '@/components/ui';
import { isSupabaseConfigured } from '@/lib/env';
import { checkSupabaseConnection, type SupabaseConnectionResult } from '@/lib/supabase';
import { HomePage } from '@/pages/HomePage';

function AppLayout() {
  const [connection, setConnection] = React.useState<SupabaseConnectionResult>(() => ({
    status: isSupabaseConfigured ? 'connected' : 'unconfigured',
    message: isSupabaseConfigured
      ? 'בודק את החיבור למסד הנתונים...'
      : 'ממתין להגדרת פרטי החיבור של Supabase בקובץ .env.local',
  }));
  const [checkingConnection, setCheckingConnection] = React.useState(false);

  const runConnectionCheck = React.useCallback(async () => {
    setCheckingConnection(true);
    try {
      const result = await checkSupabaseConnection();
      setConnection(result);
    } finally {
      setCheckingConnection(false);
    }
  }, []);

  React.useEffect(() => {
    void runConnectionCheck();
  }, [runConnectionCheck]);

  return (
    <AppShell connection={connection}>
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              connection={connection}
              checkingConnection={checkingConnection}
              onRecheckConnection={() => {
                void runConnectionCheck();
              }}
            />
          }
        />
      </Routes>
    </AppShell>
  );
}

export function App() {
  return (
    <DirectionProvider dir="rtl">
      <TooltipProvider delayDuration={250}>
        <HashRouter>
          <AppLayout />
        </HashRouter>
      </TooltipProvider>
    </DirectionProvider>
  );
}

export default App;
