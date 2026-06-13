import {
  BarChart3,
  BookOpen,
  FileText,
  Heart,
  Settings
} from "lucide-react";

export const primaryNavigation = [
  { label: "Library", icon: BookOpen, to: "/" },
  { label: "Favorites", icon: Heart, to: "/favorites" },
  { label: "Templates", icon: FileText, to: "/templates" },
  { label: "Analytics", icon: BarChart3, to: "/analytics" },
  { label: "Settings", icon: Settings, to: "/settings" }
] as const;
