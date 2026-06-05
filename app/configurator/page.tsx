'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  calculateProjectPrice,
  defaultCatalog,
  parcelScenarios,
  type PricingCatalog,
} from "../../lib/pricingEngine";

type ZoningResult = {
  address?: string;
  zone: string;
  zoneDescription: string;
  maxSquareFeet: number | null;
  maxStories: number | null;
  setbackFront: string | null;
  setbackSide: string | null;
  setbackRear: string | null;
  aduPermitted: boolean | null;
  reviewRisk: "Low" | "Medium" | "High";
  permitPath: string;
  source?: string;
  rawData?: Record<string, unknown>;
};

export default function Configurator() {
  const [catalog, setCatalog] = useState<PricingCatalog>(defaultCatalog);
  const [catalogStatus, setCatalogStatus] = useState("Default catalog");
  const [parcelType, setParcelType] = useState(parcelScenarios[0].value);
  const [modelCode, setModelCode] = useState(defaultCatalog.models[1].code);
  const [finish, setFinish] = useState("comfort");
  const [foundation, setFoundation] = useState("helical");
  const [utilities, setUtilities] = useState("standard");
  const [site, setSite] = useState("urban");
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [proposalUrl, setProposalUrl] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [addressInput, setAddressInput] = useState("");
  const [zoningResult, setZoningResult] = useState<ZoningResult | null>(null);
  const [zoningStatus, setZoningStatus] = useState<"idle" | "loading" | "found" | "not_found">("idle");

  async function lookupAddress() {
    if (!addressInput.trim()) return;
    setZoningStatus("loading");
    setZoningResult(null);
    try {
      const res = await fetch(`/api/zoning?address=${encodeURIComponent(addressInput.trim())}`);
      const data = await res.json();
      if (data.result) {
        setZoningResult(data.result as ZoningResult);
        setZoningStatus("found");
        // Auto-select best matching parcel scenario
        const risk = (data.result as ZoningResult).reviewRisk;
        if (risk === "High") setParcelType("tight-servicing");
        else if (risk === "Medium") setParcelType("corner-hoa");
        else setParcelType("urban-lane");
      } else {
        setZoningStatus("not_found");
      }
    } catch {
      setZoningStatus("not_found");
    }
  }

  useEffect(() => {
    let active = true;

    async function loadCatalog() {
      try {
        const response = await fetch("/api/catalog");
        const result = await response.json();
        const nextCatalog = result.catalog as PricingCatalog;

        if (!active || !nextCatalog?.models?.length) {
          return;
        }

        setCatalog(nextCatalog);
        setCatalogStatus("Builder catalog");
        setModelCode((current) => safeCurrent(current, nextCatalog.models.map((model) => model.code)));
        setFinish((current) => safeCurrent(current, nextCatalog.optionGroups.finish.map((option) => option.value)));
        setFoundation((current) => safeCurrent(current, nextCatalog.optionGroups.foundation.map((option) => option.value)));
        setUtilities((current) => safeCurrent(current, nextCatalog.optionGroups.utilities.map((option) => option.value)));
        setSite((current) => safeCurrent(current, nextCatalog.optionGroups.site.map((option) => option.value)));
      } catch {
        setCatalogStatus("Default catalog");
      }
    }

    loadCatalog();

    return () => {
      active = false;
    };
  }, []);

  const estimate = calculateProjectPrice({
    parcelType,
    modelCode,
    finish,
    foundation,
    utilities,
    site,
    zoningResult,
  }, catalog);

  return (
    <main className="appShell">
      <TopNav />
      <section className="pageIntro">
        <p className="eyebrow">Zoning and feasibility first</p>
        <h1>Check the lot before configuring the building.</h1>
        <p>
          North American ADU sales start with parcel reality: setbacks, HOA
          constraints, service runs, design review, and lender documentation.
          This MVP turns those constraints into a builder-ready package.
        </p>
        <span className="sourceBadge">{catalogStatus}</span>
      </section>

      {/* ── Address lookup ── */}
      <section className="addressLookup">
        <div className="addressLookupInner">
          <label className="addressLabel">
            Property address
            <span className="addressHint">Enter the address to auto-populate zoning data</span>
          </label>
          <div className="addressRow">
            <input
              className="addressInput"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && lookupAddress()}
              placeholder="42 Maple Street, Vancouver, BC or 1234 Oak Ave, Portland OR"
            />
            <button
              className="button primary"
              type="button"
              onClick={lookupAddress}
              disabled={zoningStatus === "loading" || !addressInput.trim()}
            >
              {zoningStatus === "loading" ? "Looking up..." : "Check zoning"}
            </button>
          </div>
          {zoningStatus === "found" && zoningResult && (
            <div className="zoningResult">
              <div className="zoningBadge">
                <span>{zoningResult.zone}</span>
                <strong>{zoningResult.zoneDescription}</strong>
              </div>
              <div className="zoningDetails">
                {zoningResult.maxSquareFeet && <span>Max ADU: {zoningResult.maxSquareFeet} sq ft</span>}
                {zoningResult.maxStories && <span>{zoningResult.maxStories} storey max</span>}
                {zoningResult.setbackRear && <span>Rear setback: {zoningResult.setbackRear}</span>}
                {zoningResult.setbackSide && <span>Side setback: {zoningResult.setbackSide}</span>}
                <span className={`zoningRisk risk-${zoningResult.reviewRisk.toLowerCase()}`}>
                  {zoningResult.reviewRisk} review risk
                </span>
                <span>{zoningResult.permitPath}</span>
              </div>
              <p className="zoningNote">Parcel scenario auto-selected below. Adjust if needed.</p>
            </div>
          )}
          {zoningStatus === "not_found" && (
            <p className="zoningNote muted">No zoning data found for this address. Select a parcel scenario manually below.</p>
          )}
        </div>
      </section>

      <section className="configGrid">
        <div className="configPanel">
          <ChoiceGroup
            title="Parcel scenario"
            value={parcelType}
            options={parcelScenarios.map((scenario) => ({
              value: scenario.value,
              label: scenario.label,
              detail: scenario.detail,
            }))}
            onChange={setParcelType}
          />
          <ChoiceGroup
            title="Building model"
            value={modelCode}
            options={catalog.models.map((model) => ({
              value: model.code,
              label: model.name,
              detail: `${model.squareFeet} sq ft - ${formatCurrency(model.basePrice)}`,
            }))}
            onChange={setModelCode}
          />
          <ChoiceGroup
            title="Finish level"
            value={finish}
            options={catalog.optionGroups.finish}
            onChange={setFinish}
          />
          <ChoiceGroup
            title="Foundation"
            value={foundation}
            options={catalog.optionGroups.foundation}
            onChange={setFoundation}
          />
          <ChoiceGroup
            title="Utilities"
            value={utilities}
            options={catalog.optionGroups.utilities}
            onChange={setUtilities}
          />
          <ChoiceGroup
            title="Site condition"
            value={site}
            options={catalog.optionGroups.site}
            onChange={setSite}
          />
        </div>

        <aside className="estimatePanel">
          <div className="feasibilityCard">
            <span>{estimate.feasibility.result}</span>
            <strong>{estimate.feasibility.confidence}% confidence</strong>
            <p>{estimate.feasibility.note}</p>
          </div>

          <div className="estimateHeader">
            <span>Estimated package</span>
            <strong>{formatCurrency(estimate.total)}</strong>
          </div>
          <div className="estimateRange">
            <span>{formatCurrency(estimate.low)}</span>
            <span>{formatCurrency(estimate.high)}</span>
          </div>
          <div className="bar">
            <span style={{ width: "72%" }} />
          </div>

          <dl className="summaryList">
            <div>
              <dt>Selected model</dt>
              <dd>{estimate.model.name}</dd>
            </div>
            <div>
              <dt>Estimated timeline</dt>
              <dd>{estimate.timelineWeeks} weeks</dd>
            </div>
            <div>
              <dt>Permit path</dt>
              <dd>{estimate.permitPath}</dd>
            </div>
            <div>
              <dt>Allowed envelope</dt>
              <dd>
                {estimate.feasibility.maxSquareFeet} sq ft / {estimate.feasibility.maxStories} story
              </dd>
            </div>
            <div>
              <dt>Setback target</dt>
              <dd>{estimate.feasibility.setback}</dd>
            </div>
            <div>
              <dt>BOM groups</dt>
              <dd>{estimate.bom.length} categories</dd>
            </div>
          </dl>

          <div className="costSplit">
            <h2>Prefab cost split</h2>
            <div>
              <span>Factory cost</span>
              <strong>{formatCurrency(estimate.factoryCost)}</strong>
            </div>
            <div>
              <span>Site cost</span>
              <strong>{formatCurrency(estimate.siteCost)}</strong>
            </div>
          </div>

          <div className="drawPlan">
            <h2>Lender draw plan</h2>
            {estimate.drawMilestones.map((milestone) => (
              <div key={milestone.stage}>
                <span>{milestone.percent}%</span>
                <p>{milestone.stage}</p>
              </div>
            ))}
          </div>

          <div className="checklist">
            <h2>Next package outputs</h2>
            {estimate.checklist.map((item) => (
              <div key={item}>
                <span />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="proposalSection">
        <div className="proposalCopy">
          <p className="eyebrow">Builder-ready intake</p>
          <h2>Package the concept for review.</h2>
          <p>
            The next conversion step is a clean intake package: homeowner
            contact, property address, feasibility snapshot, estimate range,
            permit risk, and milestone draw plan.
          </p>
        </div>

        <form
          className="proposalForm"
          onSubmit={async (event) => {
            event.preventDefault();
            setSubmitError("");
            setLeadSubmitted(false);

            const formData = new FormData(event.currentTarget);
            const response = await fetch("/api/leads", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                customerName: formData.get("name"),
                email: formData.get("email"),
                phone: formData.get("phone"),
                propertyAddress: formData.get("address") || addressInput,
                parcelScenario: parcelType,
                zoningSource: zoningResult?.source ?? "manual",
                zoningZone: zoningResult?.zone ?? "",
                zoningDescription: zoningResult?.zoneDescription ?? "",
                zoningRaw: zoningResult?.rawData ?? zoningResult ?? null,
                zoningLookupStatus: zoningResult ? "found" : "manual",
                zoningCheckedAt: zoningResult ? new Date().toISOString() : "",
                aduPermitted: zoningResult?.aduPermitted ?? null,
                setbackFront: zoningResult?.setbackFront ?? "",
                setbackSide: zoningResult?.setbackSide ?? "",
                setbackRear: zoningResult?.setbackRear ?? "",
                feasibilityResult: estimate.feasibility.result,
                feasibilityConfidence: estimate.feasibility.confidence,
                permitPath: estimate.permitPath,
                estimatedPrice: estimate.total,
                estimateLow: estimate.low,
                estimateHigh: estimate.high,
                factoryCost: estimate.factoryCost,
                siteCost: estimate.siteCost,
                modelCode: estimate.model.code,
                modelName: estimate.model.name,
                squareFeet: estimate.model.squareFeet,
                timelineWeeks: estimate.timelineWeeks,
                maxSquareFeet: estimate.feasibility.maxSquareFeet,
                maxStories: estimate.feasibility.maxStories,
                setbackTarget: estimate.feasibility.setback,
                reviewRisk: estimate.feasibility.reviewRisk,
                configuration: {
                  modelCode,
                  modelName: estimate.model.name,
                  finish,
                  foundation,
                  utilities,
                  site,
                  parcelType,
                  drawMilestones: estimate.drawMilestones,
                },
              }),
            });
            const result = await response.json();

            if (!response.ok) {
              setSubmitError(result.error ?? "Unable to create proposal");
              return;
            }

            setProposalUrl(result.proposalUrl);
            setLeadSubmitted(true);
          }}
        >
          <label>
            Name
            <input name="name" placeholder="Homeowner name" required />
          </label>
          <label>
            Email
            <input name="email" placeholder="name@example.com" required type="email" />
          </label>
          <label>
            Phone
            <input name="phone" placeholder="(555) 555-0123" />
          </label>
          <label>
            Property address
            <input
              name="address"
              placeholder="Street, city, province/state"
              required
              value={addressInput}
              onChange={(event) => setAddressInput(event.target.value)}
            />
          </label>

          <div className="proposalSummary">
            <div>
              <span>Model</span>
              <strong>{estimate.model.name}</strong>
            </div>
            <div>
              <span>Budget range</span>
              <strong>
                {formatCurrency(estimate.low)} - {formatCurrency(estimate.high)}
              </strong>
            </div>
            <div>
              <span>Feasibility</span>
              <strong>{estimate.feasibility.result}</strong>
            </div>
          </div>

          <button className="button primary" type="submit">
            Request builder review
          </button>

          {leadSubmitted ? (
            <p className="formNotice">
              Intake saved.{" "}
              <Link href={proposalUrl}>Open the proposal package</Link>.
            </p>
          ) : null}
          {submitError ? <p className="formNotice error">{submitError}</p> : null}
        </form>
      </section>
    </main>
  );
}

type Choice = {
  value: string;
  label: string;
  detail: string;
};

function TopNav() {
  return (
    <nav className="nav compact" aria-label="Main navigation">
      <Link className="brand" href="/">
        ADUflow
      </Link>
      <div className="navLinks">
        <Link href="/configurator">Configurator</Link>
        <Link href="/builder">Builder OS</Link>
      </div>
    </nav>
  );
}

function ChoiceGroup({
  title,
  value,
  options,
  onChange,
}: {
  title: string;
  value: string;
  options: Choice[];
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="choiceGroup">
      <legend>{title}</legend>
      <div className="choiceGrid">
        {options.map((option) => (
          <label className={value === option.value ? "choice active" : "choice"} key={option.value}>
            <input
              type="radio"
              name={title}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <strong>{option.label}</strong>
            <span>{option.detail}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(value);
}

function safeCurrent(current: string, values: string[]) {
  return values.includes(current) ? current : values[0] ?? current;
}
