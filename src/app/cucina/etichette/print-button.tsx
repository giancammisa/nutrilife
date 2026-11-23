"use client";

import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button type="button" size="lg" className="h-12 rounded-full text-base" onClick={() => window.print()}>
      Stampa
    </Button>
  );
}
