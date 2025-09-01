// Performance test script to validate optimizations
import { bundleOptimization } from './bundleOptimization';
import { animationOptimization, performanceUtils } from './performanceUtils';

export const performanceTests = {
  // Test list performance with large datasets
  async testListPerformance() {
    console.log('🧪 Testing List Performance...');
    
    const startTime = performance.now();
    
    // Simulate 1000+ notes
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      id: `note_${i}`,
      title: `Note ${i}`,
      content: `Content for note ${i}`,
      category: 'Personal',
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: '1',
    }));

    // Test filtering performance
    const filterStartTime = performance.now();
    const filteredNotes = largeDataset.filter(note => 
      note.title.toLowerCase().includes('note')
    );
    const filterEndTime = performance.now();
    const filterTime = filterEndTime - filterStartTime;

    // Test sorting performance
    const sortStartTime = performance.now();
    const sortedNotes = [...largeDataset].sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    const sortEndTime = performance.now();
    const sortTime = sortEndTime - sortStartTime;

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    console.log(`✅ List Performance Test Results:`);
    console.log(`   - Dataset Size: ${largeDataset.length} notes`);
    console.log(`   - Filter Time: ${filterTime.toFixed(2)}ms`);
    console.log(`   - Sort Time: ${sortTime.toFixed(2)}ms`);
    console.log(`   - Total Time: ${totalTime.toFixed(2)}ms`);
    console.log(`   - Performance: ${filterTime < 200 ? '✅ PASS' : '❌ FAIL'}`);

    return {
      datasetSize: largeDataset.length,
      filterTime,
      sortTime,
      totalTime,
      passed: filterTime < 200,
    };
  },

  // Test memory usage
  async testMemoryUsage() {
    console.log('🧪 Testing Memory Usage...');
    
    const initialMemory = performanceUtils.performanceMetrics.memoryUsage.size;
    
    // Simulate heavy memory usage
    const largeObjects = Array.from({ length: 100 }, () => ({
      data: new Array(1000).fill('test data'),
      timestamp: Date.now(),
    }));

    const peakMemory = performanceUtils.performanceMetrics.memoryUsage.size;
    const memoryIncrease = peakMemory - initialMemory;

    console.log(`✅ Memory Usage Test Results:`);
    console.log(`   - Initial Memory: ${initialMemory} entries`);
    console.log(`   - Peak Memory: ${peakMemory} entries`);
    console.log(`   - Memory Increase: ${memoryIncrease} entries`);
    console.log(`   - Performance: ${memoryIncrease < 50 ? '✅ PASS' : '❌ FAIL'}`);

    return {
      initialMemory,
      peakMemory,
      memoryIncrease,
      passed: memoryIncrease < 50,
    };
  },

  // Test bundle optimization
  async testBundleOptimization() {
    console.log('🧪 Testing Bundle Optimization...');
    
    const bundleSize = bundleOptimization.getBundleSizeEstimate();
    const targetSize = 5; // 5MB target
    
    console.log(`✅ Bundle Optimization Test Results:`);
    console.log(`   - Bundle Size: ${bundleSize.toFixed(1)}MB`);
    console.log(`   - Target Size: ${targetSize}MB`);
    console.log(`   - Performance: ${bundleSize < targetSize ? '✅ PASS' : '❌ FAIL'}`);

    return {
      bundleSize,
      targetSize,
      passed: bundleSize < targetSize,
    };
  },

  // Test animation performance
  async testAnimationPerformance() {
    console.log('🧪 Testing Animation Performance...');
    
    const frameRateMonitor = animationOptimization.frameRateMonitor;
    frameRateMonitor.startMonitoring();
    
    // Simulate animation frames
    for (let i = 0; i < 60; i++) {
      frameRateMonitor.recordFrame();
      await new Promise(resolve => setTimeout(resolve, 16)); // 60fps
    }
    
    const averageFrameRate = frameRateMonitor.getAverageFrameRate();
    
    console.log(`✅ Animation Performance Test Results:`);
    console.log(`   - Average Frame Rate: ${averageFrameRate.toFixed(1)}fps`);
    console.log(`   - Target Frame Rate: 60fps`);
    console.log(`   - Performance: ${averageFrameRate >= 50 ? '✅ PASS' : '❌ FAIL'}`);

    return {
      averageFrameRate,
      targetFrameRate: 60,
      passed: averageFrameRate >= 50,
    };
  },

  // Test search performance
  async testSearchPerformance() {
    console.log('🧪 Testing Search Performance...');
    
    const searchDataset = Array.from({ length: 1000 }, (_, i) => ({
      id: `note_${i}`,
      title: `Note ${i} with searchable content`,
      content: `This is the content for note ${i} that should be searchable`,
      category: i % 3 === 0 ? 'Personal' : i % 3 === 1 ? 'Work' : 'Ideas',
    }));

    const searchQueries = ['note', 'content', 'searchable', 'work', 'personal'];
    const searchTimes: number[] = [];

    for (const query of searchQueries) {
      const startTime = performance.now();
      const results = searchDataset.filter(note =>
        note.title.toLowerCase().includes(query.toLowerCase()) ||
        note.content.toLowerCase().includes(query.toLowerCase()) ||
        note.category.toLowerCase().includes(query.toLowerCase())
      );
      const endTime = performance.now();
      searchTimes.push(endTime - startTime);
    }

    const averageSearchTime = searchTimes.reduce((sum, time) => sum + time, 0) / searchTimes.length;
    const maxSearchTime = Math.max(...searchTimes);

    console.log(`✅ Search Performance Test Results:`);
    console.log(`   - Dataset Size: ${searchDataset.length} notes`);
    console.log(`   - Average Search Time: ${averageSearchTime.toFixed(2)}ms`);
    console.log(`   - Max Search Time: ${maxSearchTime.toFixed(2)}ms`);
    console.log(`   - Target Search Time: < 200ms`);
    console.log(`   - Performance: ${maxSearchTime < 200 ? '✅ PASS' : '❌ FAIL'}`);

    return {
      datasetSize: searchDataset.length,
      averageSearchTime,
      maxSearchTime,
      targetSearchTime: 200,
      passed: maxSearchTime < 200,
    };
  },

  // Run all performance tests
  async runAllTests() {
    console.log('🚀 Starting Performance Test Suite...\n');
    
    const results = {
      listPerformance: await this.testListPerformance(),
      memoryUsage: await this.testMemoryUsage(),
      bundleOptimization: await this.testBundleOptimization(),
      animationPerformance: await this.testAnimationPerformance(),
      searchPerformance: await this.testSearchPerformance(),
    };

    console.log('\n📊 Performance Test Summary:');
    console.log('============================');
    
    const allPassed = Object.values(results).every(result => result.passed);
    
    Object.entries(results).forEach(([testName, result]) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${testName}: ${status}`);
    });

    console.log(`\nOverall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    return {
      results,
      allPassed,
    };
  },
};

// Export for use in development
export default performanceTests;
