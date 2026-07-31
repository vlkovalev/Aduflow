import Link from "next/link";
import { redirect } from "next/navigation";
import { getBuilderPublicProfile } from "../../../lib/builderStore";
import { TopNav } from "../../components/TopNav";

/**
 * Branded builder intake link — e.g. aduflow.ca/for-builder/<builderId>.
 * Gives outreach a cleaner, builder-specific URL than the raw
 * /configurator?builderId=... query string (docs/builder-activation-plan.md
 * #3). Looks up the builder purely to show a clear message on a dead/typo'd
 * link instead of a blank configurator with lead submission silently
 * disabled; on success it hands off to the configurator, which now shows
 * "Configuring for {companyName}" once builderId is present.
 */
export default async function ForBuilderPage({
  params,
}: {
  params: Promise<{ builderId: string }>;
}) {
  const { builderId } = await params;
  const profile = await getBuilderPublicProfile(builderId.trim());

  if (!profile) {
    return (
      <main className="appShell">
        <TopNav />
        <section className="pageIntro">
          <p className="eyebrow">Builder link not found</p>
          <h1>This pilot link isn&rsquo;t active.</h1>
          <p>
            The builder link you followed doesn&rsquo;t match an active ADUflow account. If a builder shared this
            with you, ask them to confirm the link. Otherwise you can browse the general overview below.
          </p>
          <Link className="button primary" href="/for-builders">
            See the builder pilot
          </Link>
        </section>
      </main>
    );
  }

  redirect(`/configurator?builderId=${encodeURIComponent(profile.id)}`);
}
