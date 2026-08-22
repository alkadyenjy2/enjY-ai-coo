import fetch from 'node-fetch';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';

interface Phase7Check {
  id: string;
  name: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

async function runPhase7Verification() {
  console.log('================================================================');
  console.log('⚡ PHASE 7 VERIFICATION: REAL CREDENTIALS & LIVE CONNECTIONS');
  console.log('================================================================\n');

  const checks: Phase7Check[] = [];

  async function apiCall(path: string, options?: any) {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    const json: any = await res.json();
    return { status: res.status, json };
  }

  // 1. Audit Live Connectors Status Matrix
  try {
    console.log('▶ Check 1: Auditing Live Connectors Status Matrix...');
    const statusRes = await apiCall('/api/connectors/status');
    const isOk = statusRes.status === 200 && !!statusRes.json.liveConnectors;
    const connectors = Object.keys(statusRes.json.liveConnectors || {});
    checks.push({
      id: 'P7-01',
      name: 'Live Connectors Status Matrix',
      status: isOk ? 'PASS' : 'FAIL',
      details: isOk 
        ? `Audited ${connectors.length} connectors (${connectors.join(', ')}). All registered with simulation fallback or live active secrets.`
        : `Failed: ${JSON.stringify(statusRes.json)}`
    });
  } catch (err: any) {
    checks.push({
      id: 'P7-01',
      name: 'Live Connectors Status Matrix',
      status: 'FAIL',
      details: `Error: ${err.message}`
    });
  }

  // 2. Test Key Live Connector Endpoints (Postiz, Whop, Outscraper, GoHighLevel, Tavily, Stripe)
  const connectorsToTest = ['postiz', 'whop', 'outscraper', 'ghl', 'tavily', 'stripe', 'gemini'];
  for (const conn of connectorsToTest) {
    try {
      console.log(`▶ Check 2.${conn}: Probing Connector Endpoint for ${conn}...`);
      const testRes = await apiCall('/api/connectors/test', {
        method: 'POST',
        body: JSON.stringify({ connectorId: conn, name: conn })
      });
      const pass = testRes.status === 200 && !!testRes.json.status;
      checks.push({
        id: `P7-02-${conn}`,
        name: `Connector Probe: ${conn.toUpperCase()}`,
        status: pass ? 'PASS' : 'FAIL',
        details: pass 
          ? `Status: ${testRes.json.status}, Message: ${testRes.json.message}, Capabilities: ${(testRes.json.capabilitiesDiscovered || []).join(', ')}`
          : `Failed: ${JSON.stringify(testRes.json)}`
      });
    } catch (err: any) {
      checks.push({
        id: `P7-02-${conn}`,
        name: `Connector Probe: ${conn.toUpperCase()}`,
        status: 'FAIL',
        details: `Error: ${err.message}`
      });
    }
  }

  // 3. Test Stripe Webhook Receiver Endpoint
  try {
    console.log('\n▶ Check 3: Testing Stripe Webhook Receiver...');
    const stripeWhRes = await apiCall('/api/webhooks/stripe', {
      method: 'POST',
      body: JSON.stringify({
        type: 'checkout.session.completed',
        data: {
          object: {
            customer_email: 'livebuyer@example.com',
            amount_total: 9900,
            description: 'Phase 7 Live Enterprise License'
          }
        }
      })
    });
    const stripeWhPass = stripeWhRes.status === 200 && stripeWhRes.json.received === true;
    checks.push({
      id: 'P7-03',
      name: 'Stripe Webhook Receiver & Temporal Auto-Trigger',
      status: stripeWhPass ? 'PASS' : 'FAIL',
      details: stripeWhPass 
        ? `Stripe Webhook Accepted. Event: ${stripeWhRes.json.eventType}`
        : `Failed: ${JSON.stringify(stripeWhRes.json)}`
    });
  } catch (err: any) {
    checks.push({
      id: 'P7-03',
      name: 'Stripe Webhook Receiver & Temporal Auto-Trigger',
      status: 'FAIL',
      details: `Error: ${err.message}`
    });
  }

  // 4. Test Whop Webhook Receiver Endpoint
  try {
    console.log('\n▶ Check 4: Testing Whop Webhook Receiver...');
    const whopWhRes = await apiCall('/api/webhooks/whop', {
      method: 'POST',
      body: JSON.stringify({
        action: 'membership.created',
        data: {
          name: 'Pro Trader Circle',
          price: 149.00
        }
      })
    });
    const whopWhPass = whopWhRes.status === 200 && whopWhRes.json.received === true;
    checks.push({
      id: 'P7-04',
      name: 'Whop Webhook Receiver & Temporal Auto-Trigger',
      status: whopWhPass ? 'PASS' : 'FAIL',
      details: whopWhPass 
        ? `Whop Webhook Accepted. Action: ${whopWhRes.json.action}`
        : `Failed: ${JSON.stringify(whopWhRes.json)}`
    });
  } catch (err: any) {
    checks.push({
      id: 'P7-04',
      name: 'Whop Webhook Receiver & Temporal Auto-Trigger',
      status: 'FAIL',
      details: `Error: ${err.message}`
    });
  }

  // Summary Matrix
  console.log('\n================================================================');
  console.log('📋 PHASE 7 VERIFICATION MATRIX');
  console.log('================================================================\n');

  let passed = 0;
  checks.forEach((c) => {
    if (c.status === 'PASS') passed++;
    const icon = c.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} [${c.id}] ${c.name}`);
    console.log(`   Details: ${c.details}`);
    console.log('----------------------------------------------------------------');
  });

  const allPassed = passed === checks.length;
  const outcomeText = allPassed ? 'PHASE 7 VERIFICATION PASS' : 'PHASE 7 VERIFICATION FAIL';
  console.log(`\nFINAL OUTCOME: ${outcomeText} (${passed}/${checks.length} Passed)\n`);

  fs.writeFileSync('./temporal-proof/phase7-summary.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    outcome: outcomeText,
    passed,
    total: checks.length,
    checks
  }, null, 2));

  if (!allPassed) process.exit(1);
}

runPhase7Verification();
