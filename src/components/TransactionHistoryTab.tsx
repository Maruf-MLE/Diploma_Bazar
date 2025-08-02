import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, DollarSign, BookOpen } from 'lucide-react';
import PurchaseHistoryList from './PurchaseHistoryList';
import { Card, CardContent, CardDescription } from './ui/card';

interface TransactionHistoryTabProps {
  userId: string;
}

const TransactionHistoryTab: React.FC<TransactionHistoryTabProps> = ({ userId }) => {
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'purchases' | 'sales'>('all');

  return (
    <div className="space-y-4">
      <Card className="bg-white dark:bg-gray-800 shadow-sm border-0">
        <CardContent className="pt-4 pb-3">
          <CardDescription className="text-center text-sm text-gray-500 dark:text-gray-400">
            আপনার সমস্ত কেনাকাটার ইতিহাস এখানে দেখা যাবে। কেনা বই এবং বিক্রিত বই আলাদাভাবে দেখতে নিচের ট্যাব ব্যবহার করুন।
          </CardDescription>
        </CardContent>
      </Card>
      
      <Tabs 
        defaultValue="all" 
        value={activeSubTab} 
        onValueChange={(value) => setActiveSubTab(value as 'all' | 'purchases' | 'sales')}
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 w-full bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
          <TabsTrigger value="all" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-md">
            <span className="flex items-center">
              <BookOpen className="h-3.5 w-3.5 mr-2" />
              সব লেনদেন
            </span>
          </TabsTrigger>
          <TabsTrigger value="purchases" className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-950 data-[state=active]:shadow-md">
            <span className="flex items-center">
              <ShoppingCart className="h-3.5 w-3.5 mr-2" />
              কেনা বই
            </span>
          </TabsTrigger>
          <TabsTrigger value="sales" className="data-[state=active]:bg-green-50 dark:data-[state=active]:bg-green-950 data-[state=active]:shadow-md">
            <span className="flex items-center">
              <DollarSign className="h-3.5 w-3.5 mr-2" />
              বিক্রিত বই
            </span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="all" className="space-y-4 mt-0">
            <PurchaseHistoryList userId={userId} viewType="all" />
          </TabsContent>

          <TabsContent value="purchases" className="space-y-4 mt-0">
            <PurchaseHistoryList userId={userId} viewType="purchases" />
          </TabsContent>

          <TabsContent value="sales" className="space-y-4 mt-0">
            <PurchaseHistoryList userId={userId} viewType="sales" />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default TransactionHistoryTab; 