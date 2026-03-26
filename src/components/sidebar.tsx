"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserButtonComponent } from "@/components/user-button";
import {
  LayoutDashboard,
  Upload,
  FileText,
  TrendingUp,
  Settings,
  Calculator,
  History,
  MessageSquare,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/transactions", label: "Transactions", icon: FileText },
  { href: "/dashboard/analytics", label: "Analytics", icon: TrendingUp },
  { href: "/dashboard/simulator", label: "Simulator", icon: Calculator },
  { href: "/dashboard/interceptor", label: "Decision Setup", icon: MessageSquare },
  { href: "/dashboard/upload", label: "Upload", icon: Upload },
  { href: "/dashboard/uploads", label: "Upload History", icon: History },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-background text-foreground">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/dashboard" className="flex items-center">
          <span className="font-black text-2xl tracking-tight uppercase text-foreground font-sans antialiased">
            SpendWise
          </span>
        </Link>
      </div>

      {/* Navigation Links with Scroll Container */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 rounded-md px-4 py-3 text-base font-medium transition-all duration-150",
                isActive
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive ? "text-background" : "text-foreground")} />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="border-t p-4 border-border">
        <div className="flex items-center justify-between">
          <UserButtonComponent />
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
