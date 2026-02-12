"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import GoogleSignInButton from "./GoogleSignInButton";

const links = [
  { href: "/", label: "Search" },
  { href: "/stats", label: "Stats" },
  { href: "/watchlist", label: "Watchlist" },
];

export default function Navigation() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  return (
    <nav className="border-b border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-14 gap-6">
        <Link href="/" className="text-lg font-bold text-primary">
          MAL Explorer
        </Link>
        <div className="flex gap-1 flex-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Button
                key={link.href}
                variant={active ? "default" : "ghost"}
                size="sm"
                asChild
              >
                <Link href={link.href}>{link.label}</Link>
              </Button>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          {loading ? null : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Avatar className="h-6 w-6">
                    {user.picture && <AvatarImage src={user.picture} alt={user.name} />}
                    <AvatarFallback className="text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-muted-foreground text-xs">
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <GoogleSignInButton />
          )}
        </div>
      </div>
    </nav>
  );
}
