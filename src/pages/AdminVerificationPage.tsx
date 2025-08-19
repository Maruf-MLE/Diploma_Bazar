import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Loader2, 
  Search,
  EyeIcon
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface VerificationData {
  id: string;
  user_id: string;
  email: string;
  name: string;
  roll_no: string;
  reg_no: string;
  department: string | null;
  institute_name: string | null;
  document_url: string;
  created_at: string;
  updated_at: string;
  photo_url: string | null;
  status: string | null;
  is_verified: boolean;
}

const AdminVerificationPage = () => {
  const [verificationData, setVerificationData] = useState<VerificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [adminStatus, setAdminStatus] = useState<boolean>(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // এডমিন কিনা চেক করি
  useEffect(() => {
    if (user) {
      checkAdminStatus();
    } else {
      navigate('/login');
    }
  }, [user, navigate]);

  // এডমিন স্ট্যাটাস চেক করি
  const checkAdminStatus = async () => {
    try {
      console.log('Checking admin status for user:', user?.id);
      
      // localStorage থেকে এডমিন স্ট্যাটাস চেক করি
      const localAdminStatus = localStorage.getItem('is_admin') === 'true';
      const localAdminUserId = localStorage.getItem('admin_user_id');
      
      // যদি localStorage এ এডমিন স্ট্যাটাস থাকে এবং বর্তমান ইউজারের আইডি মিলে
      if (localAdminStatus && localAdminUserId === user?.id) {
        console.log('Admin status found in localStorage');
        setAdminStatus(true);
        fetchVerificationData();
        return;
      }
      
      // admin_users টেবিল থেকে এডমিন স্ট্যাটাস চেক করি
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      
      console.log('Admin check result:', { data, error });
        
      if (error) {
        console.error('Error checking admin status:', error);
        
        // RPC ফাংশন দিয়ে চেক করি
        try {
          const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin', { user_id: user?.id });
          
          if (!rpcError && isAdmin) {
            console.log('User is admin according to RPC function');
            setAdminStatus(true);
            // localStorage এ এডমিন স্ট্যাটাস সেট করি
            localStorage.setItem('is_admin', 'true');
            localStorage.setItem('admin_user_id', user?.id || '');
            fetchVerificationData();
            return;
          }
        } catch (rpcError) {
          console.error('Error checking admin status with RPC:', rpcError);
        }
        
        // ডিবাগিং মোডে এডমিন অ্যাকসেস দেই
        if (process.env.NODE_ENV === 'development') {
          console.log('Allowing admin access in development mode');
          setAdminStatus(true);
          localStorage.setItem('is_admin', 'true');
          localStorage.setItem('admin_user_id', user?.id || '');
          fetchVerificationData();
          return;
        }
        
        navigate('/not-allowed');
        return;
      }
      
      if (!data) {
        console.log('No admin data found for user:', user?.id);
        
        // ডিবাগিং মোডে এডমিন অ্যাকসেস দেই
        if (process.env.NODE_ENV === 'development') {
          console.log('Allowing admin access in development mode');
          setAdminStatus(true);
          localStorage.setItem('is_admin', 'true');
          localStorage.setItem('admin_user_id', user?.id || '');
          fetchVerificationData();
          return;
        }
        
        navigate('/not-allowed');
        return;
      }
      
      console.log('User is admin:', data);
      setAdminStatus(true);
      // localStorage এ এডমিন স্ট্যাটাস সেট করি
      localStorage.setItem('is_admin', 'true');
      localStorage.setItem('admin_user_id', user?.id || '');
      fetchVerificationData();
    } catch (error) {
      console.error('Error checking admin status:', error);
      
      // ডিবাগিং মোডে এডমিন অ্যাকসেস দেই
      if (process.env.NODE_ENV === 'development') {
        console.log('Allowing admin access in development mode');
        setAdminStatus(true);
        localStorage.setItem('is_admin', 'true');
        localStorage.setItem('admin_user_id', user?.id || '');
        fetchVerificationData();
        return;
      }
      
      navigate('/not-allowed');
    }
  };

  // ভেরিফিকেশন ডেটা লোড করি
  const fetchVerificationData = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching verification data...');
      
      // সরাসরি verification_data table থেকে ডেটা নেই (সবচেয়ে reliable)
      const { data: directData, error: directError } = await supabase
        .from('verification_data')
        .select(`
          id,
          user_id,
          name,
          roll_no,
          reg_no,
          department,
          institute_name,
          document_url,
          is_verified,
          created_at,
          updated_at,
          status
        `)
        .order('created_at', { ascending: false });
      
      if (directError) {
        console.error('Direct query failed:', directError);
        throw directError;
      }
      
      console.log('Raw data from database:', directData);
      
      // Direct query ডেটা format করি
      const formattedData = directData?.map(item => {
        console.log('Processing item:', {
          id: item.id.substring(0, 8),
          department: item.department,
          institute_name: item.institute_name,
          name: item.name
        });
        
        return {
          id: item.id,
          user_id: item.user_id,
          email: '', // খালি রাখি
          name: item.name || 'অজানা',
          roll_no: item.roll_no || '',
          reg_no: item.reg_no || '',
          department: item.department || '',
          institute_name: item.institute_name || '',
          document_url: item.document_url || '',
          created_at: item.created_at,
          updated_at: item.updated_at,
          photo_url: '', // খালি রাখি  
          status: item.status || 'pending',
          is_verified: item.is_verified || false
        };
      }) || [];
      
      console.log(`Direct query successful! Found ${formattedData.length} records`);
      console.log('Sample formatted data:', formattedData.slice(0, 2));
      setVerificationData(formattedData);
      
    } catch (error) {
      console.error('Error fetching verification data:', error);
      toast({
        title: 'ডেটা লোড করতে সমস্যা',
        description: 'ভেরিফিকেশন ডেটা লোড করতে সমস্যা হয়েছে।',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // ভেরিফিকেশন বিবরণ দেখি
  const viewVerificationDetails = (data: VerificationData) => {
    // নতুন পেইজে নেভিগেট করি
    navigate(`/admin/verification/${data.user_id}`, { state: { verificationData: data } });
  };

  // সার্চ ফিল্টার লজিক
  const filteredData = verificationData.filter(data => 
    (data.name?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (data.roll_no?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (data.reg_no?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (data.department?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (data.institute_name?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
  );

  // লোডিং স্পিনার দেখাই
  if (loading || !adminStatus) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto pt-24 px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ভেরিফিকেশন ম্যানেজমেন্ট</h1>
            <p className="text-gray-600">ব্যবহারকারীদের ভেরিফিকেশন তথ্য দেখুন এবং অনুমোদন/বাতিল করুন</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-100 text-blue-800">
              মোট: {verificationData.length}
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchVerificationData}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'রিফ্রেশ'}
            </Button>
          </div>
        </div>
        
        {/* Debug info - show data statistics */}
        {verificationData.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-blue-800 font-medium mb-2">📊 ডেটা পরিসংখ্যান</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-blue-700">
                <span className="font-medium">মোট রেকর্ড:</span> {verificationData.length}
              </div>
              <div className="text-blue-700">
                <span className="font-medium">বিভাগ সহ:</span> {verificationData.filter(d => d.department && d.department.trim() !== '').length}
              </div>
              <div className="text-blue-700">
                <span className="font-medium">প্রতিষ্ঠান সহ:</span> {verificationData.filter(d => d.institute_name && d.institute_name.trim() !== '').length}
              </div>
              <div className="text-blue-700">
                <span className="font-medium">সম্পূর্ণ:</span> {verificationData.filter(d => d.department && d.institute_name && d.department.trim() !== '' && d.institute_name.trim() !== '').length}
              </div>
            </div>
          </div>
        )}
        
        {/* Debug info - show if no data found */}
        {verificationData.length === 0 && !loading && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-yellow-800 font-medium mb-2">📋 কোন ভেরিফিকেশন ডেটা পাওয়া যায়নি</h3>
            <p className="text-yellow-700 text-sm mb-3">
              এর কারণ হতে পারে:
            </p>
            <ul className="text-yellow-700 text-sm list-disc list-inside space-y-1">
              <li>এখনও কোন ইউজার ভেরিফিকেশন রিকোয়েস্ট পাঠায়নি</li>
              <li>Database RLS policy সমস্যা</li>
              <li>Database connection সমস্যা</li>
            </ul>
            <p className="text-yellow-700 text-sm mt-3">
              <strong>সমাধান:</strong> প্রথমে নিশ্চিত করুন যে ইউজাররা ভেরিফিকেশন পেজে গিয়ে তাদের তথ্য submit করেছে।
            </p>
          </div>
        )}
        
        {/* সার্চ বার */}
        <div className="mb-6 flex w-full max-w-sm items-center space-x-2">
          <Input
            type="text"
            placeholder="নাম, রোল, রেজিস্ট্রেশন, বিভাগ বা প্রতিষ্ঠান দ্বারা সার্চ করুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
          <Button type="button" variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">সকল ({filteredData.length})</TabsTrigger>
            <TabsTrigger value="pending">পেন্ডিং ({filteredData.filter(d => !d.is_verified).length})</TabsTrigger>
            <TabsTrigger value="verified">ভেরিফাইড ({filteredData.filter(d => d.is_verified).length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <Card>
              <CardContent className="p-0">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">আইডি</TableHead>
                        <TableHead>রোল নম্বর</TableHead>
                        <TableHead>বিভাগ</TableHead>
                        <TableHead>প্রতিষ্ঠান</TableHead>
                        <TableHead>স্ট্যাটাস</TableHead>
                        <TableHead className="text-right">অ্যাকশন</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.length > 0 ? (
                        filteredData.map((data) => (
                          <TableRow key={data.id}>
                            <TableCell className="font-medium">{data.id.substring(0, 6)}...</TableCell>
                            <TableCell>
                              <span className="text-blue-600 font-medium">{data.roll_no || 'নেই'}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{data.department || 'বিভাগ নেই'}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{data.institute_name || 'প্রতিষ্ঠানের নাম নেই'}</span>
                            </TableCell>
                            <TableCell>
                              {data.is_verified ? (
                                <Badge className="bg-green-100 text-green-800">ভেরিফাইড</Badge>
                              ) : (
                                <Badge className="bg-yellow-100 text-yellow-800">পেন্ডিং</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => viewVerificationDetails(data)}
                              >
                                <EyeIcon className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                            কোন ডেটা পাওয়া যায়নি
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="pending">
            <Card>
              <CardContent className="p-0">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">আইডি</TableHead>
                        <TableHead>রোল নম্বর</TableHead>
                        <TableHead>বিভাগ</TableHead>
                        <TableHead>প্রতিষ্ঠান</TableHead>
                        <TableHead>স্ট্যাটাস</TableHead>
                        <TableHead className="text-right">অ্যাকশন</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.filter(d => !d.is_verified).length > 0 ? (
                        filteredData
                          .filter(d => !d.is_verified)
                          .map((data) => (
                            <TableRow key={data.id}>
                              <TableCell className="font-medium">{data.id.substring(0, 6)}...</TableCell>
                              <TableCell>
                                <span className="text-blue-600 font-medium">{data.roll_no || 'নেই'}</span>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm">{data.department || 'বিভাগ নেই'}</span>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm">{data.institute_name || 'প্রতিষ্ঠানের নাম নেই'}</span>
                              </TableCell>
                              <TableCell>
                                <Badge className="bg-yellow-100 text-yellow-800">পেন্ডিং</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => viewVerificationDetails(data)}
                                >
                                  <EyeIcon className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                            কোন পেন্ডিং ভেরিফিকেশন নেই
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="verified">
            <Card>
              <CardContent className="p-0">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">আইডি</TableHead>
                        <TableHead>রোল নম্বর</TableHead>
                        <TableHead>বিভাগ</TableHead>
                        <TableHead>প্রতিষ্ঠান</TableHead>
                        <TableHead>স্ট্যাটাস</TableHead>
                        <TableHead className="text-right">অ্যাকশন</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.filter(d => d.is_verified).length > 0 ? (
                        filteredData
                          .filter(d => d.is_verified)
                          .map((data) => (
                            <TableRow key={data.id}>
                              <TableCell className="font-medium">{data.id.substring(0, 6)}...</TableCell>
                              <TableCell>
                                <span className="text-blue-600 font-medium">{data.roll_no || 'নেই'}</span>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm">{data.department || 'বিভাগ নেই'}</span>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm">{data.institute_name || 'প্রতিষ্ঠানের নাম নেই'}</span>
                              </TableCell>
                              <TableCell>
                                <Badge className="bg-green-100 text-green-800">ভেরিফাইড</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => viewVerificationDetails(data)}
                                >
                                  <EyeIcon className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                            কোন ভেরিফাইড ব্যবহারকারী নেই
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminVerificationPage; 