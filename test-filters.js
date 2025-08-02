/**
 * Test Script for Filter Functionality
 * 
 * This script will help test the semester, publisher, and institute_name filters
 * Run this in browser console while on the Browse Books page
 */

console.log('🧪 Starting Filter Tests...');

// Test 1: Semester Filter
function testSemesterFilter() {
  console.log('\n📖 Testing Semester Filter...');
  
  // Open filter dialog
  const filterButton = document.querySelector('button:has(svg + div:contains("ফিল্টার করুন"))');
  if (filterButton) {
    filterButton.click();
    console.log('✅ Filter dialog opened');
    
    // Wait for dialog to open and test semester dropdown
    setTimeout(() => {
      // Find semester select
      const semesterSelects = document.querySelectorAll('[role="combobox"]');
      const semesterSelect = Array.from(semesterSelects).find(select => {
        const label = select.closest('div').previousElementSibling;
        return label && label.textContent.includes('সেমিস্টার');
      });
      
      if (semesterSelect) {
        console.log('✅ Semester dropdown found');
        semesterSelect.click();
        
        // Wait for options to appear
        setTimeout(() => {
          const semesterOptions = document.querySelectorAll('[role="option"]');
          const firstSemesterOption = Array.from(semesterOptions).find(option => 
            option.textContent.includes('১ম সেমিস্টার')
          );
          
          if (firstSemesterOption) {
            console.log('✅ Semester options found');
            firstSemesterOption.click();
            console.log('✅ Selected "১ম সেমিস্টার"');
            
            // Apply filters
            setTimeout(() => {
              const applyButton = document.querySelector('button:contains("প্রয়োগ করুন")');
              if (applyButton) {
                applyButton.click();
                console.log('✅ Semester filter applied');
              }
            }, 100);
          } else {
            console.log('❌ Could not find semester options');
          }
        }, 100);
      } else {
        console.log('❌ Could not find semester dropdown');
      }
    }, 500);
  } else {
    console.log('❌ Could not find filter button');
  }
}

// Test 2: Publisher Filter
function testPublisherFilter() {
  console.log('\n📚 Testing Publisher Filter...');
  
  setTimeout(() => {
    // Open filter dialog
    const filterButton = document.querySelector('button:has(svg + div:contains("ফিল্টার করুন"))');
    if (filterButton) {
      filterButton.click();
      
      setTimeout(() => {
        // Find publisher select
        const publisherSelects = document.querySelectorAll('[role="combobox"]');
        const publisherSelect = Array.from(publisherSelects).find(select => {
          const label = select.closest('div').previousElementSibling;
          return label && label.textContent.includes('প্রকাশনী');
        });
        
        if (publisherSelect) {
          console.log('✅ Publisher dropdown found');
          publisherSelect.click();
          
          setTimeout(() => {
            const publisherOptions = document.querySelectorAll('[role="option"]');
            const hokPublisherOption = Array.from(publisherOptions).find(option => 
              option.textContent.includes('হক প্রকাশনী')
            );
            
            if (hokPublisherOption) {
              console.log('✅ Publisher options found');
              hokPublisherOption.click();
              console.log('✅ Selected "হক প্রকাশনী"');
              
              // Apply filters
              setTimeout(() => {
                const applyButton = document.querySelector('button:contains("প্রয়োগ করুন")');
                if (applyButton) {
                  applyButton.click();
                  console.log('✅ Publisher filter applied');
                }
              }, 100);
            } else {
              console.log('❌ Could not find publisher options');
            }
          }, 100);
        } else {
          console.log('❌ Could not find publisher dropdown');
        }
      }, 500);
    }
  }, 2000);
}

// Test 3: Institute Name Filter
function testInstituteFilter() {
  console.log('\n🏫 Testing Institute Filter...');
  
  setTimeout(() => {
    // Open filter dialog
    const filterButton = document.querySelector('button:has(svg + div:contains("ফিল্টার করুন"))');
    if (filterButton) {
      filterButton.click();
      
      setTimeout(() => {
        // Find institute select
        const instituteSelects = document.querySelectorAll('[role="combobox"]');
        const instituteSelect = Array.from(instituteSelects).find(select => {
          const label = select.closest('div').previousElementSibling;
          return label && label.textContent.includes('প্রতিষ্ঠান');
        });
        
        if (instituteSelect) {
          console.log('✅ Institute dropdown found');
          instituteSelect.click();
          
          setTimeout(() => {
            const instituteOptions = document.querySelectorAll('[role="option"]');
            const dhakaPolyOption = Array.from(instituteOptions).find(option => 
              option.textContent.includes('ঢাকা পলিটেকনিক ইনস্টিটিউট')
            );
            
            if (dhakaPolyOption) {
              console.log('✅ Institute options found');
              dhakaPolyOption.click();
              console.log('✅ Selected "ঢাকা পলিটেকনিক ইনস্টিটিউট"');
              
              // Apply filters
              setTimeout(() => {
                const applyButton = document.querySelector('button:contains("প্রয়োগ করুন")');
                if (applyButton) {
                  applyButton.click();
                  console.log('✅ Institute filter applied');
                }
              }, 100);
            } else {
              console.log('❌ Could not find institute options');
            }
          }, 100);
        } else {
          console.log('❌ Could not find institute dropdown');
        }
      }, 500);
    }
  }, 4000);
}

