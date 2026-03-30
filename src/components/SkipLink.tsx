"use client";

// Top 8 web languages by usage. Others fall back to English.
const L: Record<string, string> = {
  en: "Skip to main content",
  ja: "メインコンテンツへスキップ",
  zh: "跳到主要内容",
  ko: "주요 콘텐츠로 건너뛰기",
  es: "Saltar al contenido principal",
  fr: "Aller au contenu principal",
  de: "Zum Hauptinhalt springen",
  pt: "Pular para o conteúdo principal",
};

/** Internal skip navigation link. Label matches page language. */
export function SkipLink() {
  const lang =
    typeof document !== "undefined"
      ? (document.documentElement.lang || navigator?.language || "en")
          .split("-")[0]
          .toLowerCase()
      : "en";

  return (
    <a href="#main-content" className="a11yer-skip-link">
      {L[lang] || L.en}
    </a>
  );
}
