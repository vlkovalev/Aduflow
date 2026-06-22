"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TopNav } from "../../components/TopNav";

type Model = {
  id: string;
  model_name: string;
  model_code: string;
  square_feet: number;
  base_price: number;
  is_active: boolean;
  sort_order: number;
};

type Option = {
  id: string;
  option_name: string;
  option_value: string;
  option_detail: string;
  option_category: string;
  option_price: number;
  is_active: boolean;
  sort_order: number;
};

type BuilderCredentials = {
  companyName?: string;
  email?: string;
  phone?: string;
  licenseNumber?: string;
  insuranceCarrier?: string;
  insuranceLimit?: number;
  insuranceExpiration?: string;
  bondProvider?: string;
  bondAmount?: number;
  warrantyInfo?: string;
  serviceRegion?: string;
};

type ImportKind = "models" | "options";

type ImportPreview = {
  kind: ImportKind;
  dryRun: boolean;
  imported: boolean;
  validRows?: number;
  previewRows?: Record<string, string | number | boolean | undefined>[];
  importedRows?: number;
  errors?: string[];
  error?: string;
};

const CATEGORIES = [
  { key: "finish", label: "Finish level" },
  { key: "foundation", label: "Foundation" },
  { key: "utilities", label: "Utilities" },
  { key: "site", label: "Site condition" },
];

const MODEL_TEMPLATE = [
  "model_name,model_code,square_feet,base_price,is_active,sort_order",
  "Backyard Studio 312,backyard-studio-312,312,72000,true,1",
  "Garden Suite 624,garden-suite-624,624,154000,true,2",
].join("\n");

const OPTION_TEMPLATE = [
  "option_category,option_name,option_value,option_detail,option_price,is_active,sort_order",
  "finish,Standard Finish,standard,Durable baseline finish package,0,true,1",
  "foundation,Screw Piles,screw-piles,Fast install foundation package,18000,true,1",
  "utilities,Full Utility Hookup,full-hookup,Water sewer and electrical tie-ins,32000,true,1",
  "site,Tight Urban Access,tight-urban-access,Small crew and compact equipment allowance,9500,true,1",
].join("\n");

