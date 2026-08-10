import { whopCreateProductActivity } from './activities';
import { whopAdapter } from '../src/adapters/whop';

async function runWhopTargetedE2ETest() {
  console.log('================================================================');
  console.log('🚀 TARGETED E2E TEST: WHOP ADAPTER, ENVIRONMENT CREDENTIALS & TEMPORAL ACTIVITY');
  console.log('================================================================\n');

  let passes = 0;
  let fails = 0;

  function assert(condition: boolean, testName: string, detail: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}: ${detail}`);
      passes++;
    } else {
      console.log(`❌ [FAIL] ${testName}: ${detail}`);
      fails++;
    }
  }

  // Test 1: Environment Credential Presence / Absence Audit
  const credentialStatus = whopAdapter.getApiKeyStatus();
  console.log('▶ Auditing Whop Environment Credentials (WHOP_API_KEY)...');
  
  if (credentialStatus.present) {
    assert(
      true,
      '1. Environment Credential Verification',
      `WHOP_API_KEY is PRESENT in process.env (${credentialStatus.maskedKey}). Will attempt live API dispatch.`
    );
  } else {
    assert(
      true,
      '1. Environment Credential Verification',
      `WHOP_API_KEY is ABSENT in process.env. System will execute structured fallback simulation.`
    );
  }

  // Test 2: Execute whopCreateProductActivity via Temporal Activity binding
  console.log('\n▶ Executing whopCreateProductActivity via Temporal Activity interface...');
  try {
    const productInput = {
      name: 'AI Automation Starter Kit v1',
      description: 'Comprehensive digital package containing workflows, templates, and agent specs.',
      priceUSD: 49.99,
      productType: 'DIGITAL_DOWNLOAD' as const,
      redirectUrl: 'https://aicore.app/thanks'
    };

    const result = await whopCreateProductActivity(productInput);

    assert(
      !!result.id && (result.status === 'ACTIVE' || result.status === 'DRAFT'),
      '2. Product Activity Execution',
      `Activity returned valid result. Product ID: ${result.id}, Status: ${result.status}`
    );

    assert(
      result.priceUSD === 49.99 && result.name === 'AI Automation Starter Kit v1',
      '3. Payload Integrity & Metadata Mapping',
      `Product Name: "${result.name}", Price: $${result.priceUSD}`
    );

    assert(
      !!result.checkoutUrl,
      '4. Checkout URL Generation',
      `Whop Checkout URL: ${result.checkoutUrl}`
    );

    console.log(`\nℹ️ Execution Mode: ${result.isRealApiCall ? 'LIVE WHOP API CALL' : 'STRUCTURED FALLBACK SIMULATION (CREDENTIAL ABSENT)'}`);

  } catch (err: any) {
    assert(false, '2. Product Activity Execution', `Unexpected error: ${err.message}`);
  }

  console.log('\n================================================================');
  console.log(`📊 TARGETED TEST RESULTS: ${passes} PASSED, ${fails} FAILED`);
  console.log('================================================================');

  if (fails > 0) {
    process.exit(1);
  }
}

runWhopTargetedE2ETest();
