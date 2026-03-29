import { afterEach, describe, expect, it } from "vitest";
import { defaultA11yConfig } from "../../types";
import type { PatchContext } from "../../types";
import { patchTableHeaders } from "./tables";

const ctx: PatchContext = { config: defaultA11yConfig };

afterEach(() => {
  document.body.replaceChildren();
});

function buildTable(html: {
  firstRow: string[];
  dataRows?: string[][];
  firstRowUseTh?: boolean;
}): HTMLTableElement {
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");

  const headerRow = document.createElement("tr");
  for (const cell of html.firstRow) {
    const th = document.createElement(html.firstRowUseTh === false ? "td" : "th");
    th.textContent = cell;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  for (const rowData of html.dataRows ?? []) {
    const tr = document.createElement("tr");
    rowData.forEach((cell, i) => {
      const el = i === 0 ? document.createElement("th") : document.createElement("td");
      el.textContent = cell;
      tr.appendChild(el);
    });
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  document.body.appendChild(table);
  return table;
}

describe("patchTableHeaders", () => {
  it("adds scope=col to first-row th elements", () => {
    const table = buildTable({ firstRow: ["Name", "Age"] });
    patchTableHeaders(document.body, ctx);

    const ths = table.querySelectorAll("thead th");
    for (const th of ths) {
      expect(th.getAttribute("scope")).toBe("col");
    }
  });

  it("adds scope=row to first-column th elements in subsequent rows", () => {
    const table = buildTable({
      firstRow: ["Name", "Score"],
      dataRows: [
        ["Alice", "90"],
        ["Bob", "85"],
      ],
    });
    patchTableHeaders(document.body, ctx);

    const bodyRows = table.querySelectorAll("tbody tr");
    for (const row of bodyRows) {
      const firstCell = row.querySelector("th");
      expect(firstCell?.getAttribute("scope")).toBe("row");
    }
  });

  it("does not overwrite an existing scope attribute on header cells", () => {
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    th.setAttribute("scope", "colgroup");
    th.textContent = "Group";
    tr.appendChild(th);
    thead.appendChild(tr);
    table.appendChild(thead);
    document.body.appendChild(table);

    patchTableHeaders(document.body, ctx);
    expect(th.getAttribute("scope")).toBe("colgroup");
  });

  it("does not add scope when first row contains no th elements", () => {
    const table = document.createElement("table");
    const tr = document.createElement("tr");
    const td1 = document.createElement("td");
    const td2 = document.createElement("td");
    td1.textContent = "A";
    td2.textContent = "B";
    tr.append(td1, td2);
    table.appendChild(tr);
    document.body.appendChild(table);

    patchTableHeaders(document.body, ctx);
    expect(td1.hasAttribute("scope")).toBe(false);
    expect(td2.hasAttribute("scope")).toBe(false);
  });

  it("marks the table as patched after applying", () => {
    const table = buildTable({ firstRow: ["Col1"] });
    patchTableHeaders(document.body, ctx);
    expect(table.hasAttribute("data-a11yer-table-headers")).toBe(true);
  });

  it("does not double-patch an already-patched table", () => {
    const table = buildTable({ firstRow: ["Name"] });
    patchTableHeaders(document.body, ctx);

    // Manually change scope to something else and re-run — should not overwrite
    // because the table is already marked as patched.
    const th = table.querySelector("th")!;
    th.setAttribute("scope", "changed");
    patchTableHeaders(document.body, ctx);
    expect(th.getAttribute("scope")).toBe("changed");
  });
});
