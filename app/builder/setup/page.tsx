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

const CATEGORIES = [
  { key: "finish", label: "Finish level" },
  { key: "foundation", label: "Foundation" },
  { key: "utilities", label: "Utilities" },
  { key: "site", label: "Site condition" },
];

export default function BuilderSetup() {
  const [tab, setTab] = useState<"models" | "options" | "credentials">("models");
  const [models, setModels] = useState<Model[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [modelsRes, optionsRes] = await Promise.all([
          fetch("/api/models"),
          fetch("/api/options"),
        ]);
        const modelsData = await modelsRes.json();
        const optionsData = await optionsRes.json();
        setModels(modelsData.models ?? []);
        setOptions(optionsData.options ?? []);
      } catch {
        setError("Failed to load catalog data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function deleteModel(id: string) {
    if (!confirm("Delete this model?")) return;
    await fetch(`/api/models/${id}`, { method: "DELETE" });
    setModels((prev) => prev.filter((m) => m.id !== id));
  }

  async function deleteOption(id: string) {
    if (!confirm("Delete this option?")) return;
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
          className={tab === "credentials" ? "setupTab active" : "setupTab"}
          onClick={() => setTab("credentials")}
          type="button"
        >
          Credentials
        </button>
      </div>

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
    </main>
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
  onUpdate,
  onDelete,
}: {
  model: Model;
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
        <button className="button secondary" onClick={() => setEditing(true)} type="button">Edit</button>
        <button className="button danger" onClick={onDelete} type="button">Delete</button>
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
        <button className="button danger" onClick={onDelete} type="button">Delete</button>
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
