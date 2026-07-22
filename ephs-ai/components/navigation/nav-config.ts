import {
  BookOpen,
  CalendarRange,
  Compass,
  GraduationCap,
  LayoutDashboard,
  LibraryBig,
  MessageCircle,
  Sparkles,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Short label for the mobile tab bar. */
  short?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Grouped destinations for the desktop student sidebar. */
export const APP_NAV: NavGroup[] = [
  {
    label: "Planning",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/courses", label: "Courses", icon: BookOpen },
      { href: "/plan", label: "Four-Year Plan", icon: CalendarRange, short: "Plan" },
      { href: "/requirements", label: "Requirements", icon: GraduationCap },
      { href: "/pathways", label: "Pathways", icon: Compass },
    ],
  },
  {
    label: "Explore",
    items: [
      { href: "/clubs", label: "Clubs", icon: Users },
      { href: "/chat", label: "Ask EPHS AI", icon: Sparkles, short: "Ask AI" },
    ],
  },
  {
    label: "Student",
    items: [
      { href: "/transcript", label: "Transcript", icon: LibraryBig },
      { href: "/profile", label: "Profile", icon: UserRound },
    ],
  },
];

/** Five primary items for the mobile bottom bar. */
export const MOBILE_PRIMARY: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard, short: "Home" },
  { href: "/courses", label: "Courses", icon: BookOpen, short: "Courses" },
  { href: "/plan", label: "Plan", icon: CalendarRange, short: "Plan" },
  { href: "/chat", label: "Ask AI", icon: Sparkles, short: "Ask AI" },
];

/** Destinations tucked behind the mobile "More" sheet. */
export const MOBILE_MORE: NavItem[] = [
  { href: "/pathways", label: "Pathways", icon: Compass },
  { href: "/requirements", label: "Requirements", icon: GraduationCap },
  { href: "/clubs", label: "Clubs", icon: Users },
  { href: "/transcript", label: "Transcript", icon: LibraryBig },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function isNavActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export { MessageCircle };
