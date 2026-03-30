"use client";

import { useEffect, useState } from "react";

const TAB_CONTENT: Record<string, string> = {
  Overview: "a11yer wraps your React app and automatically patches accessibility issues in the DOM.",
  Install: "bun add a11yer — then wrap your root component in <A11yer>.",
  Config: "Pass a config prop to tune contrast ratio, motion preferences, and more.",
};

export function DemoSection() {
  const [patchedCount, setPatchedCount] = useState(0);
  const [activeTab, setActiveTab] = useState("Overview");

  useEffect(() => {
    const timer = setTimeout(() => {
      const patched = document.querySelectorAll(
        "[data-a11yer-img-alt], [data-a11yer-keyboard], [data-a11yer-roving], [data-a11yer-required], [data-a11yer-autocomplete], [data-a11yer-label], [data-a11yer-table-headers]",
      );
      setPatchedCount(patched.length);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Listen for a11yer's roving tabindex focus changes to sync visual state
  useEffect(() => {
    const tablist = document.querySelector('[role="tablist"]');
    if (!tablist) return;

    const observer = new MutationObserver(() => {
      const tabs = tablist.querySelectorAll('[role="tab"]');
      for (const tab of tabs) {
        if (tab.getAttribute("tabindex") === "0") {
          setActiveTab(tab.textContent?.trim() || "Overview");
        }
      }
    });

    observer.observe(tablist, {
      attributes: true,
      attributeFilter: ["tabindex", "aria-selected"],
      subtree: true,
    });

    return () => observer.disconnect();
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
            a11yer derives alt from the filename: &quot;Demo Hero Banner&quot;
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop"
            className="w-full h-32 object-cover rounded"
          />
        </div>

        {/* Form without labels */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-3">
            Form: auto labels + autocomplete
          </h3>
          <form className="space-y-3">
            <div>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Email
              </span>
              <input
                type="email"
                name="email"
                className="w-full mt-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
              />
            </div>
            <div>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Name
              </span>
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
                <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">
                  Alt text
                </td>
                <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">
                  Auto
                </td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">
                  Focus trap
                </td>
                <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">
                  Auto
                </td>
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

        {/* Tabs — roving tabindex managed by a11yer */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 md:col-span-2">
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-3">
            Roving tabindex: tablist
          </h3>
          <p className="text-sm text-zinc-500 mb-3">
            Arrow keys navigate between tabs. Only the active tab is in the tab
            order. a11yer manages tabindex automatically.
          </p>
          <div
            role="tablist"
            className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 mb-4"
          >
            {["Overview", "Install", "Config"].map((tab, i) => (
              <div
                key={tab}
                role="tab"
                aria-selected={tab === activeTab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded text-sm font-medium cursor-pointer transition-colors ${
                  tab === activeTab
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                {tab}
              </div>
            ))}
          </div>
          <div
            role="tabpanel"
            className="p-4 text-sm text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800"
          >
            {TAB_CONTENT[activeTab]}
          </div>
        </div>
      </div>
    </div>
  );
}
