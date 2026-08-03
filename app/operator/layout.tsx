/**
 * Operator Internal Dashboard Layout
 * Navigation for pilot management surfaces
 */

import Link from "next/link";
import React from "react";

export const metadata = {
  title: "FloorForge Operator Console",
  description: "Internal pilot management and operations",
};

export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            FloorForge Operator Console
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Internal tool for managing pilot applications and jobs
          </p>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8">
            <Link
              href="/operator/applications"
              className="px-4 py-4 border-b-2 border-transparent hover:border-gray-300 text-gray-700 hover:text-gray-900 font-medium text-sm"
            >
              Pilot Applications
            </Link>
            <Link
              href="/operator/jobs"
              className="px-4 py-4 border-b-2 border-transparent hover:border-gray-300 text-gray-700 hover:text-gray-900 font-medium text-sm"
            >
              Jobs
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-4 text-sm text-gray-600">
          <p>FloorForge Operator Console — Internal Use Only</p>
        </div>
      </footer>
    </div>
  );
}