export default function BuilderSetup() {
  const [tab, setTab] = useState<"models" | "options" | "import" | "credentials">("models");
  const [models, setModels] = useState<Model[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [credentials, setCredentials] = useState<BuilderCredentials | null>(null);
  const [isDbActive, setIsDbActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [builderId, setBuilderId] = useState("");
  const [isOnboarding, setIsOnboarding] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("onboarding") === "true") {
        setIsOnboarding(true);
      }
    }
  }, []);

  async function loadCatalogData() {
    setError("");
    try {
      const builderRes = await fetch("/api/builder");
      if (builderRes.status === 401) {
        window.location.href = "/builder/login";
        return;
      }

      const [modelsRes, optionsRes] = await Promise.all([
        fetch("/api/models"),
        fetch("/api/options"),
      ]);

      const modelsData = await modelsRes.json();
      const optionsData = await optionsRes.json();
      const builderData = await builderRes.json();

      setModels(modelsData.models ?? []);
      setOptions(optionsData.options ?? []);
      setCredentials(builderData.credentials ?? null);
      setIsDbActive(builderData.isDbActive !== false);
      setBuilderId(builderData.builderId ?? "");
    } catch {
      setError("Failed to load catalog data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCatalogData();
  }, []);

  async function deleteModel(id: string) {
    if (!confirm("Archive this model? It will be hidden from new configurator sessions but preserved for old proposals.")) return;
    await fetch(`/api/models/${id}`, { method: "DELETE" });
    setModels((prev) => prev.filter((m) => m.id !== id));
  }

  async function deleteOption(id: string) {
    if (!confirm("Archive this option? It will be hidden from new configurator sessions but preserved for old proposals.")) return;
    await fetch(`/api/options/${id}`, { method: "DELETE" });
    setOptions((prev) => prev.filter((o) => o.id !== id));
  }

  return (
    <main className="appShell">
      <TopNav />

      <section className="dashboardHeader">
        <div>
          <p className="eyebrow">Catalog setup</p>
          <h1>Manage your models and pricing options.</h1>
        </div>
        <Link className="button secondary" href="/builder">Back to dashboard</Link>
      </section>

      <div className="setupTabs">
        <button
          className={tab === "models" ? "setupTab active" : "setupTab"}
          onClick={() => setTab("models")}
          type="button"
        >
          Models
        </button>
        <button
          className={tab === "options" ? "setupTab active" : "setupTab"}
          onClick={() => setTab("options")}
          type="button"
        >
          Options
        </button>
        <button
          className={tab === "import" ? "setupTab active" : "setupTab"}
          onClick={() => setTab("import")}
          type="button"
        >
          Import
        </button>
        <button
          className={tab === "credentials" ? "setupTab active" : "setupTab"}
          onClick={() => setTab("credentials")}
          type="button"
        >
          Credentials
        </button>
      </div>

      {!loading && !isDbActive && (
        <div style={{
          background: "var(--paper)",
          borderLeft: "4px solid var(--gold)",
          padding: "12px 16px",
          borderRadius: 6,
          margin: "12px 0 20px",
          fontSize: 13,
          color: "var(--muted)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          lineHeight: 1.4
        }}>
          <span>Note</span>
          <span>
            <strong>Sandbox Mode Active:</strong> Supabase database environment variables are not configured. Changes to models, options, and credentials will reside in local temporary files and reset when the server restarts.
          </span>
        </div>
      )}

      {!loading && isOnboarding && (
        <div style={{
          background: "var(--paper)",
          borderLeft: "4px solid var(--forest)",
          padding: "12px 16px",
          borderRadius: 6,
          margin: "12px 0 20px",
          fontSize: 13,
          color: "var(--muted)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          lineHeight: 1.4
        }}>
          <span>👋</span>
          <span>
            <strong>Welcome to ADUflow!</strong> To get started, please add your active building models, pricing options, and credentials. Your dashboard will remain locked and redirect here until you have configured your catalog.
          </span>
        </div>
      )}

      {!loading && (
        <SetupChecklist
          models={models}
          options={options}
          credentials={credentials}
          isDbActive={isDbActive}
        />
      )}

      {loading && <p className="setupNotice">Loading catalog...</p>}
      {error && <p className="setupNotice error">{error}</p>}

      {!loading && tab === "models" && (
        <div className="setupSection">
          <div className="dataPanel">
            <div className="panelTitle">
              <h2>Your models</h2>
              <span>{models.length} model{models.length !== 1 ? "s" : ""}</span>
            </div>
            {models.length > 0 ? (
              <table className="setupTable">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Sq ft</th>
                    <th>Base price</th>
                    <th>Active</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((model) => (
                    <ModelRow
                      key={model.id}
                      model={model}
                      builderId={builderId}
                      onUpdate={(updated) =>
                        setModels((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
                      }
                      onDelete={() => deleteModel(model.id)}
                    />
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="setupEmpty">No models yet. Add your first one below.</p>
            )}
          </div>

          <div className="dataPanel">
            <div className="panelTitle">
              <h2>Add model</h2>
            </div>
            <AddModelForm
              onAdd={(model) => setModels((prev) => [...prev, model])}
            />
          </div>
        </div>
      )}

      {!loading && tab === "options" && (
        <div className="setupSection">
          {CATEGORIES.map(({ key, label }) => {
            const categoryOptions = options.filter((o) => o.option_category === key);
            return (
              <div className="dataPanel" key={key}>
                <div className="panelTitle">
                  <h2>{label}</h2>
                  <span>{categoryOptions.length} option{categoryOptions.length !== 1 ? "s" : ""}</span>
                </div>
                {categoryOptions.length > 0 ? (
                  <table className="setupTable">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Detail</th>
                        <th>Price</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryOptions.map((option) => (
                        <OptionRow
                          key={option.id}
                          option={option}
                          onUpdate={(updated) =>
                            setOptions((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
                          }
                          onDelete={() => deleteOption(option.id)}
                        />
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="setupEmpty">No options yet for this category.</p>
                )}
                <AddOptionForm
                  category={key}
                  onAdd={(option) => setOptions((prev) => [...prev, option])}
                />
              </div>
            );
          })}
        </div>
      )}

      {!loading && tab === "credentials" && (
        <div className="setupSection">
          <CredentialsForm />
        </div>
      )}

      {!loading && tab === "import" && (
        <div className="setupSection">
          <CatalogImportPanel onImported={loadCatalogData} />
        </div>
      )}
    </main>
  );
}

function CatalogImportPanel({ onImported }: { onImported: () => Promise<void> }) {
  const [kind, setKind] = useState<ImportKind>("models");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const template = kind === "models" ? MODEL_TEMPLATE : OPTION_TEMPLATE;
  const templateName = kind === "models" ? "aduflow-models-template.csv" : "aduflow-options-template.csv";
  const excelTemplateHref =
    kind === "models"
      ? "/templates/aduflow-models-template.xlsx"
      : "/templates/aduflow-options-template.xlsx";
  const canImport = Boolean(preview && !preview.errors?.length && preview.validRows && file);

  async function sendImport(dryRun: boolean) {
    if (!file) {
      setPreview({ kind, dryRun: true, imported: false, errors: ["Choose a CSV file before importing."] });
      return;
    }

    setBusy(true);
    setStatus("");

    try {
      const form = new FormData();
      form.append("kind", kind);
      form.append("dryRun", String(dryRun));
      form.append("file", file);

      const res = await fetch("/api/catalog/import", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as ImportPreview;
      setPreview(data);

      if (!res.ok || data.error) {
        setStatus(data.error ?? "Import failed.");
        return;
      }

      if (!dryRun && data.imported) {
        setStatus(`Imported ${data.importedRows ?? 0} ${kind}.`);
        setFile(null);
        await onImported();
      }
    } catch {
      setStatus("Import failed. Check the CSV format and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dataPanel">
      <div className="panelTitle">
        <div>
          <h2>Upload a catalog package</h2>
          <p>Import builder models or pricing options from an Excel or CSV file. Preview validates rows before anything is saved.</p>
        </div>
        <span>Spreadsheet import</span>
      </div>

      <div className="catalogImportGrid">
        <label>
          Package type
          <select
            className="setupInput"
            value={kind}
            onChange={(event) => {
              setKind(event.target.value as ImportKind);
              setPreview(null);
              setFile(null);
              setStatus("");
            }}
          >
            <option value="models">Models</option>
            <option value="options">Options</option>
          </select>
        </label>

        <label>
          Excel or CSV file
          <input
            className="setupInput"
            type="file"
            accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setPreview(null);
              setStatus("");
            }}
          />
        </label>

        <div className="catalogTemplateActions">
          <a
            className="button secondary catalogTemplateButton"
            href={excelTemplateHref}
            download
          >
            Download Excel
          </a>
          <a
            className="button secondary catalogTemplateButton"
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(template)}`}
            download={templateName}
          >
            Download CSV
          </a>
        </div>
      </div>

      <div className="catalogImportHelp">
        {kind === "models" ? (
          <p>Required columns: model_name, square_feet, base_price. Upload CSV or the first worksheet of an XLSX file.</p>
        ) : (
          <p>Required columns: option_category, option_name, option_price. XLSX imports read the first worksheet.</p>
        )}
      </div>

      <div className="catalogImportActions">
        <button className="button secondary" type="button" onClick={() => sendImport(true)} disabled={busy || !file}>
          {busy ? "Checking..." : "Preview import"}
        </button>
        <button className="button primary" type="button" onClick={() => sendImport(false)} disabled={busy || !canImport}>
          {busy ? "Importing..." : "Confirm import"}
        </button>
      </div>

      {status && <p className="setupNotice success catalogImportStatus">{status}</p>}

      {preview?.errors?.length ? (
        <div className="catalogImportErrors">
          <strong>Fix these rows before importing:</strong>
          {preview.errors.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      ) : null}

      {preview?.previewRows?.length ? (
        <div className="catalogPreviewTable">
          <div className="panelTitle compact">
            <h3>Preview</h3>
            <span>{preview.validRows} valid row{preview.validRows === 1 ? "" : "s"}</span>
          </div>
          <table className="setupTable">
            <thead>
              <tr>
                {Object.keys(preview.previewRows[0]).map((key) => (
                  <th key={key}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.previewRows.map((row, index) => (
                <tr key={`${kind}-${index}`}>
                  {Object.values(row).map((value, valueIndex) => (
                    <td key={`${kind}-${index}-${valueIndex}`}>{String(value ?? "")}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

function SetupChecklist({
  models,
  options,
  credentials,
  isDbActive,
}: {
  models: Model[];
  options: Option[];
  credentials: BuilderCredentials | null;
  isDbActive: boolean;
}) {
  const activeModels = models.filter((model) => model.is_active).length;
  const categoriesWithOptions = new Set(
    options.filter((option) => option.is_active).map((option) => option.option_category),
  );
  const credentialsComplete = Boolean(
    credentials?.companyName &&
      credentials?.email &&
      credentials?.phone &&
      credentials?.licenseNumber &&
      credentials?.insuranceCarrier &&
      credentials?.serviceRegion,
  );

  const items = [
    {
      title: "Database",
      complete: isDbActive,
      detail: isDbActive ? "Supabase credentials detected." : "Sandbox mode. Run schema and seed before real demos.",
    },
    {
      title: "Models",
      complete: activeModels > 0,
      detail: activeModels > 0 ? `${activeModels} active model${activeModels === 1 ? "" : "s"} ready.` : "Add at least one active ADU model.",
    },
    {
      title: "Options",
      complete: categoriesWithOptions.size >= 4,
      detail: `${categoriesWithOptions.size} of 4 option groups have active pricing.`,
    },
    {
      title: "Credentials",
      complete: credentialsComplete,
      detail: credentialsComplete ? "Builder profile can populate lender packages." : "Complete license, insurance, and service region.",
    },
  ];

  return (
    <section className="setupChecklist" aria-label="Builder setup checklist">
      {items.map((item) => (
        <div className={item.complete ? "setupChecklistItem complete" : "setupChecklistItem"} key={item.title}>
          <span>{item.complete ? "Complete" : "Needed"}</span>
          <strong>{item.title}</strong>
          <p>{item.detail}</p>
        </div>
      ))}
    </section>
  );
}

function CredentialsForm() {
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [insuranceCarrier, setInsuranceCarrier] = useState("");
  const [insuranceLimit, setInsuranceLimit] = useState("");
  const [insuranceExpiration, setInsuranceExpiration] = useState("");
  const [bondProvider, setBondProvider] = useState("");
  const [bondAmount, setBondAmount] = useState("");
  const [warrantyInfo, setWarrantyInfo] = useState("");
  const [serviceRegion, setServiceRegion] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expiryWarning, setExpiryWarning] = useState("");

  useEffect(() => {
    if (insuranceExpiration) {
      const expDate = new Date(insuranceExpiration);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expDate < today) {
        setExpiryWarning("Warning: The insurance policy expiration date is in the past.");
      } else {
        setExpiryWarning("");
      }
    } else {
      setExpiryWarning("");
    }
  }, [insuranceExpiration]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch("/api/builder");
        const data = await res.json();
        if (!active) return;
        if (data.credentials) {
          const c = data.credentials;
          setCompanyName(c.companyName ?? "");
          setEmail(c.email ?? "");
          setPhone(c.phone ?? "");
          setLicenseNumber(c.licenseNumber ?? "");
          setInsuranceCarrier(c.insuranceCarrier ?? "");
          setInsuranceLimit(String(c.insuranceLimit ?? ""));
          setInsuranceExpiration(c.insuranceExpiration ?? "");
          setBondProvider(c.bondProvider ?? "");
          setBondAmount(String(c.bondAmount ?? ""));
          setWarrantyInfo(c.warrantyInfo ?? "");
          setServiceRegion(c.serviceRegion ?? "");
        }
      } catch {
        if (active) setError("Failed to load builder credentials.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (insuranceExpiration) {
      const expDate = new Date(insuranceExpiration);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (Number.isNaN(expDate.getTime()) || expDate < today) {
        setError("Insurance expiration date must be a valid future date.");
        return;
      }
    }

    setSaving(true);

    try {
      const res = await fetch("/api/builder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          email,
          phone,
          licenseNumber,
          insuranceCarrier,
          insuranceLimit: Number(insuranceLimit) || 0,
          insuranceExpiration,
          bondProvider,
          bondAmount: Number(bondAmount) || 0,
          warrantyInfo,
          serviceRegion,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save credentials");
      }

      setSuccess("Credentials saved successfully.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="setupNotice">Loading credentials...</p>;
  }

  return (
    <div className="dataPanel">
      <div className="panelTitle">
        <h2>Builder credentials</h2>
        <span>Drive lender package metadata</span>
      </div>
      <form className="setupForm" onSubmit={submit} style={{ maxWidth: 600 }}>
        <label>
          Company legal name
          <input className="setupInput" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Apex Modular Builders Ltd." required />
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <label>
            Public email
            <input className="setupInput" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@company.com" required />
          </label>
          <label>
            Public phone
            <input className="setupInput" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 555-0199" required />
          </label>
        </div>
        <label>
          General contractor license number
          <input className="setupInput" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="GC-12345-BC" required />
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <label>
            Liability insurance carrier
            <input className="setupInput" value={insuranceCarrier} onChange={(e) => setInsuranceCarrier(e.target.value)} placeholder="Pacific Insurance" required />
          </label>
          <label>
            Liability limit (CAD)
            <input className="setupInput" type="number" value={insuranceLimit} onChange={(e) => setInsuranceLimit(e.target.value)} placeholder="2000000" required />
          </label>
        </div>
        <label>
          Insurance expiration date
          <input className="setupInput" type="date" value={insuranceExpiration} onChange={(e) => setInsuranceExpiration(e.target.value)} required />
          {expiryWarning && (
            <span style={{ color: "#b75f38", fontSize: "12px", marginTop: "4px", display: "block", fontWeight: 600 }}>
              {expiryWarning}
            </span>
          )}
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <label>
            Surety bond provider
            <input className="setupInput" value={bondProvider} onChange={(e) => setBondProvider(e.target.value)} placeholder="Assurance Corp" required />
          </label>
          <label>
            Surety bond amount (CAD)
            <input className="setupInput" type="number" value={bondAmount} onChange={(e) => setBondAmount(e.target.value)} placeholder="100000" required />
          </label>
        </div>
        <label>
          Home warranty program info
          <input className="setupInput" value={warrantyInfo} onChange={(e) => setWarrantyInfo(e.target.value)} placeholder="e.g. 2-5-10 Year Residential Protection" required />
        </label>
        <label>
          Service regions
          <textarea className="setupInput" style={{ minHeight: 60 }} value={serviceRegion} onChange={(e) => setServiceRegion(e.target.value)} placeholder="Metro Vancouver, Southern BC" required />
        </label>

        {error && <p className="setupNotice error">{error}</p>}
        {success && <p className="setupNotice success" style={{ color: "#3a8a5a", marginTop: 8 }}>{success}</p>}

        <button className="button primary" type="submit" disabled={saving} style={{ marginTop: 16 }}>
          {saving ? "Saving..." : "Save credentials"}
        </button>
      </form>
    </div>
  );
}

function ModelRow({
  model,
  builderId,
  onUpdate,
  onDelete,
}: {
  model: Model;
  builderId: string;
  onUpdate: (m: Model) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(model.model_name);
  const [sqft, setSqft] = useState(String(model.square_feet));
  const [price, setPrice] = useState(String(model.base_price));
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/models/${model.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelName: name, squareFeet: sqft, basePrice: price }),
    });
    const data = await res.json();
    if (data.model) onUpdate(data.model);
    setSaving(false);
    setEditing(false);
  }

  if (editing) {
    return (
      <tr>
        <td><input className="setupInput" value={name} onChange={(e) => setName(e.target.value)} /></td>
        <td><input className="setupInput narrow" value={sqft} onChange={(e) => setSqft(e.target.value)} /></td>
        <td><input className="setupInput narrow" value={price} onChange={(e) => setPrice(e.target.value)} /></td>
        <td>{model.is_active ? "Yes" : "No"}</td>
        <td className="setupActions">
          <button className="button primary" onClick={save} disabled={saving} type="button">
            {saving ? "Saving..." : "Save"}
          </button>
          <button className="button secondary" onClick={() => setEditing(false)} type="button">Cancel</button>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td><strong>{model.model_name}</strong></td>
      <td>{model.square_feet} sq ft</td>
      <td>${Number(model.base_price).toLocaleString()}</td>
      <td>{model.is_active ? "Yes" : "No"}</td>
      <td className="setupActions">
        {/* audit critical-process-audit.md §4/§14 — this link previously omitted
            builderId and silently loaded the default catalog instead of this
            builder's own. It now requires builderId and is disabled until it's
            loaded, rather than linking to the wrong catalog. */}
        {builderId ? (
          <Link
            className="button secondary"
            href={`/configurator?model=${model.model_code}&builderId=${builderId}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 28,
              padding: "0 10px",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            Preview
          </Link>
        ) : (
          <button
            className="button secondary"
            type="button"
            disabled
            style={{ minHeight: 28, padding: "0 10px", fontSize: 11, fontWeight: 700 }}
          >
            Preview
          </button>
        )}
        <button className="button secondary" onClick={() => setEditing(true)} type="button">Edit</button>
        <button className="button danger" onClick={onDelete} type="button">Archive</button>
      </td>
    </tr>
  );
}

function AddModelForm({ onAdd }: { onAdd: (m: Model) => void }) {
  const [name, setName] = useState("");
  const [sqft, setSqft] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelName: name, squareFeet: sqft, basePrice: price }),
    });
    const data = await res.json();
    if (data.model) {
      onAdd(data.model);
      setName("");
      setSqft("");
      setPrice("");
    } else {
      setError(data.error ?? "Failed to add model");
    }
    setSaving(false);
  }

  return (
    <form className="setupForm" onSubmit={submit}>
      <label>
        Model name
        <input className="setupInput" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Garden Suite 624" required />
      </label>
      <label>
        Square feet
        <input className="setupInput narrow" value={sqft} onChange={(e) => setSqft(e.target.value)} placeholder="624" type="number" min="1" required />
      </label>
      <label>
        Base price (CAD)
        <input className="setupInput narrow" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="154000" type="number" min="0" required />
      </label>
      {error && <p className="setupNotice error">{error}</p>}
      <button className="button primary" type="submit" disabled={saving}>
        {saving ? "Adding..." : "Add model"}
      </button>
    </form>
  );
}

function OptionRow({
  option,
  onUpdate,
  onDelete,
}: {
  option: Option;
  onUpdate: (o: Option) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(option.option_name);
  const [detail, setDetail] = useState(option.option_detail);
  const [price, setPrice] = useState(String(option.option_price));
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/options/${option.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionName: name, detail, price }),
    });
    const data = await res.json();
    if (data.option) onUpdate(data.option);
    setSaving(false);
    setEditing(false);
  }

  if (editing) {
    return (
      <tr>
        <td><input className="setupInput" value={name} onChange={(e) => setName(e.target.value)} /></td>
        <td><input className="setupInput" value={detail} onChange={(e) => setDetail(e.target.value)} /></td>
        <td><input className="setupInput narrow" value={price} onChange={(e) => setPrice(e.target.value)} /></td>
        <td className="setupActions">
          <button className="button primary" onClick={save} disabled={saving} type="button">
            {saving ? "Saving..." : "Save"}
          </button>
          <button className="button secondary" onClick={() => setEditing(false)} type="button">Cancel</button>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td><strong>{option.option_name}</strong></td>
      <td>{option.option_detail}</td>
      <td>${Number(option.option_price).toLocaleString()}</td>
      <td className="setupActions">
        <button className="button secondary" onClick={() => setEditing(true)} type="button">Edit</button>
        <button className="button danger" onClick={onDelete} type="button">Archive</button>
      </td>
    </tr>
  );
}

function AddOptionForm({
  category,
  onAdd,
}: {
  category: string;
  onAdd: (o: Option) => void;
}) {
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionName: name, detail, price, category }),
    });
    const data = await res.json();
    if (data.option) {
      onAdd(data.option);
      setName("");
      setDetail("");
      setPrice("");
    } else {
      setError(data.error ?? "Failed to add option");
    }
    setSaving(false);
  }

  return (
    <form className="setupForm inline" onSubmit={submit}>
      <input className="setupInput" value={name} onChange={(e) => setName(e.target.value)} placeholder="Option name" required />
      <input className="setupInput" value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Short description" />
      <input className="setupInput narrow" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price" type="number" min="0" required />
      {error && <p className="setupNotice error">{error}</p>}
      <button className="button primary" type="submit" disabled={saving}>
        {saving ? "Adding..." : "Add"}
      </button>
    </form>
  );
}
