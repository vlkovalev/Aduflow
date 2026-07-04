const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function main() {
  const envLocalPath = path.join(__dirname, '..', '.env.local');
  let envSecretKey = '';
  if (fs.existsSync(envLocalPath)) {
    const envContent = fs.readFileSync(envLocalPath, 'utf8');
    const match = envContent.match(/^STRIPE_SECRET_KEY=(.*)$/m);
    if (match && match[1]) {
      envSecretKey = match[1].trim();
    }
  }

  const secretKey = process.argv[2] || envSecretKey || process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error('Error: Please provide your Stripe Secret Key.');
    console.error('Usage: node scripts/setup-stripe.js [STRIPE_SECRET_KEY]');
    console.error('Alternatively, set STRIPE_SECRET_KEY in your .env.local file.');
    process.exit(1);
  }

  console.log('Initializing Stripe...');
  const Stripe = require('stripe');
  const stripe = new Stripe(secretKey);

  try {
    // 1. Create the billing meter
    console.log('Creating billing meter "Qualified Proposals"...');
    let meter;
    try {
      meter = await stripe.billing.meters.create({
        display_name: 'Qualified Proposals',
        event_name: 'qualified_proposal',
        customer_mapping: {
          event_payload_key: 'stripe_customer_id',
          type: 'by_id',
        },
        default_aggregation: {
          formula: 'sum',
        },
      });
      console.log(`Meter created: ${meter.id}`);
    } catch (e) {
      if (e.message && e.message.includes('already exists')) {
        // Meter might already exist, let's list to find it
        console.log('Meter already exists. Listing meters to locate it...');
        const meters = await stripe.billing.meters.list();
        meter = meters.data.find(m => m.event_name === 'qualified_proposal');
        if (!meter) {
          throw new Error('Meter with event_name "qualified_proposal" already exists but could not be located.');
        }
        console.log(`Found existing meter: ${meter.id}`);
      } else {
        throw e;
      }
    }

    // 2. Create ADUflow Starter Product
    console.log('Creating product "ADUflow Starter"...');
    const starterProduct = await stripe.products.create({
      name: 'ADUflow Starter',
      description: 'ADUflow Starter plan — flat base plus metered qualified proposal usage',
    });
    console.log(`Product created: ${starterProduct.id}`);

    // 3. Create ADUflow Starter Base Price ($149.00/mo)
    console.log('Creating base price $149/mo for Starter...');
    const starterBasePrice = await stripe.prices.create({
      product: starterProduct.id,
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      unit_amount: 14900, // $149.00 in cents
    });
    console.log(`Base price created: ${starterBasePrice.id}`);

    // 4. Create ADUflow Starter Metered Graduated Price
    console.log('Creating metered price ($0 for first 5, then $35/ea) for Starter...');
    const starterMeteredPrice = await stripe.prices.create({
      product: starterProduct.id,
      currency: 'usd',
      recurring: {
        interval: 'month',
        usage_type: 'metered',
        meter: meter.id,
      },
      billing_scheme: 'tiered',
      tiers_mode: 'graduated',
      tiers: [
        { up_to: 5, unit_amount: 0 },
        { up_to: 'inf', unit_amount: 3500 }, // $35.00 in cents
      ],
    });
    console.log(`Metered price created: ${starterMeteredPrice.id}`);

    // 5. Create ADUflow Growth Product
    console.log('Creating product "ADUflow Growth"...');
    const growthProduct = await stripe.products.create({
      name: 'ADUflow Growth',
      description: 'ADUflow Growth plan — flat base plus metered qualified proposal usage',
    });
    console.log(`Product created: ${growthProduct.id}`);

    // 6. Create ADUflow Growth Base Price ($249.00/mo)
    console.log('Creating base price $249/mo for Growth...');
    const growthBasePrice = await stripe.prices.create({
      product: growthProduct.id,
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      unit_amount: 24900, // $249.00 in cents
    });
    console.log(`Base price created: ${growthBasePrice.id}`);

    // 7. Create ADUflow Growth Metered Graduated Price
    console.log('Creating metered price ($0 for first 10, then $30/ea) for Growth...');
    const growthMeteredPrice = await stripe.prices.create({
      product: growthProduct.id,
      currency: 'usd',
      recurring: {
        interval: 'month',
        usage_type: 'metered',
        meter: meter.id,
      },
      billing_scheme: 'tiered',
      tiers_mode: 'graduated',
      tiers: [
        { up_to: 10, unit_amount: 0 },
        { up_to: 'inf', unit_amount: 3000 }, // $30.00 in cents
      ],
    });
    console.log(`Metered price created: ${growthMeteredPrice.id}`);

    // 8. Generate env file entries
    console.log('\nStripe resources created successfully!');
    const envLines = [
      '',
      '# ── Stripe Setup ──────────────────────────────────────────',
      `STRIPE_SECRET_KEY=${secretKey}`,
      `STRIPE_PRICE_STARTER_BASE=${starterBasePrice.id}`,
      `STRIPE_PRICE_STARTER_METERED=${starterMeteredPrice.id}`,
      `STRIPE_PRICE_GROWTH_BASE=${growthBasePrice.id}`,
      `STRIPE_PRICE_GROWTH_METERED=${growthMeteredPrice.id}`,
    ];

    // Read existing .env.local and append
    const envLocalPath = path.join(__dirname, '..', '.env.local');
    let envContent = '';
    if (fs.existsSync(envLocalPath)) {
      envContent = fs.readFileSync(envLocalPath, 'utf8');
    }

    // Clean existing stripe vars if they exist
    const filteredLines = envContent.split('\n').filter(line => {
      const trimmed = line.trim();
      return !(
        trimmed.startsWith('STRIPE_SECRET_KEY=') ||
        trimmed.startsWith('STRIPE_PRICE_STARTER_BASE=') ||
        trimmed.startsWith('STRIPE_PRICE_STARTER_METERED=') ||
        trimmed.startsWith('STRIPE_PRICE_GROWTH_BASE=') ||
        trimmed.startsWith('STRIPE_PRICE_GROWTH_METERED=')
      );
    });

    // Check if APP_SECRET is set, if not, generate one
    const hasAppSecret = filteredLines.some(line => line.trim().startsWith('APP_SECRET='));
    if (!hasAppSecret) {
      const appSecret = crypto.randomBytes(32).toString('hex');
      filteredLines.push(`APP_SECRET=${appSecret}`);
      console.log(`Generated a secure APP_SECRET.`);
    }

    fs.writeFileSync(envLocalPath, [...filteredLines, ...envLines, ''].join('\n').trim() + '\n');
    console.log(`Updated ${envLocalPath} with new price keys and secrets.`);

    console.log('\nNext Steps:');
    console.log('1. Set your public production domain in .env.local:');
    console.log('   NEXT_PUBLIC_SITE_URL=https://yourdomain.com');
    console.log('2. Create your webhook endpoint in Stripe:');
    console.log('   Endpoint URL: https://yourdomain.com/api/webhooks/stripe');
    console.log('   Events: customer.subscription.created, customer.subscription.updated, customer.subscription.deleted');
    console.log('3. Reveal the Webhook Signing Secret and add to .env.local:');
    console.log('   STRIPE_WEBHOOK_SECRET=whsec_...');
    console.log('4. Restart your Next.js server to apply variables.');
  } catch (err) {
    console.error('Setup failed:', err);
    process.exit(1);
  }
}

main();
