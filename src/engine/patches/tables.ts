import type { PatchContext } from "../../types";
import { isPatched, markPatched } from "../../utils/dom";

/**
 * WCAG 1.3.1: Auto-inject scope attributes on table headers.
 * If first row contains <th> elements, add scope="col".
 * If first column contains <th> elements, add scope="row".
 */
export function patchTableHeaders(root: Element, _ctx: PatchContext): void {
  const tables = root.querySelectorAll("table");

  for (const table of tables) {
    if (isPatched(table, "table-headers")) continue;

    const rows = table.querySelectorAll("tr");
    if (rows.length === 0) continue;

    // First row: check for column headers
    const firstRowCells = rows[0].querySelectorAll("th");
    for (const th of firstRowCells) {
      if (!th.hasAttribute("scope")) {
        th.setAttribute("scope", "col");
      }
    }

    // First column of subsequent rows: check for row headers
    for (let i = 1; i < rows.length; i++) {
      const firstCell = rows[i].querySelector("th");
      if (firstCell && !firstCell.hasAttribute("scope")) {
        firstCell.setAttribute("scope", "row");
      }
    }

    markPatched(table, "table-headers");
  }
}
