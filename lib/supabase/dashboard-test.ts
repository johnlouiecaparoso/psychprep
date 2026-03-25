import { DashboardService } from './dashboard-service';

// Test function to verify dashboard queries
export async function testDashboardQueries() {
  console.log('Testing dashboard queries...');
  
  const dashboardService = new DashboardService();
  const testUserId = 'test-user-id'; // Replace with actual user ID for testing
  
  try {
    // Test 1: Get student stats
    console.log('Testing getStudentStats...');
    const stats = await dashboardService.getStudentStats(testUserId);
    console.log('Student stats:', stats);
    
    // Test 2: Get performance data
    console.log('Testing getPerformanceData...');
    const performanceData = await dashboardService.getPerformanceData(testUserId);
    console.log('Performance data:', performanceData);
    
    // Test 3: Get weak topics
    console.log('Testing getWeakTopics...');
    const weakTopics = await dashboardService.getWeakTopics(testUserId);
    console.log('Weak topics:', weakTopics);
    
    // Test 4: Get recent exams
    console.log('Testing getRecentExams...');
    const recentExams = await dashboardService.getRecentExams(testUserId);
    console.log('Recent exams:', recentExams);
    
    // Test 5: Get readiness score
    console.log('Testing getReadinessScore...');
    const readinessScore = await dashboardService.getReadinessScore(testUserId);
    console.log('Readiness score:', readinessScore);
    
    console.log('All dashboard queries completed successfully!');
    return {
      success: true,
      stats,
      performanceData,
      weakTopics,
      recentExams,
      readinessScore
    };
    
  } catch (error) {
    console.error('Dashboard query test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Run tests if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
  testDashboardQueries();
}
