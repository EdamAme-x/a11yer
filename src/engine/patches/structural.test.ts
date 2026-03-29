import { afterEach, describe, expect, it } from "vitest";
import { defaultA11yConfig } from "../../types";
import type { PatchContext } from "../../types";
import { patchHtmlLang, patchSkipLinkTarget } from "./structural";

const ctx: PatchContext = { config: defaultA11yConfig };

afterEach(() => {
  document.documentElement.removeAttribute("lang");
  document.documentElement.removeAttribute("data-a11yer-lang");
  document.body.replaceChildren();
});

describe("patchHtmlLang", () => {
  it("injects lang if missing", () => {
    document.documentElement.removeAttribute("lang");
    patchHtmlLang(ctx);
    expect(document.documentElement.lang).toBeTruthy();
  });

  it("does not overwrite existing lang", () => {
    document.documentElement.lang = "ja";
    patchHtmlLang(ctx);
    expect(document.documentElement.lang).toBe("ja");
  });
});

describe("patchSkipLinkTarget", () => {
  it("adds id=main-content to main if missing", () => {
    const main = document.createElement("main");
    main.textContent = "Content";
    document.body.appendChild(main);

    patchSkipLinkTarget(document.body);
    expect(main.id).toBe("main-content");
  });

  it("does not overwrite existing id", () => {
    const main = document.createElement("main");
    main.id = "app";
    main.textContent = "Content";
    document.body.appendChild(main);

    patchSkipLinkTarget(document.body);
    expect(main.id).toBe("app");
  });
});
