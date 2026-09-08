import { Link } from "react-router-dom";
import { Dice5, Plus } from "lucide-react";
import type { ReactNode } from "react";

/**
 * App-wide chrome: a minimal sticky brand header over a single content column.
 * Stays out of the way so the content (and the result hero) is the focus.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-white/20 bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-6">
          <Link
            to="/"
            aria-label="ChooseForMe home"
            className="-ml-2 inline-flex items-center gap-2 rounded-pill px-2 py-1 transition-opacity hover:opacity-80"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm">
              <Dice5 className="h-4 w-4 text-accent" />
            </span>
            <span className="text-sm font-semibold tracking-tight text-white">ChooseForMe</span>
          </Link>

          {/* Always-available "+ New Decision" action (opens the form on the home screen) */}
          <Link
            to="/?create=1"
            aria-label="New decision"
            title="New decision"
            className="-mr-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
          >
            <Plus className="h-5 w-5" />
          </Link>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}