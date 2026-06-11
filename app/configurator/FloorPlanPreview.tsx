"use client";

import React from "react";

type Props = {
  modelCode: string;
};

export function FloorPlanPreview({ modelCode }: Props) {
  // Determine size/code specific layout values
  const isStudio = modelCode.includes("studio") || modelCode === "studio-312";
  const isSuite = modelCode.includes("suite") || modelCode === "suite-624";
  const isTwoBed = modelCode.includes("adu") || modelCode === "adu-816";

  // Default dimensions/labels
  let title = "Custom Modular Unit";
  let dimensions = "Dynamic Layout";
  let svgContent = null;

  if (isStudio) {
    title = "Backyard Studio 312";
    dimensions = "12' x 26'";
    svgContent = (
      <>
        {/* Exterior walls */}
        <rect x="20" y="20" width="240" height="120" fill="none" stroke="var(--forest)" strokeWidth="6" rx="4" />
        <rect x="23" y="23" width="234" height="114" fill="none" stroke="#e0e8e3" strokeWidth="1" />
        
        {/* Main Sliding Door */}
        <line x1="80" y1="20" x2="140" y2="20" stroke="white" strokeWidth="7" />
        <line x1="80" y1="17" x2="110" y2="17" stroke="var(--muted)" strokeWidth="2" />
        <line x1="108" y1="15" x2="138" y2="15" stroke="var(--muted)" strokeWidth="2" />
        <text x="100" y="32" fontSize="9" fill="var(--muted)" fontWeight="bold">ENTRY</text>

        {/* Windows */}
        <line x1="260" y1="50" x2="260" y2="90" stroke="white" strokeWidth="7" />
        <line x1="262" y1="50" x2="262" y2="90" stroke="var(--muted)" strokeWidth="1" />
        
        {/* Bathroom Pod (Top Right) */}
        <line x1="200" y1="20" x2="200" y2="75" stroke="var(--forest)" strokeWidth="4" />
        <line x1="200" y1="75" x2="260" y2="75" stroke="var(--forest)" strokeWidth="4" />
        <text x="212" y="52" fontSize="9" fill="var(--muted)" fontWeight="bold">BATH</text>
        
        {/* Toilet */}
        <rect x="238" y="25" width="16" height="12" rx="2" fill="none" stroke="var(--line)" strokeWidth="2" />
        <ellipse cx="246" cy="42" rx="7" ry="9" fill="none" stroke="var(--line)" strokeWidth="2" />
        
        {/* Shower */}
        <rect x="205" y="25" width="25" height="25" fill="none" stroke="var(--line)" strokeWidth="2" />
        <line x1="205" y1="25" x2="230" y2="50" stroke="var(--line)" strokeWidth="1" strokeDasharray="2,2" />
        <line x1="230" y1="25" x2="205" y2="50" stroke="var(--line)" strokeWidth="1" strokeDasharray="2,2" />

        {/* Compact Kitchen Wall (Bottom Left) */}
        <rect x="20" y="105" width="110" height="35" fill="#f7f8f3" stroke="var(--line)" strokeWidth="2" />
        <text x="50" y="125" fontSize="9" fill="var(--muted)" fontWeight="bold">KITCHENETTE</text>
        {/* Sink circle */}
        <circle cx="38" cy="122" r="6" fill="none" stroke="var(--line)" strokeWidth="1.5" />
        {/* Stovetop circles */}
        <circle cx="95" cy="122" r="5" fill="none" stroke="var(--line)" strokeWidth="1.5" />
        <circle cx="110" cy="122" r="4" fill="none" stroke="var(--line)" strokeWidth="1.5" />

        {/* Studio Bed Area (Left) */}
        <g transform="translate(25, 30)">
          {/* Bed frame */}
          <rect x="0" y="0" width="50" height="60" fill="none" stroke="var(--line)" strokeWidth="2" rx="2" />
          {/* Pillows */}
          <rect x="5" y="5" width="16" height="10" rx="1" fill="none" stroke="var(--line)" strokeWidth="1.5" />
          <rect x="5" y="18" width="16" height="10" rx="1" fill="none" stroke="var(--line)" strokeWidth="1.5" />
          <line x1="25" y1="0" x2="25" y2="60" stroke="var(--line)" strokeWidth="1" strokeDasharray="2,2" />
          <text x="12" y="45" fontSize="9" fill="var(--line)" fontWeight="bold">BED</text>
        </g>

        {/* Living Space (Center) */}
        <circle cx="165" cy="95" r="14" fill="none" stroke="var(--line)" strokeWidth="2" />
        <text x="150" y="98" fontSize="9" fill="var(--muted)" fontWeight="bold">STUDY</text>
      </>
    );
  } else if (isSuite) {
    title = "Garden Suite 624";
    dimensions = "24' x 26'";
    svgContent = (
      <>
        {/* Exterior walls */}
        <rect x="20" y="20" width="240" height="200" fill="none" stroke="var(--forest)" strokeWidth="6" rx="4" />
        <rect x="23" y="23" width="234" height="194" fill="none" stroke="#e0e8e3" strokeWidth="1" />

        {/* Entry door */}
        <line x1="130" y1="220" x2="170" y2="220" stroke="white" strokeWidth="7" />
        <path d="M 130 220 A 40 40 0 0 1 170 180" fill="none" stroke="var(--muted)" strokeWidth="2" strokeDasharray="3,3" />
        <line x1="170" y1="220" x2="170" y2="180" stroke="var(--muted)" strokeWidth="2" />
        <text x="135" y="208" fontSize="9" fill="var(--muted)" fontWeight="bold">ENTRY</text>

        {/* Left Bedroom Suite */}
        <line x1="110" y1="20" x2="110" y2="150" stroke="var(--forest)" strokeWidth="4" />
        <line x1="20" y1="150" x2="110" y2="150" stroke="var(--forest)" strokeWidth="4" />
        <text x="40" y="90" fontSize="10" fill="var(--muted)" fontWeight="bold">BEDROOM</text>
        
        {/* Queen Bed */}
        <g transform="translate(30, 30)">
          <rect x="0" y="0" width="60" height="70" fill="none" stroke="var(--line)" strokeWidth="2" rx="2" />
          <rect x="6" y="5" width="20" height="12" rx="1" fill="none" stroke="var(--line)" strokeWidth="1.5" />
          <rect x="34" y="5" width="20" height="12" rx="1" fill="none" stroke="var(--line)" strokeWidth="1.5" />
          <line x1="0" y1="25" x2="60" y2="25" stroke="var(--line)" strokeWidth="1.5" />
        </g>
        
        {/* Closet */}
        <rect x="25" y="125" width="65" height="20" fill="none" stroke="var(--line)" strokeWidth="1.5" />
        <text x="42" y="138" fontSize="8" fill="var(--line)" fontWeight="bold">CLOSET</text>

        {/* Bathroom (Bottom Right) */}
        <line x1="160" y1="140" x2="160" y2="220" stroke="var(--forest)" strokeWidth="4" />
        <line x1="160" y1="140" x2="260" y2="140" stroke="var(--forest)" strokeWidth="4" />
        <text x="195" y="180" fontSize="9" fill="var(--muted)" fontWeight="bold">BATH</text>
        
        {/* Tub */}
        <rect x="210" y="145" width="45" height="25" rx="3" fill="none" stroke="var(--line)" strokeWidth="2" />
        <ellipse cx="232" cy="157" rx="18" ry="8" fill="none" stroke="var(--line)" strokeWidth="1" />
        {/* Toilet */}
        <rect x="165" y="195" width="16" height="12" rx="2" fill="none" stroke="var(--line)" strokeWidth="1.5" />
        <ellipse cx="173" cy="183" rx="7" ry="9" fill="none" stroke="var(--line)" strokeWidth="1.5" />

        {/* Living Room / Kitchen Space (Top Right) */}
        <g transform="translate(130, 20)">
          {/* Kitchen Counter */}
          <rect x="0" y="0" width="110" height="30" fill="none" stroke="var(--line)" strokeWidth="2" />
          <text x="35" y="18" fontSize="9" fill="var(--muted)" fontWeight="bold">KITCHEN</text>
          <circle cx="15" cy="15" r="5" fill="none" stroke="var(--line)" strokeWidth="1.5" />
          <rect x="85" y="5" width="20" height="20" fill="none" stroke="var(--line)" strokeWidth="1.5" />
          
          {/* Kitchen Island */}
          <rect x="15" y="50" width="70" height="22" fill="none" stroke="var(--line)" strokeWidth="2" rx="2" />
          <text x="35" y="64" fontSize="8" fill="var(--line)" fontWeight="bold">ISLAND</text>

          {/* Sofa */}
          <rect x="35" y="90" width="70" height="22" fill="none" stroke="var(--line)" strokeWidth="2" rx="2" />
          <text x="50" y="104" fontSize="8" fill="var(--muted)">SOFA</text>
        </g>
      </>
    );
  } else if (isTwoBed) {
    title = "Two-Bed ADU 816";
    dimensions = "24' x 34'";
    svgContent = (
      <>
        {/* Exterior walls */}
        <rect x="20" y="20" width="240" height="280" fill="none" stroke="var(--forest)" strokeWidth="6" rx="4" />
        <rect x="23" y="23" width="234" height="274" fill="none" stroke="#e0e8e3" strokeWidth="1" />

        {/* Main Sliding Door */}
        <line x1="100" y1="300" x2="160" y2="300" stroke="white" strokeWidth="7" />
        <line x1="100" y1="297" x2="130" y2="297" stroke="var(--muted)" strokeWidth="2" />
        <line x1="128" y1="295" x2="158" y2="295" stroke="var(--muted)" strokeWidth="2" />

        {/* Master Bedroom (Top Left) */}
        <line x1="130" y1="20" x2="130" y2="120" stroke="var(--forest)" strokeWidth="4" />
        <line x1="20" y1="120" x2="130" y2="120" stroke="var(--forest)" strokeWidth="4" />
        <text x="40" y="75" fontSize="9" fill="var(--muted)" fontWeight="bold">MASTER BDRM</text>
        <g transform="translate(35, 30)">
          <rect x="0" y="0" width="55" height="60" fill="none" stroke="var(--line)" strokeWidth="2" rx="2" />
          <rect x="5" y="5" width="18" height="10" rx="1" fill="none" stroke="var(--line)" strokeWidth="1.5" />
          <rect x="32" y="5" width="18" height="10" rx="1" fill="none" stroke="var(--line)" strokeWidth="1.5" />
        </g>

        {/* Bedroom 2 (Bottom Left) */}
        <line x1="130" y1="180" x2="130" y2="300" stroke="var(--forest)" strokeWidth="4" />
        <line x1="20" y1="180" x2="130" y2="180" stroke="var(--forest)" strokeWidth="4" />
        <text x="45" y="235" fontSize="9" fill="var(--muted)" fontWeight="bold">BEDROOM 2</text>
        <g transform="translate(35, 200)">
          <rect x="0" y="0" width="55" height="60" fill="none" stroke="var(--line)" strokeWidth="2" rx="2" />
          <rect x="5" y="5" width="18" height="10" rx="1" fill="none" stroke="var(--line)" strokeWidth="1.5" />
          <rect x="32" y="5" width="18" height="10" rx="1" fill="none" stroke="var(--line)" strokeWidth="1.5" />
        </g>

        {/* Bathroom (Middle Corridor) */}
        <line x1="130" y1="120" x2="200" y2="120" stroke="var(--forest)" strokeWidth="4" />
        <line x1="200" y1="120" x2="200" y2="180" stroke="var(--forest)" strokeWidth="4" />
        <line x1="130" y1="180" x2="200" y2="180" stroke="var(--forest)" strokeWidth="4" />
        <text x="152" y="155" fontSize="9" fill="var(--muted)" fontWeight="bold">BATH</text>
        {/* Tub */}
        <rect x="140" y="125" width="50" height="20" rx="2" fill="none" stroke="var(--line)" strokeWidth="1.5" />
        
        {/* Living / Dining / Kitchen (Right Side) */}
        <g transform="translate(210, 30)">
          <rect x="0" y="0" width="45" height="240" fill="none" stroke="#f7f8f3" strokeWidth="1" />
          {/* Kitchen line */}
          <rect x="5" y="5" width="35" height="80" fill="none" stroke="var(--line)" strokeWidth="1.5" />
          <circle cx="22" cy="35" r="5" fill="none" stroke="var(--line)" strokeWidth="1.5" />
          <circle cx="22" cy="55" r="4" fill="none" stroke="var(--line)" strokeWidth="1.5" />
          <text x="-60" y="25" fontSize="8" fill="var(--muted)" transform="rotate(-90)" fontWeight="bold">KITCHEN</text>

          {/* Dining table */}
          <rect x="2" y="110" width="40" height="40" rx="3" fill="none" stroke="var(--line)" strokeWidth="1.5" />
          <text x="8" y="133" fontSize="8" fill="var(--line)" fontWeight="bold">DINING</text>
          
          {/* Sofa */}
          <rect x="5" y="180" width="35" height="50" rx="2" fill="none" stroke="var(--line)" strokeWidth="1.5" />
          <text x="10" y="210" fontSize="8" fill="var(--muted)">LIVING</text>
        </g>
      </>
    );
  } else {
    // Dynamic Scaled Placeholder
    title = "Modular Concept";
    dimensions = "Architectural Envelope";
    svgContent = (
      <>
        <rect x="20" y="20" width="240" height="180" fill="none" stroke="var(--forest)" strokeWidth="6" rx="4" />
        <rect x="23" y="23" width="234" height="174" fill="none" stroke="#e0e8e3" strokeWidth="1" />
        
        {/* Diagonal lines to represent structural shell draft */}
        <line x1="20" y1="20" x2="260" y2="200" stroke="var(--line)" strokeWidth="1" strokeDasharray="4,4" />
        <line x1="260" y1="20" x2="20" y2="200" stroke="var(--line)" strokeWidth="1" strokeDasharray="4,4" />
        
        <circle cx="140" cy="110" r="30" fill="white" stroke="var(--line)" strokeWidth="2" />
        <text x="115" y="114" fontSize="10" fill="var(--forest)" fontWeight="bold">CONCEPT</text>
      </>
    );
  }

  return (
    <div
      className="dataPanel"
      style={{
        marginBottom: 20,
        background: "white",
        border: "1px solid var(--line)",
        borderRadius: 8,
        padding: 16,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--forest)", margin: 0 }}>
          Layout Preview
        </h2>
        <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700 }}>{dimensions}</span>
      </div>

      <div
        style={{
          width: "100%",
          background: "var(--paper)",
          border: "1px dashed var(--line)",
          borderRadius: 6,
          padding: "20px 10px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
        }}
      >
        <svg
          viewBox="0 0 280 320"
          style={{
            width: "100%",
            maxWidth: 240,
            height: "auto",
            display: "block",
          }}
        >
          {/* Blueprint style grid lines */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <rect width="20" height="20" fill="none" />
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(36, 69, 55, 0.05)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {svgContent}
        </svg>

        {/* Blueprint Compass/Scale Label */}
        <div style={{ position: "absolute", bottom: 8, right: 12, fontSize: 10, color: "var(--muted)", fontWeight: 700 }}>
          N 🧭
        </div>
      </div>
      <p style={{ fontSize: 11, color: "var(--muted)", margin: "8px 0 0", textAlign: "center", lineHeight: 1.4 }}>
        <strong>{title}</strong> structural modular layout. Subject to local setback verification and site engineering.
      </p>
    </div>
  );
}
