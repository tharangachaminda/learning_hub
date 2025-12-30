/**
 * Integration Test Script for Achievement System
 * Tests the complete flow: POST activity → unlock achievements → GET updated achievements
 * 
 * Usage: npx ts-node scripts/test-achievement-integration.ts
 */

const BASE_URL = 'http://localhost:3000/api/progress';
const STUDENT_ID = 'integration-test-student';

interface Achievement {
  id: string;
  name: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
}

interface AchievementResponse {
  studentId: string;
  achievements: Achievement[];
  totalPoints: number;
  recentlyUnlocked: Achievement[];
}

/**
 * Fetches student achievements from the API
 */
async function getAchievements(): Promise<AchievementResponse> {
  const response = await fetch(`${BASE_URL}/achievements/${STUDENT_ID}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch achievements: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Posts a practice activity to trigger achievement checks
 */
async function postActivity(topic: string, correct: number, total: number): Promise<void> {
  // Post individual question attempts to match the actual API
  for (let i = 0; i < total; i++) {
    const isCorrect = i < correct; // First 'correct' questions are correct
    const response = await fetch(`${BASE_URL}/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: STUDENT_ID,
        questionId: `q-${Date.now()}-${i}`,
        topic,
        difficulty: 'medium',
        isCorrect,
        timeSpentSeconds: 30,
        sessionId: `session-${Date.now()}`,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to post activity: ${response.statusText}`);
    }
  }
}

/**
 * Main integration test flow
 */
async function runIntegrationTest() {
  console.log('🧪 Achievement System Integration Test\n');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Get initial state
    console.log('\n📊 Step 1: Fetching initial achievements...');
    const initial = await getAchievements();
    console.log(`   ✓ Retrieved ${initial.achievements.length} achievements`);
    console.log(`   ✓ Total points: ${initial.totalPoints}`);
    console.log(`   ✓ Unlocked: ${initial.achievements.filter(a => a.unlocked).length}`);
    
    // Step 2: Simulate practice session to unlock "First Steps" (10 correct answers)
    console.log('\n🎯 Step 2: Simulating practice session (10 Addition questions)...');
    await postActivity('Addition', 10, 10);
    const afterFirstPractice = await getAchievements();
    console.log(`   ✓ Activity posted successfully`);
    console.log(`   ✓ Total points: ${afterFirstPractice.totalPoints}`);
    const firstUnlocked = afterFirstPractice.achievements.filter(a => a.unlocked);
    console.log(`   ✓ Total unlocked: ${firstUnlocked.length} achievement(s)`);
    
    if (afterFirstPractice.recentlyUnlocked.length > 0) {
      console.log('\n🎉 Achievement Unlocked:');
      afterFirstPractice.recentlyUnlocked.forEach(a => {
        console.log(`   🏆 ${a.name}`);
      });
    }
    
    // Step 3: More practice to unlock "Math Star" (25 correct answers)
    console.log('\n🎯 Step 3: Continuing practice (15 more Multiplication questions)...');
    await postActivity('Multiplication', 15, 15);
    const afterSecondPractice = await getAchievements();
    console.log(`   ✓ Activity posted successfully`);
    console.log(`   ✓ Total points: ${afterSecondPractice.totalPoints}`);
    const secondUnlocked = afterSecondPractice.achievements.filter(a => a.unlocked && !firstUnlocked.find(fa => fa.id === a.id));
    console.log(`   ✓ Newly unlocked: ${secondUnlocked.length} achievement(s)`);
    
    if (afterSecondPractice.recentlyUnlocked.length > 0) {
      console.log('\n🎉 Achievement Unlocked:');
      afterSecondPractice.recentlyUnlocked.forEach(a => {
        console.log(`   🏆 ${a.name}`);
      });
    }
    
    // Step 4: Work towards topic mastery (Addition Master requires 20+ with 80%+ accuracy)
    console.log('\n🎯 Step 4: Working towards Addition Master (20 questions, 90% accuracy)...');
    await postActivity('Addition', 18, 20);
    const afterTopicPractice = await getAchievements();
    console.log(`   ✓ Activity posted successfully`);
    console.log(`   ✓ Total points: ${afterTopicPractice.totalPoints}`);
    const thirdUnlocked = afterTopicPractice.achievements.filter(a => a.unlocked && !afterSecondPractice.achievements.find(sa => sa.id === a.id && sa.unlocked));
    console.log(`   ✓ Newly unlocked: ${thirdUnlocked.length} achievement(s)`);
    
    if (afterTopicPractice.recentlyUnlocked.length > 0) {
      console.log('\n🎉 Achievement Unlocked:');
      afterTopicPractice.recentlyUnlocked.forEach(a => {
        console.log(`   🏆 ${a.name}`);
      });
    }
    
    // Step 5: Final state summary
    console.log('\n📊 Step 5: Final Achievement Summary');
    const final = await getAchievements();
    const unlocked = final.achievements.filter(a => a.unlocked);
    const locked = final.achievements.filter(a => !a.unlocked);
    
    console.log(`\n   Total Achievements: ${final.achievements.length}`);
    console.log(`   Unlocked: ${unlocked.length}`);
    console.log(`   Locked: ${locked.length}`);
    console.log(`   Total Points: ${final.totalPoints}`);
    
    console.log('\n   🏆 Unlocked Achievements:');
    unlocked.forEach(a => {
      console.log(`      ✓ ${a.name} (${a.id})`);
    });
    
    console.log('\n   🔒 Locked Achievements:');
    locked.forEach(a => {
      const progress = a.progress > 0 ? ` [${a.progress}% progress]` : '';
      console.log(`      ○ ${a.name} (${a.id})${progress}`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Integration test completed successfully!\n');
    
    return true;
  } catch (error) {
    console.error('\n❌ Integration test failed:', error);
    return false;
  }
}

// Run the test
runIntegrationTest()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
