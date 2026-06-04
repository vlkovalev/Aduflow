"use client";

export function PrintButton() {
  return (
    <button
      className="button primary fullButton printHide"
      type="button"
      onClick={() => window.print()}
    >
      Download PDF
    </button>
  );
}
