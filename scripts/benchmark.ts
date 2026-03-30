/**
 * Performance benchmark for a11yer's DomScanner.
 * Run: bunx vitest run scripts/benchmark.ts
 *
 * Uses vitest's happy-dom environment for realistic DOM.
 */
import { describe, it } from "vitest";
import { DomScanner } from "../src/engine/DomScanner";
import { defaultA11yConfig } from "../src/types";

function populateDOM(elementCount: number): void {
  document.body.replaceChildren();

  const main = document.createElement("main");
  document.body.appendChild(main);

  for (let i = 0; i < Math.floor(elementCount * 0.1); i++) {
    const img = document.createElement("img");
    img.src = `/images/photo-${i}.jpg`;
    main.appendChild(img);
  }

  const form = document.createElement("form");
  for (let i = 0; i < Math.floor(elementCount * 0.15); i++) {
    const label = document.createElement("span");
    label.textContent = `Field ${i}`;
    const input = document.createElement("input");
    input.name = i % 3 === 0 ? "email" : `field-${i}`;
    input.type = i % 3 === 0 ? "email" : "text";
    if (i % 5 === 0) input.required = true;
    form.appendChild(label);
    form.appendChild(input);
  }
  main.appendChild(form);

  for (let t = 0; t < Math.floor(elementCount * 0.05); t++) {
    const table = document.createElement("table");
    const tr = document.createElement("tr");
    for (let c = 0; c < 3; c++) {
      const th = document.createElement("th");
      th.textContent = `Col ${c}`;
      tr.appendChild(th);
    }
    table.appendChild(tr);
    main.appendChild(table);
  }

  for (let i = 0; i < Math.floor(elementCount * 0.1); i++) {
    const btn = document.createElement("div");
    btn.setAttribute("role", "button");
    btn.textContent = `Action ${i}`;
    main.appendChild(btn);
  }

  const tablist = document.createElement("div");
  tablist.setAttribute("role", "tablist");
  for (let i = 0; i < 5; i++) {
    const tab = document.createElement("div");
    tab.setAttribute("role", "tab");
    tab.textContent = `Tab ${i}`;
    if (i === 0) tab.setAttribute("aria-selected", "true");
    tablist.appendChild(tab);
  }
  main.appendChild(tablist);

  const remaining = elementCount - main.querySelectorAll("*").length;
  for (let i = 0; i < Math.max(0, remaining); i++) {
    const p = document.createElement("p");
    p.textContent = `Paragraph ${i}`;
    main.appendChild(p);
  }
}

describe("DomScanner benchmark", () => {
  for (const count of [100, 500, 1000, 5000]) {
    it(`${count} elements`, () => {
      populateDOM(count);
      const total = document.body.querySelectorAll("*").length;

      const scanner = new DomScanner({
        config: { ...defaultA11yConfig, autoContrastFix: false },
        root: document.body,
      });

      const start = performance.now();
      scanner.start();
      const elapsed = performance.now() - start;
      scanner.stop();

      console.log(`  ${count} target → ${total} actual | scan: ${elapsed.toFixed(2)}ms`);

      // Performance gate (happy-dom is slower than real browsers)
      // Real browser perf is ~3-5x faster than happy-dom
      if (count <= 1000) {
        expect(elapsed).toBeLessThan(200);
      } else {
        expect(elapsed).toBeLessThan(500);
      }
    });
  }
});
