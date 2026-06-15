import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getLead } from "../../../lib/leadStore";
import { createPermitPackage } from "../../../lib/permitStore";
import { TopNav } from "../../components/TopNav";

const defaultBuilderId = "00000000-0000-0000-0000-000000000001";

export default async function PermitPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;
  const lead = await getLead(leadId);

  if (!lead) {
    notFound();
  }

  const cookieStore = await cookies();
  const builderId = cookieStore.get("builder_id")?.value;
  if (!builderId) {
    redirect("/builder/login");
  }

  if ((lead.builderId || defaultBuilderId) !== builderId) {
    notFound();
  }

  const permitPackage = await createPermitPackage(lead.id);
  const groupedTasks = groupByCategory(permitPackage.tasks);

  return (
    <main className="appShell">
      <TopNav />

      <section className="proposalHero">
        <p className="eyebrow">Permit and HOA assistant</p>
        <h1>{lead.modelName}</h1>
        <p>
          Draft permit package for {lead.propertyAddress}. This checklist turns
          the proposal into city, HOA, lender, and builder action items.
        </p>
      </section>

      <section className="permitSummary">
        <Stat label="Package status" value={permitPackage.packageStatus} />
        <Stat label="Permit path" value={permitPackage.permitPath} />
        <Stat label="HOA required" value={permitPackage.hoaRequired ? "Likely" : "No"} />
        <Stat label="Revision round" value={String(permitPackage.revisionRound)} />
      </section>

      <section className="permitGrid">
        <div className="permitTasks">
          {Object.entries(groupedTasks).map(([category, tasks]) => (
            <article className="dataPanel" key={category}>
              <div className="panelTitle">
                <h2>{category}</h2>
                <span>{tasks.length} tasks</span>
              </div>
              <div className="taskList">
                {tasks.map((task) => (
                  <div key={task.taskName}>
                    <strong>{task.taskName}</strong>
                    <span>
                      {task.ownerRole} - {task.dueStage}
                    </span>
                    <p>{task.notes}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>

        <aside className="estimatePanel">
          <div className="panelTitle">
            <h2>Required documents</h2>
            <span>{permitPackage.documents.length} items</span>
          </div>
          <div className="documentList">
            {permitPackage.documents.map((doc) => (
              <div key={doc.documentName}>
                <strong>{doc.documentName}</strong>
                <span>
                  {doc.requiredFor} - {doc.ownerRole}
                </span>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}

function groupByCategory<T extends { category: string }>(items: T[]) {
  return items.reduce<Record<string, T[]>>((groups, item) => {
    groups[item.category] = groups[item.category] ?? [];
    groups[item.category].push(item);
    return groups;
  }, {});
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
