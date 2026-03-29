import type { PatchContext } from "../../types";
import { isPatched, markPatched } from "../../utils/dom";

/**
 * WCAG 1.3.5: Auto-inject autocomplete attributes on inputs
 * that match common personal data patterns.
 */

const AUTOCOMPLETE_MAP: Record<string, string> = {
  // Name fields
  name: "name",
  "full-name": "name",
  fullname: "name",
  fname: "given-name",
  "first-name": "given-name",
  firstname: "given-name",
  "given-name": "given-name",
  lname: "family-name",
  "last-name": "family-name",
  lastname: "family-name",
  "family-name": "family-name",

  // Contact
  email: "email",
  "e-mail": "email",
  tel: "tel",
  phone: "tel",
  mobile: "tel",

  // Address
  address: "street-address",
  "address-line1": "address-line1",
  "address-line2": "address-line2",
  "street-address": "street-address",
  city: "address-level2",
  state: "address-level1",
  zip: "postal-code",
  zipcode: "postal-code",
  "zip-code": "postal-code",
  postal: "postal-code",
  "postal-code": "postal-code",
  country: "country-name",

  // Account
  username: "username",
  password: "current-password",
  "new-password": "new-password",
  "current-password": "current-password",

  // Payment
  "cc-name": "cc-name",
  "cc-number": "cc-number",
  "cc-exp": "cc-exp",
  "cc-csc": "cc-csc",

  // Other
  bday: "bday",
  birthday: "bday",
  organization: "organization",
  company: "organization",
};

export function patchAutocomplete(root: Element, _ctx: PatchContext): void {
  const inputs = root.querySelectorAll<HTMLInputElement>(
    "input:not([autocomplete]):not([type='hidden']):not([type='submit']):not([type='reset']):not([type='button']):not([type='checkbox']):not([type='radio']):not([type='file'])",
  );

  for (const input of inputs) {
    if (isPatched(input, "autocomplete")) continue;

    // Check type attribute first
    const type = input.type?.toLowerCase();
    if (type === "email") {
      input.setAttribute("autocomplete", "email");
      markPatched(input, "autocomplete");
      continue;
    }
    if (type === "tel") {
      input.setAttribute("autocomplete", "tel");
      markPatched(input, "autocomplete");
      continue;
    }

    // Check name/id against known patterns
    const identifier = (input.name || input.id || "").toLowerCase().replace(/[_\s]/g, "-");
    const match = AUTOCOMPLETE_MAP[identifier];
    if (match) {
      input.setAttribute("autocomplete", match);
      markPatched(input, "autocomplete");
      continue;
    }

    // No match — don't patch, don't mark (might match later if name changes)
  }
}
