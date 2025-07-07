
'use client';

import { useState, useEffect } from 'react';

function getCurrentYear() {
    return new Date().getFullYear();
}

export function AppFooter() {
  const [year, setYear] = useState(getCurrentYear());

  useEffect(() => {
    setYear(getCurrentYear());
  }, []);

  return (
    <footer className="w-full shrink-0 border-t bg-background py-6 text-center text-sm text-muted-foreground">
      <p>&copy; {year} Nola. Bảo lưu mọi quyền.</p>
    </footer>
  );
}
