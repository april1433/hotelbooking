"use client";

import Link from "next/link";
import { Terminal, Wrench, ShieldCheck } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function DevLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const menuItems = [
    { label: "Workspace Overview", href: "/dev", icon: Terminal },
    { label: "Systems Testing Console", href: "/dev/test", icon: Wrench },
  ];

  return (
    <div className="min-h-screen bg-[#090d16] text-[#c9d1d9] font-sans flex flex-col">
      {/* Dev Header */}
      <header className="h-16 border-b border-[#21262d] bg-[#0d1117] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Terminal className="h-4.5 w-4.5 text-amber-500" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white flex items-center gap-1.5">
              <span>Azure PMS Developer Console</span>
              <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded-md font-mono font-medium">
                Sandbox
              </span>
            </div>
            <p className="text-[10px] text-gray-500">Internal testing tools · Super Admin privileges only in production</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/" className="text-xs text-gray-400 hover:text-white transition-colors">
            Exit Workspace
          </Link>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Dev Sidebar */}
        <aside className="w-64 border-r border-[#21262d] bg-[#0d1117] flex flex-col p-4 gap-1 shrink-0">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-3 mb-2">
            Modules
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer",
                    active
                      ? "bg-[#21262d] text-white"
                      : "text-gray-400 hover:text-white hover:bg-[#161b22]"
                  )}
                >
                  <Icon className={cn("h-4 w-4", active ? "text-amber-500" : "text-gray-500")} />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}

          <div className="mt-auto border-t border-[#21262d] pt-4">
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <ShieldCheck className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-semibold text-amber-500">RBAC Active</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed font-light">
                Secure middleware guards this directory in production mode.
              </p>
            </div>
          </div>
        </aside>

        {/* Content Panel */}
        <main className="flex-1 overflow-y-auto p-8 scrollbar-none bg-[#090d16]">
          {children}
        </main>
      </div>
    </div>
  );
}
