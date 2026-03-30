import { CodeBlock } from "./code-block";
import { DemoSection } from "./demo-section";

const INSTALL_CODE = `bun add a11yer`;

const USAGE_CODE = `import { A11yer } from "a11yer";

function App() {
  return (
    <A11yer>
      <YourApp />
    </A11yer>
  );
}`;

const CONFIG_CODE = `<A11yer
  config={{
    a11y: {
      minContrastRatio: 7,        // WCAG AAA (default: 4.5)
      focusVisible: true,          // default: true
      reducedMotion: "auto",       // "auto" | "always" | "never"
      autoImgAlt: true,            // default: true
      announceSpaNavigation: true, // default: true
      autoContrastFix: true,       // default: true
    },
  }}
>
  <App />
</A11yer>`;

// Server Component — all static content is SSR'd with shiki highlighting at build time.
export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <nav className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            a11yer
          </h1>
          <div className="flex gap-4">
            <a
              href="https://github.com/EdamAme-x/a11yer"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            >
              GitHub
            </a>
            <a
              href="https://www.npmjs.com/package/a11yer"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            >
              npm
            </a>
          </div>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16">
        {/* Hero */}
        <section className="mb-20">
          <h2 className="text-5xl font-bold text-zinc-900 dark:text-white mb-6 leading-tight">
            Automatic Accessibility for React
          </h2>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-8 max-w-2xl">
            Wrap your app in{" "}
            <code className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-sm font-mono">
              {"<A11yer>"}
            </code>{" "}
            and accessibility is automatically handled. No hooks, no props to
            spread, no components to replace.
          </p>

          <CodeBlock code={USAGE_CODE} lang="tsx" />

          <div className="mt-6">
            <CodeBlock code={INSTALL_CODE} lang="bash" />
          </div>
        </section>

        {/* What it does */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-8">
            What it does
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: "Images",
                desc: "Alt text from filename (Title Case), decorative detection, SVG aria-hidden",
              },
              {
                title: "Forms",
                desc: "aria-required, aria-invalid + error linking, input labels, autocomplete",
              },
              {
                title: "Keyboard",
                desc: "Enter/Space on div[role=button], roving tabindex for tabs/menus/toolbars",
              },
              {
                title: "Focus",
                desc: "Focus trap for modals, focus-visible CSS, focus restoration on close",
              },
              {
                title: "Contrast",
                desc: "Auto-fix insufficient contrast via CSS override (hex/rgb/hsl/oklch)",
              },
              {
                title: "Navigation",
                desc: "Skip link, SPA route announcements, document title from h1",
              },
              {
                title: "Tables",
                desc: "scope=col/row on th elements",
              },
              {
                title: "Motion",
                desc: "prefers-reduced-motion CSS injection",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-5"
              >
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Live Demo */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">
            Live Demo
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-8">
            This page is wrapped in{" "}
            <code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-sm font-mono">
              {"<A11yer>"}
            </code>
            . The elements below have deliberate a11y issues that are
            automatically fixed.
          </p>
          <DemoSection />
        </section>

        {/* Config */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-8">
            Configuration
          </h2>
          <CodeBlock code={CONFIG_CODE} lang="tsx" />
        </section>

        {/* Compatibility */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-8">
            Plays nice with others
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            a11yer detects elements managed by existing libraries and skips
            them. No conflicts.
          </p>
          <div className="flex flex-wrap gap-3">
            {[
              "Radix UI",
              "react-aria",
              "Headless UI",
              "MUI",
              "Chakra UI",
              "Mantine",
              "Ant Design",
              "shadcn/ui",
              "Ark UI",
              "NextUI",
            ].map((lib) => (
              <span
                key={lib}
                className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full text-sm text-zinc-700 dark:text-zinc-300"
              >
                {lib}
              </span>
            ))}
          </div>
        </section>

        {/* Disclaimer */}
        <section className="mb-20 border-l-4 border-amber-400 pl-6 py-2">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            <strong>Disclaimer:</strong> a11yer automatically fixes many common
            accessibility issues, but does not guarantee full WCAG 2.2
            compliance. Use it as a safety net alongside manual a11y audits and
            screen reader testing.
          </p>
        </section>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8">
        <div className="max-w-5xl mx-auto px-6 text-center text-sm text-zinc-500">
          MIT License | Made by{" "}
          <a
            href="https://github.com/EdamAme-x"
            className="underline hover:text-zinc-900 dark:hover:text-white"
          >
            EdamAme-x
          </a>
        </div>
      </footer>
    </div>
  );
}
