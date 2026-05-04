"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Camera, LayoutDashboard } from "lucide-react";
import clsx from "clsx";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <>
      {/* ===== Top Navbar (always visible) ===== */}
      <nav className="fixed top-0 inset-x-0 h-14 sm:h-16 bg-white/95 backdrop-blur-md border-b border-gray-200 z-50 px-4 md:px-8">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white group-hover:bg-blue-700 transition-colors">
              <Map className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg sm:text-xl tracking-tight text-gray-900">
              CivicLens
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden sm:flex items-center gap-4">
            <Link
              href="/"
              className={clsx(
                "text-sm font-medium transition-colors hover:text-blue-600",
                pathname === "/" ? "text-blue-600" : "text-gray-600"
              )}
            >
              Dashboard
            </Link>
            <Link
              href="/report"
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-all active:scale-95 shadow-sm shadow-blue-200"
            >
              <Camera className="w-4 h-4" />
              <span>Report Issue</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== Bottom Navigation Bar (mobile only) ===== */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-50 safe-bottom">
        <div className="flex items-stretch h-14">
          <Link
            href="/"
            className={clsx(
              "flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors",
              pathname === "/" ? "text-blue-600" : "text-gray-500"
            )}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-medium">Dashboard</span>
          </Link>

          <Link
            href="/report"
            className={clsx(
              "flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors",
              pathname === "/report" ? "text-blue-600" : "text-gray-500"
            )}
          >
            <Camera className="w-5 h-5" />
            <span className="text-[10px] font-medium">Report</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
