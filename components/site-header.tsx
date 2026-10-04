import Link from "next/link";
import { Logo } from "./logo";

export function SiteHeader({ loggedIn }: { loggedIn: boolean }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line/80 bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:gap-6 sm:px-5">
        <Logo />
        <nav className="flex items-center gap-4 text-sm sm:gap-6">
          <Link href="/#services" className="text-ink-soft hover:text-ink">
            الخدمات
          </Link>
          {loggedIn ? (
            <Link href="/studio" className="bg-ink px-4 py-2 text-paper">
              المكتب
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-ink-soft hover:text-ink">
                دخول
              </Link>
              <Link href="/register" className="bg-ink px-4 py-2 text-paper">
                افتح حسابًا
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
