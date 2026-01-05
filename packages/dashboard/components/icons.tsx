import { Loader2, GitBranch, Github, LayoutDashboard, Settings, Key, BarChart3, LogOut, User, Plus, Pencil, Trash2, Globe, Users, Check } from "lucide-react"

export const Icons = {
  spinner: Loader2,
  gitBranch: GitBranch,
  github: Github,
  dashboard: LayoutDashboard,
  settings: Settings,
  key: Key,
  analytics: BarChart3,
  logout: LogOut,
  user: User,
  users: Users,
  plus: Plus,
  pencil: Pencil,
  trash: Trash2,
  globe: Globe,
  check: Check,
  logo: ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
    </svg>
  ),
}
