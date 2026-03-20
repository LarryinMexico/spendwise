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
  Calculator,
  Bird,
} from "lucide-react";
import { InterceptorInput } from "@/components/sidebar/interceptor-input";

const navItems = [
  { href: "/dashboard", label: "總覽", icon: LayoutDashboard },
  { href: "/dashboard/upload", label: "上傳", icon: Upload },
  { href: "/dashboard/transactions", label: "交易", icon: FileText },
  { href: "/dashboard/analytics", label: "分析", icon: TrendingUp },
  { href: "/dashboard/simulator", label: "模擬器", icon: Calculator },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Bird className="h-6 w-6 text-yellow-500 fill-yellow-400" />
          <span className="font-bold text-lg tracking-wider text-amber-700">早安小雞</span>
        </Link>
      </div>

      {/* Navigation Links with Scroll Container */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
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
      </div>

      {/* Consumption Assistant - Sticky at bottom above user profile */}
      <div className="border-t bg-card/80 backdrop-blur-sm z-10">
        <InterceptorInput />
      </div>

      <div className="border-t p-4">
        <div className="flex items-center justify-between">
          <UserButtonComponent />
        </div>
      </div>
    </div>
  );
}
