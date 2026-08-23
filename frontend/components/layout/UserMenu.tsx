"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings, UserRound, Command } from "lucide-react";
import { useAuth } from "@/stores/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function UserMenu({ collapsed }: { collapsed?: boolean }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const initials = (user?.full_name || user?.email || "U")
    .split(/[\s@._-]+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const trigger = (
    <button className={cn("flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors", collapsed && "justify-center px-0")}>
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-primary/15 text-primary">{initials}</AvatarFallback>
      </Avatar>
      {!collapsed && (
        <span className="flex flex-col items-start leading-tight">
          <span className="max-w-[140px] truncate font-medium">{user?.full_name || user?.email || "Account"}</span>
          <span className="text-xs text-muted-foreground">{user?.email || ""}</span>
        </span>
      )}
    </button>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Command className="h-4 w-4" /> Account
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/settings?tab=profile")}>
          <UserRound /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <Settings /> Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}