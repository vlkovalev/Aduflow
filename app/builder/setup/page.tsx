"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
  const [tab, setTab] = useState<"models" | "options">("models");
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
      <nav className="nav compact" aria-label="Main navigation">
        <Link className="brand" href="/">ADUflow</Link>
        <div className="navLinks">
          <Link href="/configurator">Configurator</Link>
          <Link href="/builder">Builder OS</Link>
        </div>
      </nav>

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
    </main>
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
