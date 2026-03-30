"use client";

import { useEffect, useState } from "react";

export function DemoSection() {
  const [patchedCount, setPatchedCount] = useState(0);

  useEffect(() => {
    // Count patched elements after a11yer runs
    const timer = setTimeout(() => {
      const patched = document.querySelectorAll("[data-a11yer-img-alt], [data-a11yer-keyboard], [data-a11yer-roving], [data-a11yer-required], [data-a11yer-autocomplete], [data-a11yer-label], [data-a11yer-table-headers]");
      setPatchedCount(patched.length);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-8">
      {patchedCount > 0 && (
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-green-800 dark:text-green-200 font-medium">
            a11yer automatically fixed {patchedCount} accessibility issues on
            this page.
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image without alt */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-3">
            Image without alt
          </h3>
          <p className="text-sm text-zinc-500 mb-3">
            a11yer derives alt=&quot;Hero Banner&quot; from the filename.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/a11yer/demo-hero-banner.jpg" className="w-full h-32 object-cover rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>

        {/* Form without labels */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-3">
            Form: auto labels + autocomplete
          </h3>
          <form className="space-y-3">
            <div>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Email</span>
              <input
                type="email"
                name="email"
                className="w-full mt-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
              />
            </div>
            <div>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Name</span>
              <input
                name="fname"
                required
                className="w-full mt-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
              />
            </div>
          </form>
        </div>

        {/* Table without scope */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-3">
            Table: auto scope
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 px-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  Feature
                </th>
                <th className="text-left py-2 px-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Alt text</td>
                <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Auto</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Focus trap</td>
                <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Auto</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Non-native button */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-3">
            Keyboard: div[role=button]
          </h3>
          <p className="text-sm text-zinc-500 mb-3">
            a11yer adds tabindex=0 and Enter/Space handler.
          </p>
          <div
            role="button"
            onClick={() => alert("Clicked!")}
            className="inline-block px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded cursor-pointer"
          >
            Click or press Enter
          </div>
        </div>

        {/* Tabs */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 md:col-span-2">
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-3">
            Roving tabindex: tablist
          </h3>
          <p className="text-sm text-zinc-500 mb-3">
            Arrow keys navigate between tabs. Only the active tab is in the tab
            order.
          </p>
          <div role="tablist" className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
            <div
              role="tab"
              aria-selected="true"
              className="px-4 py-2 rounded text-sm font-medium bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
            >
              Overview
            </div>
            <div
              role="tab"
              className="px-4 py-2 rounded text-sm font-medium text-zinc-600 dark:text-zinc-400"
            >
              Install
            </div>
            <div
              role="tab"
              className="px-4 py-2 rounded text-sm font-medium text-zinc-600 dark:text-zinc-400"
            >
              Config
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
