import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { User, History, Mic } from "lucide-react";
import Image from 'next/image';

export function HomePageHeader() {
  return (
    <header className="w-full bg-gradient-to-r from-primary to-accent p-4 shadow-md sticky top-0 z-20">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
              <Mic className="h-6 w-6 text-white" strokeWidth={2} />
          </div>
          <div>
            <Image src="/images/icon.png" alt="Nola" width={100} height={100} className="w-20 h-20" />
          </div>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <Button asChild className="bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all">
            <Link href="/history">
              <History className="mr-2 h-5 w-5" />
              Đơn hàng
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white rounded-full transition-all">
            <Link href="/account">
              <User className="h-6 w-6" />
              <span className="sr-only">Tài khoản</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
