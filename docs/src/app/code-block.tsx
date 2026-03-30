import { codeToHtml } from "shiki";

// Server Component — syntax highlighting at build time (SSR).
// dangerouslySetInnerHTML is safe here: shiki output is from hardcoded code strings, not user input.
export async function CodeBlock({
  code,
  lang = "tsx",
}: {
  code: string;
  lang?: string;
}) {
  const html = await codeToHtml(code.trim(), {
    lang,
    theme: "github-dark",
  });

  return (
    <div
      className="rounded-lg overflow-x-auto text-sm [&_pre]:p-6 [&_pre]:m-0"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
