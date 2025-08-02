import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

const AllDepartmentsPage = () => {
  const navigate = useNavigate();
  
  // List of all departments
  const allDepartments = [
    "কম্পিউটার টেকনোলজি",
    "সিভিল টেকনোলজি",
    "ইলেকট্রিক্যাল টেকনোলজি",
    "মেকানিক্যাল টেকনোলজি",
    "ইলেকট্রনিক্স টেকনোলজি",
    "পাওয়ার টেকনোলজি",
    "মেকাট্রনিক্স টেকনোলজি",
    "রেফ্রিজারেশন অ্যান্ড এয়ার কন্ডিশনিং টেকনোলজি",
    "অটোমোবাইল টেকনোলজি",
    "টেক্সটাইল টেকনোলজি",
    "শিপবিল্ডিং টেকনোলজি",
    "মেরিন টেকনোলজি",
    "ফুড টেকনোলজি",
    "আর্কিটেকচার",
    "কেমিক্যাল টেকনোলজি",
    "বায়োমেডিকেল টেকনোলজি",
    "এনভায়রনমেন্টাল টেকনোলজি",
    "মাইনিং টেকনোলজি",
    "নিউক্লিয়ার টেকনোলজি",
    "পেট্রোলিয়াম টেকনোলজি"
  ];

  // Handle department selection
  const handleSelectDepartment = (dept: string) => {
    // Navigate back to browse page with the selected department as a query parameter
    navigate(`/browse?department=${encodeURIComponent(dept)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      
      {/* Main Content */}
      <main className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink>সকল বিভাগ</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">সকল বিভাগ</h1>
            <p className="text-muted-foreground mt-1">আপনার পছন্দের বিভাগ নির্বাচন করুন</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            ফিরে যান
          </Button>
        </div>
        
        {/* Departments Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
          {allDepartments.map((dept, index) => (
            <Button 
              key={index}
              variant="outline"
              className="glass-card-modern h-auto py-4 px-4 rounded-lg flex items-center justify-center text-center 
                text-sm hover:text-primary hover:border-primary/30 transition-all duration-200 hover:bg-primary/5"
              onClick={() => handleSelectDepartment(dept)}
            >
              {dept}
            </Button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AllDepartmentsPage; 