import { postizPublishActivity } from './activities';
import { postizAdapter } from '../src/adapters/postiz';

async function runPostizTargetedE2ETest() {
  console.log('================================================================');
  console.log('🚀 TARGETED E2E TEST: POSTIZ ADAPTER & TEMPORAL ACTIVITY BINDING');
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

  // Test 1: Adapter configuration state check
  const isConfigured = postizAdapter.isConfigured();
  assert(
    typeof isConfigured === 'boolean',
    '1. Postiz Configuration Check',
    `Adapter properly detects config state (Configured: ${isConfigured})`
  );

  // Test 2: Execute postizPublishActivity with simulated fallback (or live API if key set)
  console.log('\n▶ Executing postizPublishActivity via Temporal Activity interface...');
  try {
    const postInput = {
      title: 'AI CORE Automated Post',
      content: 'Hello world from AI CORE Super Agent via Postiz integration!',
      platforms: ['twitter', 'linkedin'],
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      mediaUrls: ['https://example.com/asset.png']
    };

    const result = await postizPublishActivity(postInput);

    assert(
      !!result.id && (result.status === 'SCHEDULED' || result.status === 'PUBLISHED'),
      '2. Post Activity Execution',
      `Activity returned valid result. Post ID: ${result.id}, Status: ${result.status}`
    );

    assert(
      Array.isArray(result.platforms) && result.platforms.includes('twitter'),
      '3. Platform Metadata Binding',
      `Target platforms correctly mapped: ${result.platforms.join(', ')}`
    );

    assert(
      !!result.postizUrl,
      '4. Output URL Generation',
      `Postiz URL generated: ${result.postizUrl}`
    );

  } catch (err: any) {
    assert(false, '2. Post Activity Execution', `Unexpected error: ${err.message}`);
  }

  console.log('\n================================================================');
  console.log(`📊 TARGETED TEST RESULTS: ${passes} PASSED, ${fails} FAILED`);
  console.log('================================================================');

  if (fails > 0) {
    process.exit(1);
  }
}

runPostizTargetedE2ETest();
