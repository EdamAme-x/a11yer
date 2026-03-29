import React from "react";
import { createRoot } from "react-dom/client";
import { A11yer } from "../src/index";

/**
 * Test application that deliberately has various a11y issues
 * for a11yer to auto-fix.
 */
function TestApp() {
  return (
    <A11yer>
      <main>
        <h1>A11yer E2E Test Page</h1>

        {/* Image without alt — should get alt from filename */}
        <img src="/images/hero-banner.jpg" />

        {/* Tracking pixel — should get alt="" */}
        <img src="/pixel.gif" width={1} height={1} />

        {/* Form without labels */}
        <form>
          <span>Email Address</span>
          <input type="email" name="email" />

          <input name="fname" placeholder="First name" />

          <span>Required Field</span>
          <input required />

          <div className="error" id="err-test">
            This field is required
          </div>
        </form>

        {/* Table without scope */}
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Age</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Alice</td>
              <td>30</td>
            </tr>
          </tbody>
        </table>

        {/* Non-native button without keyboard handler */}
        <div role="button" onClick={() => {}}>
          Click me
        </div>

        {/* Icon-only button */}
        <button title="Close dialog">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>

        {/* Tablist */}
        <div role="tablist">
          <div role="tab" aria-selected="true">
            Tab 1
          </div>
          <div role="tab">Tab 2</div>
          <div role="tab">Tab 3</div>
        </div>

        {/* Tooltip */}
        <span id="tip1" role="tooltip">
          Helpful tooltip text
        </span>

        {/* Low contrast text */}
        <p style={{ color: "#999999", backgroundColor: "#ffffff" }}>
          This text has low contrast
        </p>
      </main>
    </A11yer>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <TestApp />
  </React.StrictMode>,
);
