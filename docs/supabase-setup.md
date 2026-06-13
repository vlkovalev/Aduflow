# Supabase Setup and Verification

Use this before any builder demo that needs durable leads, builder catalog data, credentials, project milestones, or draw logs.

## 1. Configure Environment Variables

Create or update `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Vercel may require lowercase environment variable names. ADUflow supports both uppercase and lowercase formats:

```bash
next_public_supabase_url=your-project-url
next_public_supabase_anon_key=your-publishable-or-anon-key
supabase_service_role_key=your-secret-service-key
next_public_site_url=https://your-vercel-domain
```

Do not commit `.env.local`.

## 2. Run Database SQL

In the Supabase dashboard SQL editor:

1. Open `database/schema.sql`.
2. Run the full schema.
3. Open `database/seed.sql`.
4. Run the seed data.

The schema creates the builder catalog, lead, permit, project milestone, and draw milestone tables used by the app.

## 3. Verify App Behavior

Run these checks locally:

1. Open `/builder/setup`.
2. Confirm the setup checklist shows database detected.
3. Add or edit one model.
4. Add or edit one option in each category.
5. Save builder credentials.
6. Open `/configurator`.
7. Enter an address and create a lead.
8. Open the generated proposal.
9. Open the lender package.
10. Mark the lead as won in `/builder`.
11. Open the project tracker and update one milestone and one draw.
12. Refresh the page and confirm the milestone/draw changes remain.

## 4. If Tables Are Missing

If the app shows a Supabase error such as "table not found," rerun `database/schema.sql`, then rerun `database/seed.sql`.

If a schema change was added after your first setup, compare your Supabase tables against `database/schema.sql` and add the missing columns/tables.

## 5. Security Note

Rotate any service role key that was pasted into chat or shared outside your private environment before collecting real homeowner or builder data.
