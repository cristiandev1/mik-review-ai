"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/components/ui/button"
import { Icons } from "@/components/icons"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  const items = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: "dashboard",
    },
    {
      title: "API Keys",
      href: "/dashboard/api-keys",
      icon: "key",
    },
    {
      title: "Custom Rules",
      href: "/dashboard/custom-rules",
      icon: "pencil",
    },
    {
      title: "Analytics",
      href: "/dashboard/analytics",
      icon: "analytics",
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: "settings",
    },
  ]

  return (
    <div className={cn("pb-12 h-screen border-r bg-muted/40 hidden lg:block w-64 fixed left-0 top-0", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="flex items-center px-4 mb-8">
            <Icons.logo className="mr-2 h-6 w-6" />
            <h2 className="text-lg font-semibold tracking-tight">
              Mik Review AI
            </h2>
          </div>
          <div className="space-y-1">
            {items.map((item) => {
              const Icon = Icons[item.icon as keyof typeof Icons]
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                    pathname === item.href ? "bg-accent text-accent-foreground" : "transparent"
                  )}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
      
       <div className="absolute bottom-4 left-0 right-0 px-4">
          <Link
            href="/login"
            onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('apiKey');
            }}
            className="flex items-center rounded-md px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors w-full"
          >
            <Icons.logout className="mr-2 h-4 w-4" />
            Logout
          </Link>
        </div>
    </div>
  )
}
