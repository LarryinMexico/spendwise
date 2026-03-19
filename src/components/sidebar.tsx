"use client";

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
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "總覽", icon: LayoutDashboard },
  { href: "/dashboard/upload", label: "上傳", icon: Upload },
  { href: "/dashboard/transactions", label: "交易", icon: FileText },
  { href: "/dashboard/analytics", label: "分析", icon: TrendingUp },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          <span className="font-bold">Finance AI</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <div className="flex items-center justify-between">
          <UserButtonComponent />
        </div>
      </div>
    </div>
  );
}
