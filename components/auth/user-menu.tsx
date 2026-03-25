"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/lib/types";

export function UserMenu({ role }: { role?: Role }) {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (!user) {
    return (
      <div className="flex gap-2">
        <Link href="/login">
          <Button variant="outline" size="sm">
            Sign in
          </Button>
        </Link>
        <Link href="/register">
          <Button size="sm">
            Create account
          </Button>
        </Link>
      </div>
    );
  }

  if (role === "student") {
    return null;
  }

  return (
    <>
      <div className="hidden items-center gap-2 md:flex">
        <Link href="/profile">
          <Button variant="outline" size="sm" className="gap-2 rounded-xl">
            <User className="h-4 w-4" />
            Profile
          </Button>
        </Link>
        <Link href="/settings">
          <Button variant="outline" size="sm" className="gap-2 rounded-xl">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </Link>
        <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
        <div className="ml-1 flex items-center gap-2 rounded-full border bg-white px-2 py-1">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email || ""} />
            <AvatarFallback>
              {user.email?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="max-w-[150px] pr-2 text-left">
            <p className="truncate text-sm font-medium leading-none">{user.user_metadata?.full_name || user.email}</p>
            <p className="mt-1 truncate text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full md:hidden">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email || ""} />
              <AvatarFallback>
                {user.email?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user.user_metadata?.full_name || user.email}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