// Test 4: Multiple Filters Together
function testMultipleFilters() {
  console.log('\n🔄 Testing Multiple Filters Together...');
  
  setTimeout(() => {
    // Open filter dialog
    const filterButton = document.querySelector('button:has(svg + div:contains("ফিল্টার করুন"))');
    if (filterButton) {
      filterButton.click();
      
      setTimeout(() => {
        // Set department filter first
        const departmentSelects = document.querySelectorAll('[role="combobox"]');
        const departmentSelect = Array.from(departmentSelects).find(select => {
          const label = select.closest('div').previousElementSibling;
          return label && label.textContent.includes('বিভাগ');
        });
        
        if (departmentSelect) {
          departmentSelect.click();
          
          setTimeout(() => {
            const deptOptions = document.querySelectorAll('[role="option"]');
            const cseOption = Array.from(deptOptions).find(option => 
              option.textContent.includes('কম্পিউটার ইঞ্জিনিয়ারিং')
            );
            
            if (cseOption) {
              cseOption.click();
              console.log('✅ Selected CSE department');
              
              // Now set semester
              setTimeout(() => {
                const semesterSelects = document.querySelectorAll('[role="combobox"]');
                const semesterSelect = Array.from(semesterSelects).find(select => {
                  const label = select.closest('div').previousElementSibling;
                  return label && label.textContent.includes('সেমিস্টার');
                });
                
                if (semesterSelect) {
                  semesterSelect.click();
                  
                  setTimeout(() => {
                    const semesterOptions = document.querySelectorAll('[role="option"]');
                    const sem3Option = Array.from(semesterOptions).find(option => 
                      option.textContent.includes('৩য় সেমিস্টার')
                    );
                    
                    if (sem3Option) {
                      sem3Option.click();
                      console.log('✅ Selected 3rd semester');
                      
                      // Apply multiple filters
                      setTimeout(() => {
                        const applyButton = document.querySelector('button:contains("প্রয়োগ করুন")');
                        if (applyButton) {
                          applyButton.click();
                          console.log('✅ Multiple filters applied (CSE + 3rd Semester)');
                        }
                      }, 100);
                    }
                  }, 100);
                }
              }, 200);
            }
          }, 100);
        }
      }, 500);
    }
  }, 6000);
}

// Test 5: Check if pagination maintains filters
function testPaginationWithFilters() {
  console.log('\n📄 Testing Pagination with Filters...');
  
  setTimeout(() => {
    // Check if "Load More" button exists and click it
    const loadMoreButton = document.querySelector('button:contains("আরও বই দেখুন")');
    if (loadMoreButton && !loadMoreButton.disabled) {
      console.log('✅ Load More button found');
      loadMoreButton.click();
      console.log('✅ Clicked Load More - checking if filters are maintained...');
      
      // Monitor console for filter application logs
      setTimeout(() => {
        console.log('✅ Check browser network tab to verify filters are sent with pagination requests');
      }, 2000);
    } else {
      console.log('ℹ️  No Load More button available or it\'s disabled');
    }
  }, 8000);
}

// Helper function to check current applied filters
function checkCurrentFilters() {
  console.log('\n🔍 Current Applied Filters:');
  
  // Check URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  console.log('URL Parameters:', Object.fromEntries(urlParams));
  
  // Check localStorage for filter state
  const savedFilters = sessionStorage.getItem('bookFilterState');
  if (savedFilters) {
    console.log('Saved Filter State:', JSON.parse(savedFilters));
  }
}

// Run all tests
function runAllTests() {
  console.log('🚀 Starting comprehensive filter tests...');
  console.log('Make sure you are on the Browse Books page');
  
  checkCurrentFilters();
  testSemesterFilter();
  testPublisherFilter();
  testInstituteFilter();
  testMultipleFilters();
  testPaginationWithFilters();
  
  // Final check after all tests
  setTimeout(() => {
    console.log('\n📊 Final Results:');
    checkCurrentFilters();
    console.log('\n✅ All tests completed! Check the results above.');
    console.log('📝 Manual verification needed:');
    console.log('   - Verify that book cards match the applied filters');
    console.log('   - Check that browser network requests include filter parameters');
    console.log('   - Confirm that pagination loads more books with the same filters');
  }, 12000);
}

// Export functions for manual testing
window.filterTests = {
  runAll: runAllTests,
  testSemester: testSemesterFilter,
  testPublisher: testPublisherFilter,
  testInstitute: testInstituteFilter,
  testMultiple: testMultipleFilters,
  testPagination: testPaginationWithFilters,
  checkFilters: checkCurrentFilters
};

console.log('📋 Test functions available:');
console.log('- filterTests.runAll() - Run all tests');
console.log('- filterTests.testSemester() - Test semester filter');
console.log('- filterTests.testPublisher() - Test publisher filter');
console.log('- filterTests.testInstitute() - Test institute filter');
console.log('- filterTests.testMultiple() - Test multiple filters');
console.log('- filterTests.testPagination() - Test pagination');
console.log('- filterTests.checkFilters() - Check current filters');

// Auto-run all tests after 2 seconds
setTimeout(() => {
  console.log('\n🏃 Auto-running all tests in 3 seconds...');
  console.log('Cancel with: clearTimeout(window.autoTestTimeout)');
  
  window.autoTestTimeout = setTimeout(runAllTests, 3000);
}, 2000);
