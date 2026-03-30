"use client";

import { A11yer } from "a11yer";

export function A11yerWrapper({ children }: { children: React.ReactNode }) {
  return <A11yer>{children}</A11yer>;
}
