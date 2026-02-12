"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
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
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 flex items-center h-14 gap-8">
        <Link href="/" className="text-lg font-bold text-blue-400">
          MAL Explorer
        </Link>
        <div className="flex gap-1 flex-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          {loading ? null : user ? (
            <div className="flex items-center gap-2">
              {user.picture && (
                <Image
                  src={user.picture}
                  alt={user.name}
                  width={28}
                  height={28}
                  className="rounded-full"
                  unoptimized
                />
              )}
              <span className="text-sm text-gray-300 hidden sm:inline">{user.name}</span>
              <button
                onClick={logout}
                className="text-xs px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <GoogleSignInButton />
          )}
        </div>
      </div>
    </nav>
  );
}
