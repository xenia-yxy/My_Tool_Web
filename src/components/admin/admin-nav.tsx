"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminNavItems, isAdminNavItemActive } from "@/components/admin/admin-nav-items";
import { cn } from "@/lib/utils";

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="后台导航" className="mt-8 flex flex-wrap gap-2 lg:flex-col">
      {adminNavItems.map((item) => {
        const Icon = item.icon;
        const active = isAdminNavItemActive(pathname, item.href);

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-slate-950 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
            )}
            href={item.href}
            key={item.href}
          >
            <Icon aria-hidden="true" className="h-4 w-4" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
