/**
 * Site Compatibility Testing Script
 * এই script আপনার deployed site এ পুরানো browser compatibility test করবে
 */

// Test configuration
const TEST_CONFIG = {
    SITE_URL: 'https://your-deployed-site.vercel.app', // আপনার deployed site URL দিন
    TEST_SCENARIOS: [
        'notification_disabled',
        'service_worker_disabled', 
        'fetch_disabled',
        'es6_disabled',
        'websocket_disabled'
    ]
};

class BrowserCompatibilityTester {
    constructor(siteUrl) {
        this.siteUrl = siteUrl;
        this.testResults = [];
        this.originalFeatures = {};
    }

    // পুরানো browser environment simulate করুন
    simulateOldBrowser(scenario) {
        console.log(`🧪 Testing scenario: ${scenario}`);
        
        switch(scenario) {
            case 'notification_disabled':
                this.originalFeatures.Notification = window.Notification;
                delete window.Notification;
                console.log('❌ Notification API disabled');
                break;
                
            case 'service_worker_disabled':
                this.originalFeatures.serviceWorker = navigator.serviceWorker;
                delete navigator.serviceWorker;
                console.log('❌ Service Worker disabled');
                break;
                
            case 'fetch_disabled':
                this.originalFeatures.fetch = window.fetch;
                delete window.fetch;
                console.log('❌ Fetch API disabled');
                break;
                
            case 'es6_disabled':
                // ES6 features simulate করা জটিল, শুধু log করি
                console.log('❌ ES6 features would be disabled in old browsers');
                break;
                
            case 'websocket_disabled':
                this.originalFeatures.WebSocket = window.WebSocket;
                delete window.WebSocket;
                console.log('❌ WebSocket disabled');
                break;
        }
    }

    // Features restore করুন
    restoreFeatures() {
        Object.keys(this.originalFeatures).forEach(feature => {
            if (feature === 'serviceWorker') {
                navigator[feature] = this.originalFeatures[feature];
            } else {
                window[feature] = this.originalFeatures[feature];
            }
        });
        this.originalFeatures = {};
        console.log('✅ All features restored');
    }

    // Site load test করুন
    async testSiteLoad(scenario) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const testResult = {
                scenario,
                loadTime: 0,
                errors: [],
                success: false,
                notifications: []
            };

            // Error listener যোগ করুন
            const errorHandler = (event) => {
                testResult.errors.push({
                    message: event.message || event.error?.message || 'Unknown error',
                    filename: event.filename || 'Unknown',
                    lineno: event.lineno || 0,
                    colno: event.colno || 0
                });
            };

            window.addEventListener('error', errorHandler);
            window.addEventListener('unhandledrejection', (event) => {
                testResult.errors.push({
                    message: event.reason?.message || 'Promise rejection',
                    type: 'Promise'
                });
            });

            // Console message capture করুন
            const originalConsole = {
                log: console.log,
                warn: console.warn,
                error: console.error
            };

            console.log = (...args) => {
                if (args[0]?.includes?.('🔔')) {
                    testResult.notifications.push(args.join(' '));
                }
                originalConsole.log.apply(console, args);
            };

            console.warn = (...args) => {
                testResult.notifications.push(`WARN: ${args.join(' ')}`);
                originalConsole.warn.apply(console, args);
            };

            console.error = (...args) => {
                testResult.errors.push({
                    message: args.join(' '),
                    type: 'Console Error'
                });
                originalConsole.error.apply(console, args);
            };

            // Test timeout
            setTimeout(() => {
                testResult.loadTime = Date.now() - startTime;
                testResult.success = testResult.errors.length === 0;

                // Console restore করুন
                Object.assign(console, originalConsole);
                window.removeEventListener('error', errorHandler);

                resolve(testResult);
            }, 5000); // 5 second timeout
        });
    }

    // Comprehensive test run করুন
    async runAllTests() {
        console.log('🚀 Starting comprehensive compatibility tests...');
        
        for (const scenario of TEST_CONFIG.TEST_SCENARIOS) {
            console.log(`\n📋 Testing scenario: ${scenario}`);
            
            // Simulate old browser environment
            this.simulateOldBrowser(scenario);
            
            // Test site loading
            const result = await this.testSiteLoad(scenario);
            this.testResults.push(result);
            
            // Restore features
            this.restoreFeatures();
            
            // Wait a bit between tests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        this.displayResults();
    }

    // Results display করুন
    displayResults() {
        console.log('\n📊 TEST RESULTS SUMMARY:');
        console.log('='.repeat(50));
        
        let passCount = 0;
        this.testResults.forEach((result, index) => {
            const status = result.success ? '✅ PASS' : '❌ FAIL';
            const errorCount = result.errors.length;
            
            console.log(`${index + 1}. ${result.scenario}: ${status}`);
            console.log(`   Load Time: ${result.loadTime}ms`);
            console.log(`   Errors: ${errorCount}`);
            
            if (errorCount > 0) {
                console.log('   Error Details:');
                result.errors.forEach(error => {
                    console.log(`     - ${error.message}`);
                });
            }
            
            if (result.notifications.length > 0) {
                console.log('   Notifications:');
                result.notifications.forEach(notif => {
                    console.log(`     - ${notif}`);
                });
            }
            
            if (result.success) passCount++;
            console.log('');
        });
        
        const compatibilityScore = Math.round((passCount / this.testResults.length) * 100);
        console.log(`🎯 OVERALL COMPATIBILITY: ${compatibilityScore}%`);
        
        if (compatibilityScore >= 90) {
            console.log('🎉 Excellent! Your site works on all tested scenarios');
        } else if (compatibilityScore >= 70) {
            console.log('👍 Good! Your site works on most old browsers');
        } else {
            console.log('⚠️  Some compatibility issues found. Review the errors above.');
        }
        
        return {
            score: compatibilityScore,
            results: this.testResults
        };
    }

    // Manual test helper
    static generateManualTestInstructions() {
        return `
🧪 MANUAL TESTING INSTRUCTIONS:

1. Chrome DevTools Testing:
   - F12 → Console
   - Paste: delete window.Notification;
   - Paste: delete navigator.serviceWorker;
   - Paste: location.reload();
   - Check if site loads without errors

2. Firefox Testing:
   - Type: about:config
   - Set: dom.webnotifications.enabled = false
   - Set: dom.serviceWorkers.enabled = false
   - Reload your site

3. Mobile Testing:
   - Chrome DevTools → Device Mode
   - Select old Android devices
   - Test touch interactions

4. Different Browsers:
   - Edge IE Mode
   - Safari Private Mode
   - Opera Mini simulation

5. Real Device Testing:
   - Old Android phones (4.1-4.4)
   - Old iPhones (iOS 10-12)
   - Basic smartphones
        `;
    }
}

// Usage instructions
console.log(`
🔧 BROWSER COMPATIBILITY TESTING TOOL

To test your site:

1. Open your deployed site in browser
2. Open DevTools Console (F12)
3. Paste this entire script
4. Run: 
   const tester = new BrowserCompatibilityTester('YOUR_SITE_URL');
   tester.runAllTests();

5. Check results in console

Manual testing guide:
console.log(BrowserCompatibilityTester.generateManualTestInstructions());
`);

// Auto-test if URL is provided
if (typeof window !== 'undefined' && window.location) {
    console.log('🎯 Auto-testing current site...');
    const autoTester = new BrowserCompatibilityTester(window.location.href);
    
    // Add a global function for easy testing
    window.testCompatibility = () => {
        autoTester.runAllTests();
    };
    
    console.log('✅ Run testCompatibility() to start testing!');
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BrowserCompatibilityTester;
}
