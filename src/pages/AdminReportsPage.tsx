import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Loader2, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  UserX,
  Calendar,
  X,
  MoreHorizontal,
  RefreshCw,
  ChevronDown,
  CheckCircle2 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// Report type definition
interface Report {
  id: string;
  created_at: string;
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  details: string;
  status: 'pending' | 'resolved' | 'dismissed' | 'checked';
  admin_notes?: string;
  reporter?: {
    name: string;
    avatar_url: string;
  };
  reported_user?: {
    name: string;
    avatar_url: string;
  };
  resolved_at?: string;
  resolved_by?: string;
  is_banned?: boolean;
  ban_reason?: string;
  ban_expires_at?: string;
  is_checked?: boolean;
}

// Ban status type definition
interface BanStatus {
  user_id: string;
  is_banned: boolean;
  banned_at?: string;
  banned_by?: string;
  ban_reason?: string;
  ban_expires_at?: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500 hover:bg-yellow-600',
  resolved: 'bg-green-500 hover:bg-green-600',
  dismissed: 'bg-gray-500 hover:bg-gray-600',
  checked: 'bg-blue-500 hover:bg-blue-600',
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="h-3 w-3 mr-1" />,
  resolved: <CheckCircle className="h-3 w-3 mr-1" />,
  dismissed: <X className="h-3 w-3 mr-1" />,
  checked: <CheckCircle2 className="h-3 w-3 mr-1" />,
};

const AdminReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [adminStatus, setAdminStatus] = useState<boolean>(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTabChanging, setIsTabChanging] = useState(false);
  
  // Ban dialog state
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [banReason, setBanReason] = useState<string>('');
  const [banDuration, setBanDuration] = useState<string>('permanent');
  const [isBanSubmitting, setIsBanSubmitting] = useState(false);
  
  // View report details dialog state
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [reportStatus, setReportStatus] = useState<'pending' | 'resolved' | 'dismissed' | 'checked'>('pending');
  const [isReportSubmitting, setIsReportSubmitting] = useState(false);

  // Add a new state to track table creation
  const [isTableInitialized, setIsTableInitialized] = useState(false);

  // Add report count states
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [checkedCount, setCheckedCount] = useState<number>(0);

  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check admin status
  useEffect(() => {
    if (user) {
      checkAdminStatus();
    } else {
      navigate('/login');
    }
  }, [user, navigate]);
  
  // Apply filters when active tab or search term changes
  useEffect(() => {
    filterReports();
  }, [activeTab, searchTerm, reports]);

  // Check if the reports table exists and create it if not
  const ensureReportsTableExists = async () => {
    try {
      console.log('Checking if reports table exists...');
      
      // Try to select from the reports table to see if it exists
      const { error } = await supabase
        .from('reports')
        .select('count(*)')
        .limit(1);
      
      if (error && error.message.includes('relation "reports" does not exist')) {
        console.log('Reports table does not exist, creating it now...');
        
        // Execute SQL to create the reports table
        const { error: createError } = await supabase.rpc('create_reports_table', {});
        
        if (createError) {
          console.error('Error creating reports table with RPC:', createError);
          
          // Try creating the table directly with SQL
          const { error: sqlError } = await supabase.rpc('exec_sql', {
            sql_query: `
              -- Create reports table
              CREATE TABLE IF NOT EXISTS "public"."reports" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
                "reported_user_id" UUID REFERENCES auth.users(id) ON DELETE CASCADE,
                "reporter_id" UUID REFERENCES auth.users(id) ON DELETE CASCADE,
                "reason" TEXT NOT NULL,
                "details" TEXT,
                "status" TEXT NOT NULL DEFAULT 'pending',
                "admin_notes" TEXT,
                "resolved_by" UUID REFERENCES auth.users(id) ON DELETE SET NULL,
                "resolved_at" TIMESTAMP WITH TIME ZONE
              );
              
              -- Enable RLS
              ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;
              
              -- Create policies
              CREATE POLICY "Allow admins full access" ON "public"."reports"
                USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));
              
              CREATE POLICY "Allow users to create reports" ON "public"."reports"
                FOR INSERT
                WITH CHECK (auth.uid() = reporter_id);
            `
          });
          
          if (sqlError) {
            console.error('Error creating reports table with direct SQL:', sqlError);
            
            // Last attempt - execute an insert with explicit table creation
            try {
              // Use raw SQL via Supabase client
              const { error: rawSqlError } = await supabase.rpc('exec_sql', {
                sql_query: `
                  CREATE TABLE IF NOT EXISTS reports (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    created_at TIMESTAMPTZ DEFAULT now(),
                    updated_at TIMESTAMPTZ DEFAULT now(),
                    reported_user_id UUID,
                    reporter_id UUID,
                    reason TEXT,
                    details TEXT,
                    status TEXT DEFAULT 'pending',
                    admin_notes TEXT,
                    resolved_by UUID,
                    resolved_at TIMESTAMPTZ
                  );
                `
              });
              
              if (rawSqlError) {
                console.error('Final attempt failed:', rawSqlError);
                toast({
                  title: 'ডাটাবেস সমস্যা',
                  description: 'রিপোর্ট টেবিল তৈরি করতে সমস্যা হয়েছে। অ্যাডমিনের সাথে যোগাযোগ করুন।',
                  variant: 'destructive'
                });
                return false;
              }
            } catch (finalError) {
              console.error('Final error in table creation:', finalError);
              return false;
            }
          }
        }
        
        console.log('Reports table created successfully');
        toast({
          title: 'সফল',
          description: 'রিপোর্ট টেবিল সফলভাবে তৈরি করা হয়েছে।',
        });
      } else if (error) {
        console.error('Unexpected error checking reports table:', error);
        return false;
      } else {
        console.log('Reports table already exists');
      }
      
      setIsTableInitialized(true);
      return true;
    } catch (error) {
      console.error('Error in ensureReportsTableExists:', error);
      return false;
    }
  };

  // Ensure ban table exists
  const ensureBanTableExists = async () => {
    try {
      console.log('Checking if ban table exists...');
      
      // Try to select from the user_ban_status table to see if it exists
      const { error } = await supabase
        .from('user_ban_status')
        .select('count(*)')
        .limit(1);
      
      if (error) {
        console.log('Ban table does not exist, creating it now...');
        
        // Create the table directly
        const createBanTableSQL = `
          CREATE TABLE IF NOT EXISTS "public"."user_ban_status" (
            "user_id" UUID PRIMARY KEY,
            "is_banned" BOOLEAN DEFAULT FALSE,
            "banned_at" TIMESTAMP WITH TIME ZONE,
            "banned_by" TEXT,
            "ban_reason" TEXT,
            "ban_expires_at" TIMESTAMP WITH TIME ZONE,
            "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
            "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
          
          -- Enable RLS with a permissive policy
          ALTER TABLE "public"."user_ban_status" ENABLE ROW LEVEL SECURITY;
          
          -- Create or replace policy
          DROP POLICY IF EXISTS "Allow all operations" ON "public"."user_ban_status";
          CREATE POLICY "Allow all operations" ON "public"."user_ban_status" USING (true);
        `;
        
        try {
          // Try to create the table via SQL
          const { error: sqlError } = await supabase.rpc('exec_sql', { sql_query: createBanTableSQL });
          
          if (sqlError) {
            console.error('Error creating ban table with SQL:', sqlError);
            return false;
          }
          
          // Verify table was created
          const { error: verifyError } = await supabase
            .from('user_ban_status')
            .select('count(*)')
            .limit(1);
            
          if (verifyError) {
            console.error('Failed to verify ban table creation:', verifyError);
            return false;
          }
          
          console.log('Ban table created successfully!');
          return true;
        } catch (error) {
          console.error('Error in ban table creation:', error);
          return false;
        }
      }
      
      console.log('Ban table already exists');
      return true;
    } catch (error) {
      console.error('Error checking ban table:', error);
      return false;
    }
  };

  // Check admin status
  const checkAdminStatus = async () => {
    try {
      // localStorage থেকে এডমিন স্ট্যাটাস চেক করি
      const localAdminStatus = localStorage.getItem('is_admin') === 'true';
      const localAdminUserId = localStorage.getItem('admin_user_id');
      
      if (localAdminStatus && localAdminUserId === user?.id) {
        setAdminStatus(true);
        setLoading(false);
        fetchReports();
        return;
      }
      
      // admin_users টেবিল থেকে এডমিন স্ট্যাটাস চেক করি
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user?.id)
        .single();
        
      if (error || !data) {
        // ডিবাগিং মোডে এডমিন অ্যাকসেস দেই
        if (process.env.NODE_ENV === 'development') {
          setAdminStatus(true);
          setLoading(false);
          fetchReports();
          return;
        }
        
        navigate('/not-allowed');
        return;
      }
      
      setAdminStatus(true);
      
      // First ensure the tables exist, then fetch reports
      const tableExists = await ensureReportsTableExists();
      const banTableExists = await ensureBanTableExists();
      
      if (tableExists) {
        fetchReports();
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      
      // ডিবাগিং মোডে এডমিন অ্যাকসেস দেই
      if (process.env.NODE_ENV === 'development') {
        setAdminStatus(true);
        setLoading(false);
        fetchReports();
        return;
      }
      
      navigate('/not-allowed');
    } finally {
      setLoading(false);
    }
  };

  // Fetch reports
  const fetchReports = async () => {
    try {
      setIsRefreshing(true);
      
      // Debug: Check if reports table exists
      console.log("Checking if reports table exists...");
      const { data: tables, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
        
      console.log("Tables in database:", tables);
      
      if (tableError) {
        console.error("Error checking tables:", tableError);
      }
      
      // Try to create the reports table if it doesn't exist
      try {
        console.log("Attempting to create reports table if it doesn't exist...");
        await supabase.rpc('create_reports_table_simple');
      } catch (createError) {
        console.error("Error creating reports table:", createError);
      }
      
      // Get reports - use different approach that's less likely to fail
      console.log("Fetching reports with safer approach...");
      
      try {
        // First, try a simpler query that doesn't rely on joined data
        const { data: reportData, error: reportError } = await supabase
          .from('reports')
          .select('*')
          .order('created_at', { ascending: false });
          
        console.log("Basic reports query result:", { reportData, reportError });
        
        if (reportError) {
          // If this fails, there might be a fundamental issue with the reports table
          console.error("Basic reports query failed:", reportError);
          setReports([]);
          setFilteredReports([]);
          setIsRefreshing(false);
          
          toast({
            title: 'ত্রুটি',
            description: 'রিপোর্ট ডাটা লোড করতে সমস্যা হয়েছে। টেবিল সেটআপ সম্পন্ন নাও হতে পারে।',
            variant: 'destructive'
          });
          return;
        }
        
        if (!reportData || reportData.length === 0) {
          console.log("No reports found");
          setReports([]);
          setFilteredReports([]);
          setIsRefreshing(false);
          return;
        }
        
        // If basic query succeeds, proceed with joining profile data
        const reportsWithUsers = await Promise.all(reportData.map(async (report) => {
          let reporterData = null;
          let reportedUserData = null;
          let banStatus = { is_banned: false, ban_reason: null, ban_expires_at: null };
          
          try {
            // Get reporter info
            const reporterResponse = await supabase
              .from('profiles')
              .select('name, avatar_url')
              .eq('id', report.reporter_id)
              .maybeSingle();
              
            reporterData = reporterResponse.data;
          } catch (profileError) {
            console.error("Error fetching reporter profile:", profileError);
          }
          
          try {
            // Get reported user info
            const reportedUserResponse = await supabase
              .from('profiles')
              .select('name, avatar_url')
              .eq('id', report.reported_user_id)
              .maybeSingle();
              
            reportedUserData = reportedUserResponse.data;
          } catch (profileError) {
            console.error("Error fetching reported user profile:", profileError);
          }
          
          try {
            // Get ban status for reported user
            const banResponse = await supabase
              .from('user_ban_status')
              .select('is_banned, ban_reason, ban_expires_at')
              .eq('user_id', report.reported_user_id)
              .maybeSingle();
              
            if (banResponse.data) {
              banStatus = {
                is_banned: banResponse.data.is_banned,
                ban_reason: banResponse.data.ban_reason,
                ban_expires_at: banResponse.data.ban_expires_at
              };
            }
          } catch (banError) {
            console.error("Error fetching ban status:", banError);
          }
          
          return {
            ...report,
            reporter: reporterData || { name: 'অজানা ব্যবহারকারী', avatar_url: null },
            reported_user: reportedUserData || { name: 'অজানা ব্যবহারকারী', avatar_url: null },
            is_banned: banStatus.is_banned,
            ban_reason: banStatus.ban_reason,
            ban_expires_at: banStatus.ban_expires_at
          };
        }));
        
        console.log("Processed reports with user data:", reportsWithUsers);
        setReports(reportsWithUsers);
        setFilteredReports(reportsWithUsers);
      } catch (reportQueryError) {
        console.error("Error in reports query process:", reportQueryError);
        setReports([]);
        setFilteredReports([]);
        toast({
          title: 'ত্রুটি',
          description: 'রিপোর্ট ডাটা প্রসেস করতে সমস্যা হয়েছে',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      // Log more detailed error information
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      
      toast({
        title: 'ত্রুটি',
        description: 'রিপোর্ট লোড করতে সমস্যা হয়েছে',
        variant: 'destructive'
      });
      
      setReports([]);
      setFilteredReports([]);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Filter reports based on active tab and search term
  const filterReports = () => {
    let filtered = [...reports];
    
    // Calculate counts
    setTotalCount(reports.length);
    setPendingCount(reports.filter(report => report.status === 'pending').length);
    setCheckedCount(reports.filter(report => report.status === 'checked').length);
    
    // Filter by tab/status
    if (activeTab === 'pending') {
      filtered = filtered.filter(report => report.status === 'pending');
    } else if (activeTab === 'checked') {
      filtered = filtered.filter(report => report.status === 'checked');
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(report => 
        (report.reported_user?.name && report.reported_user.name.toLowerCase().includes(term)) || 
        (report.reporter?.name && report.reporter.name.toLowerCase().includes(term)) || 
        report.details?.toLowerCase().includes(term) ||
        report.reason?.toLowerCase().includes(term)
      );
    }
    
    setFilteredReports(filtered);
  };
  
  // Check if user is banned with better error handling
  const checkBanStatus = async (userId: string) => {
    try {
      // Ensure ban table exists first
      await ensureBanTableExists();
      
      // Check ban status
      const { data, error } = await supabase
        .from('user_ban_status')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (error) {
        console.error('Error checking ban status:', error);
        return false;
      }
      
      return data && data.is_banned ? true : false;
    } catch (error) {
      console.error('Error in checkBanStatus:', error);
      return false;
    }
  };
  
  // Open ban user dialog with better handling
  const handleBanUser = async (userId: string, userName: string) => {
    try {
      // Ensure ban table exists
      await ensureBanTableExists();
      
      // Check current ban status
      const isBanned = await checkBanStatus(userId);
      
      setSelectedUserId(userId);
      setSelectedUserName(userName);
      setBanReason('');
      setBanDuration(isBanned ? 'unban' : 'permanent');
      setIsBanDialogOpen(true);
    } catch (error) {
      console.error('Error in handleBanUser:', error);
      toast({
        title: 'ত্রুটি',
        description: 'ব্যান স্ট্যাটাস চেক করতে সমস্যা হয়েছে',
        variant: 'destructive'
      });
    }
  };
  
  // Submit ban action
  const submitBanAction = async () => {
    if (!selectedUserId) return;
    
    try {
      setIsBanSubmitting(true);
      
      console.log('Processing ban action for user:', selectedUserId);
      console.log('Ban action details:', {
        banDuration,
        banReason,
        adminId: user?.id
      });
      
      // Try to ensure the user_ban_status table exists first
      try {
        console.log('Checking if ban table exists...');
        
        // Create ban table if it doesn't exist (simpler approach)
        const createBanTableSQL = `
          CREATE TABLE IF NOT EXISTS "public"."user_ban_status" (
            "user_id" UUID PRIMARY KEY,
            "is_banned" BOOLEAN DEFAULT FALSE,
            "banned_at" TIMESTAMP WITH TIME ZONE,
            "banned_by" TEXT,
            "ban_reason" TEXT,
            "ban_expires_at" TIMESTAMP WITH TIME ZONE,
            "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
            "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
          
          -- Enable RLS with permissive policy
          ALTER TABLE "public"."user_ban_status" ENABLE ROW LEVEL SECURITY;
          
          -- Create or replace policy
          DROP POLICY IF EXISTS "Allow all operations" ON "public"."user_ban_status";
          CREATE POLICY "Allow all operations" ON "public"."user_ban_status" USING (true);
        `;
        
        // Try to execute the SQL to create the table
        try {
          await supabase.rpc('exec_sql', { sql_query: createBanTableSQL });
        } catch (sqlError) {
          console.error('Failed to create ban table using RPC:', sqlError);
        }
      } catch (tableError) {
        console.error('Error checking ban table:', tableError);
      }
      
      if (banDuration === 'unban') {
        // Unban user
        console.log('Unbanning user...');
        
        try {
          // First try direct update
          const { error } = await supabase
            .from('user_ban_status')
            .update({ 
              is_banned: false,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', selectedUserId);
            
          if (error) {
            console.error('Error in unban update:', error);
            
            // If update fails, try to delete the ban record
            const { error: deleteError } = await supabase
              .from('user_ban_status')
              .delete()
              .eq('user_id', selectedUserId);
              
            if (deleteError) {
              console.error('Error in ban delete:', deleteError);
              throw deleteError;
            }
          }
          
          toast({
            title: 'ব্যবহারকারী আনব্যান করা হয়েছে',
            description: `${selectedUserName} এর ব্যান উঠিয়ে নেওয়া হয়েছে`
          });

          // Update reports with the new ban status
          setReports(prevReports => 
            prevReports.map(report => {
              if (report.reported_user_id === selectedUserId) {
                return {
                  ...report,
                  is_banned: false
                };
              }
              return report;
            })
          );

          // Update all reports for this user to "checked" status
          const { error: reportUpdateError } = await supabase
            .from('reports')
            .update({ 
              status: 'checked',
              admin_notes: adminNotes || `ইউজার আনব্যান করা হয়েছে - ${new Date().toLocaleString()}`,
              resolved_by: user?.id,
              resolved_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('reported_user_id', selectedUserId);
            
          if (reportUpdateError) {
            console.error('Error updating reports status:', reportUpdateError);
          }
        } catch (unbanError) {
          console.error('Failed to unban user:', unbanError);
          throw unbanError;
        }
      } else {
        console.log('Banning user...');
        // Calculate ban expiration date
        let banExpiresAt: string | null = null;
        
        switch (banDuration) {
          case '7days':
            banExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            break;
          case '30days':
            banExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
            break;
          case '90days':
            banExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
            break;
          case 'permanent':
            banExpiresAt = null;
            break;
          default:
            banExpiresAt = null;
        }
        
        console.log('Ban details:', {
          user_id: selectedUserId,
          is_banned: true,
          banned_at: new Date().toISOString(),
          banned_by: user?.id || 'unknown',
          ban_reason: banReason,
          ban_expires_at: banExpiresAt
        });
        
        // Try direct upsert approach
        try {
          // First try to get existing ban
          const { data: existingBan, error: checkError } = await supabase
            .from('user_ban_status')
            .select('*')
            .eq('user_id', selectedUserId)
            .maybeSingle();
            
            console.log('Existing ban check:', { existingBan, checkError });
            
            if (checkError && checkError.code !== 'PGRST116') {
              console.error('Error checking existing ban:', checkError);
            }
            
            if (existingBan) {
              // Update existing ban
              const { error: updateError } = await supabase
                .from('user_ban_status')
                .update({ 
                  is_banned: true,
                  banned_at: new Date().toISOString(),
                  banned_by: user?.id || 'unknown',
                  ban_reason: banReason,
                  ban_expires_at: banExpiresAt,
                  updated_at: new Date().toISOString()
                })
                .eq('user_id', selectedUserId);
                
              if (updateError) {
                console.error('Error updating ban:', updateError);
                throw updateError;
              }
            } else {
              // Create new ban with simpler structure
              const { error: insertError } = await supabase
                .from('user_ban_status')
                .insert({
                  user_id: selectedUserId,
                  is_banned: true,
                  banned_at: new Date().toISOString(),
                  banned_by: user?.id || 'unknown',
                  ban_reason: banReason || 'No reason provided',
                  ban_expires_at: banExpiresAt
                });
                
              if (insertError) {
                console.error('Error inserting ban:', insertError);
                
                // Try a direct RPC call as fallback
                try {
                  const insertSQL = `
                    INSERT INTO user_ban_status (user_id, is_banned, banned_at, banned_by, ban_reason, ban_expires_at) 
                    VALUES ('${selectedUserId}', true, now(), '${user?.id || "unknown"}', '${banReason?.replace(/'/g, "''")}', ${banExpiresAt ? `'${banExpiresAt}'` : 'null'})
                    ON CONFLICT (user_id) 
                    DO UPDATE SET 
                      is_banned = true, 
                      banned_at = now(), 
                      banned_by = '${user?.id || "unknown"}', 
                      ban_reason = '${banReason?.replace(/'/g, "''")}', 
                      ban_expires_at = ${banExpiresAt ? `'${banExpiresAt}'` : 'null'},
                      updated_at = now();
                  `;
                  
                  await supabase.rpc('exec_sql', { sql_query: insertSQL });
                } catch (rpcError) {
                  console.error('RPC fallback failed:', rpcError);
                  throw rpcError;
                }
              }
            }
            
            toast({
              title: 'ব্যবহারকারী ব্যান করা হয়েছে',
              description: `${selectedUserName} কে ব্যান করা হয়েছে`
            });

            // Update reports with the new ban status
            setReports(prevReports => 
              prevReports.map(report => {
                if (report.reported_user_id === selectedUserId) {
                  return {
                    ...report,
                    is_banned: true
                  };
                }
                return report;
              })
            );

            // Update all reports for this user to "checked" status
            const { error: reportUpdateError } = await supabase
              .from('reports')
              .update({ 
                status: 'checked',
                admin_notes: banReason ? `ব্যান করার কারণ: ${banReason} - ${new Date().toLocaleString()}` : `ইউজার ব্যান করা হয়েছে - ${new Date().toLocaleString()}`,
                resolved_by: user?.id,
                resolved_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('reported_user_id', selectedUserId);
              
            if (reportUpdateError) {
              console.error('Error updating reports status:', reportUpdateError);
            }
          } catch (banError) {
            console.error('Ban operation failed:', banError);
            throw banError;
          }
        }
        
        setIsBanDialogOpen(false);
        // Refresh reports to update ban status
        await fetchReports();
      } catch (error) {
        console.error('Error submitting ban action:', error);
        
        // More detailed error logging
        if (error instanceof Error) {
          console.error('Error details:', { 
            name: error.name, 
            message: error.message,
            stack: error.stack
          });
        }
        
        toast({
          title: 'ত্রুটি',
          description: 'ব্যান সেট করতে সমস্যা হয়েছে',
          variant: 'destructive'
        });
      } finally {
              setIsBanSubmitting(false);
    }
  };
  
  // Open report details dialog
  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    setAdminNotes(report.admin_notes || '');
    setReportStatus(report.status);
    setIsDetailsDialogOpen(true);
  };
  
  // Submit report update
  const submitReportUpdate = async () => {
    if (!selectedReport) return;
    
    try {
      setIsReportSubmitting(true);
      
      // Update report
      const { error } = await supabase
        .from('reports')
        .update({ 
          status: reportStatus,
          admin_notes: adminNotes,
          resolved_by: reportStatus !== 'pending' ? user?.id : null,
          resolved_at: reportStatus !== 'pending' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedReport.id);
        
      if (error) throw error;
      
      toast({
        title: 'রিপোর্ট আপডেট হয়েছে',
        description: 'রিপোর্ট স্ট্যাটাস সফলভাবে আপডেট করা হয়েছে'
      });
      
      setIsDetailsDialogOpen(false);
      // Refresh reports
      await fetchReports();
    } catch (error) {
      console.error('Error updating report:', error);
      toast({
        title: 'ত্রুটি',
        description: 'রিপোর্ট আপডেট করতে সমস্যা হয়েছে',
        variant: 'destructive'
      });
    } finally {
      setIsReportSubmitting(false);
    }
  };

  // Quick mark as checked
  const markAsChecked = async () => {
    if (!selectedReport) return;
    
    try {
      setIsReportSubmitting(true);
      
      // Update report to checked status
      const { error } = await supabase
        .from('reports')
        .update({ 
          status: 'checked',
          admin_notes: adminNotes || 'অ্যাডমিন কর্তৃক চেক করা হয়েছে',
          resolved_by: user?.id,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedReport.id);
        
      if (error) throw error;
      
      toast({
        title: 'রিপোর্ট চেক করা হয়েছে',
        description: 'রিপোর্ট স্ট্যাটাস "চেকড" করা হয়েছে'
      });
      
      setIsDetailsDialogOpen(false);
      // Refresh reports
      await fetchReports();
    } catch (error) {
      console.error('Error marking report as checked:', error);
      toast({
        title: 'ত্রুটি',
        description: 'রিপোর্ট আপডেট করতে সমস্যা হয়েছে',
        variant: 'destructive'
      });
    } finally {
      setIsReportSubmitting(false);
    }
  };

  // Handle tab change with loading state
  const handleTabChange = (value: string) => {
    setIsTabChanging(true);
    setActiveTab(value);
    
    // Short timeout to show loading state
    setTimeout(() => {
      setIsTabChanging(false);
    }, 300);
  };

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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              ইউজার রিপোর্ট ম্যানেজমেন্ট
            </h1>
            <p className="text-gray-600 mt-1">ব্যবহারকারীদের রিপোর্ট দেখুন এবং ম্যানেজ করুন</p>
          </div>
          
          <Button onClick={fetchReports} variant="outline" disabled={isRefreshing} className="gap-2">
            {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            রিফ্রেশ
          </Button>
        </div>
        
        {/* Tabs and Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-6">
              <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all" className="flex items-center justify-center gap-2">
                    সকল রিপোর্ট
                    <Badge variant="secondary" className="ml-1">{totalCount}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="flex items-center justify-center gap-2">
                    পেন্ডিং
                    <Badge variant="secondary" className="ml-1">{pendingCount}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="checked" className="flex items-center justify-center gap-2">
                    চেকড
                    <Badge variant="secondary" className="ml-1">{checkedCount}</Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="w-full">
                <Input
                  placeholder="ব্যবহারকারীর নাম বা বিবরণ দিয়ে সার্চ করুন"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Reports Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-1">
              <CardTitle>রিপোর্ট তালিকা</CardTitle>
              <p className="text-sm text-muted-foreground">
                {activeTab === 'all' ? 
                  'সকল রিপোর্ট দেখানো হচ্ছে। ব্যবহারকারীকে ব্যান করলে রিপোর্টের স্ট্যাটাস স্বয়ংক্রিয়ভাবে "চেকড" হয়ে যাবে।' : 
                activeTab === 'pending' ? 
                  'শুধুমাত্র পেন্ডিং রিপোর্ট দেখানো হচ্ছে। এগুলি রিভিউ করে ব্যবহারকারীকে ব্যান করুন বা স্ট্যাটাস আপডেট করুন।' : 
                  'চেক করা রিপোর্ট দেখানো হচ্ছে। এগুলি ইতিমধ্যে রিভিউ করা হয়েছে।'}
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {isTabChanging ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-gray-600">লোড হচ্ছে...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>রিপোর্ট করা হয়েছে</TableHead>
                    <TableHead>রিপোর্ট করেছেন</TableHead>
                    <TableHead>কারণ</TableHead>
                    <TableHead>তারিখ</TableHead>
                    <TableHead>স্ট্যাটাস</TableHead>
                    <TableHead className="text-right">অ্যাকশন</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          {activeTab === 'all' ? (
                            <>
                              <AlertTriangle className="h-10 w-10 text-gray-400" />
                              <p>কোন রিপোর্ট পাওয়া যায়নি</p>
                            </>
                          ) : activeTab === 'pending' ? (
                            <>
                              <Clock className="h-10 w-10 text-gray-400" />
                              <p>কোন পেন্ডিং রিপোর্ট নেই</p>
                              <p className="text-sm text-muted-foreground">সব রিপোর্ট চেক করা হয়েছে</p>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-10 w-10 text-gray-400" />
                              <p>কোন চেকড রিপোর্ট নেই</p>
                              <p className="text-sm text-muted-foreground">এখনো কোন রিপোর্ট চেক করা হয়নি</p>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8 rounded-full">
                              <AvatarImage src={report.reported_user?.avatar_url || '/placeholder.svg'} />
                              <AvatarFallback className="bg-primary/10">
                                {report.reported_user?.name.substring(0, 2) || 'NN'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{report.reported_user?.name}</p>
                              {report.is_banned && (
                                <Badge className="bg-red-500 text-white border-0 text-xs">ব্যান করা হয়েছে</Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8 rounded-full">
                              <AvatarImage src={report.reporter?.avatar_url || '/placeholder.svg'} />
                              <AvatarFallback className="bg-primary/10">
                                {report.reporter?.name.substring(0, 2) || 'NN'}
                              </AvatarFallback>
                            </Avatar>
                            <p className="text-sm">{report.reporter?.name}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">{report.reason}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-500">
                            {format(new Date(report.created_at), 'yyyy-MM-dd HH:mm')}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusColors[report.status]} text-white border-0`}>
                            {statusIcons[report.status]}
                            {report.status === 'pending' ? 'পেন্ডিং' : 
                             report.status === 'resolved' ? 'সমাধান করা হয়েছে' : 
                             report.status === 'checked' ? 'চেকড' : 'বাতিল করা হয়েছে'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>অ্যাকশনস</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleViewReport(report)}>
                                বিস্তারিত দেখুন
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleBanUser(
                                  report.reported_user_id, 
                                  report.reported_user?.name || 'অজানা ব্যবহারকারী'
                                )}
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                {report.is_banned ? 'আনব্যান করুন' : 'ব্যবহারকারী ব্যান করুন'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
        {/* Ban User Dialog */}
        <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-red-500" />
                {banDuration === 'unban' ? 'ব্যবহারকারী আনব্যান করুন' : 'ব্যবহারকারী ব্যান করুন'}
              </DialogTitle>
              <DialogDescription>
                {banDuration === 'unban' ? 
                  `${selectedUserName} এর ব্যান উঠিয়ে নিন` :
                  `${selectedUserName} কে ব্যান করতে চান?`
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {banDuration !== 'unban' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">ব্যান সময়সীমা:</label>
                    <Select value={banDuration} onValueChange={setBanDuration}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7days">৭ দিন</SelectItem>
                        <SelectItem value="30days">৩০ দিন</SelectItem>
                        <SelectItem value="90days">৯০ দিন</SelectItem>
                        <SelectItem value="permanent">স্থায়ী ব্যান</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">ব্যান কারণ:</label>
                    <Textarea
                      placeholder="ব্যবহারকারীকে ব্যান করার কারণ লিখুন..."
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsBanDialogOpen(false)}
                disabled={isBanSubmitting}
              >
                বাতিল
              </Button>
              <Button
                variant={banDuration === 'unban' ? 'default' : 'destructive'}
                onClick={submitBanAction}
                disabled={isBanSubmitting || (!banReason && banDuration !== 'unban')}
              >
                {isBanSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    প্রসেস হচ্ছে...
                  </>
                ) : banDuration === 'unban' ? (
                  'আনব্যান করুন'
                ) : (
                  'ব্যান করুন'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Report Details Dialog */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>রিপোর্ট বিবরণ</DialogTitle>
              <DialogDescription>
                রিপোর্টের বিস্তারিত তথ্য এবং স্ট্যাটাস আপডেট করুন
              </DialogDescription>
            </DialogHeader>
            
            {selectedReport && (
              <div className="space-y-4 py-3">
                <div className="flex flex-col md:flex-row gap-4 pb-3 border-b">
                  <div className="md:w-1/2">
                    <h4 className="font-medium text-sm text-gray-500 mb-1">রিপোর্ট করা হয়েছে:</h4>
                    <div 
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded-md transition-colors mb-2"
                      onClick={() => window.open(`/profile/${selectedReport.reported_user_id}`, '_blank')}
                      title="প্রোফাইল দেখুন (নতুন ট্যাবে)"
                    >
                      <Avatar className="h-8 w-8 rounded-full">
                        <AvatarImage src={selectedReport.reported_user?.avatar_url || '/placeholder.svg'} />
                        <AvatarFallback className="bg-primary/10">
                          {selectedReport.reported_user?.name.substring(0, 2) || 'NN'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-blue-600 hover:text-blue-800">{selectedReport.reported_user?.name}</span>
                    </div>
                    <div>
                      <h5 className="font-medium text-xs text-gray-500 mb-1">UUID:</h5>
                      <p className="text-xs text-gray-600 font-mono bg-gray-50 p-2 rounded border break-all">{selectedReport.reported_user_id}</p>
                    </div>
                  </div>
                  
                  <div className="md:w-1/2">
                    <h4 className="font-medium text-sm text-gray-500 mb-1">রিপোর্ট করেছেন:</h4>
                    <div 
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded-md transition-colors mb-2"
                      onClick={() => window.open(`/profile/${selectedReport.reporter_id}`, '_blank')}
                      title="প্রোফাইল দেখুন (নতুন ট্যাবে)"
                    >
                      <Avatar className="h-8 w-8 rounded-full">
                        <AvatarImage src={selectedReport.reporter?.avatar_url || '/placeholder.svg'} />
                        <AvatarFallback className="bg-primary/10">
                          {selectedReport.reporter?.name.substring(0, 2) || 'NN'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-blue-600 hover:text-blue-800">{selectedReport.reporter?.name}</span>
                    </div>
                    <div>
                      <h5 className="font-medium text-xs text-gray-500 mb-1">UUID:</h5>
                      <p className="text-xs text-gray-600 font-mono bg-gray-50 p-2 rounded border break-all">{selectedReport.reporter_id}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm text-gray-500 mb-1">রিপোর্টের কারণ:</h4>
                    <p className="font-medium text-sm">{selectedReport.reason}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm text-gray-500 mb-1">বিস্তারিত বর্ণনা:</h4>
                    <p className="text-sm border rounded-md p-2 bg-gray-50 max-h-20 overflow-y-auto">{selectedReport.details || 'কোন বিস্তারিত বর্ণনা নেই'}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm text-gray-500 mb-1">রিপোর্ট তারিখ:</h4>
                    <p className="text-sm">{format(new Date(selectedReport.created_at), 'yyyy-MM-dd HH:mm')}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-500 mb-1">রিপোর্ট স্ট্যাটাস:</h4>
                    <Select value={reportStatus} onValueChange={(value: any) => setReportStatus(value)}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">পেন্ডিং</SelectItem>
                        <SelectItem value="resolved">সমাধান করা হয়েছে</SelectItem>
                        <SelectItem value="dismissed">বাতিল করা হয়েছে</SelectItem>
                        <SelectItem value="checked">চেকড</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-500 mb-1">এডমিন নোট:</h4>
                    <Textarea
                      placeholder="এই রিপোর্ট সম্পর্কে আপনার নোট লিখুন..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsDetailsDialogOpen(false)}
                disabled={isReportSubmitting}
              >
                বাতিল
              </Button>
              
              <div className="flex gap-2">
                {selectedReport && selectedReport.status === 'pending' && (
                  <Button
                    variant="secondary"
                    onClick={markAsChecked}
                    disabled={isReportSubmitting}
                    className="mb-2 sm:mb-0"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    চেকড হিসেবে মার্ক করুন
                  </Button>
                )}
                
                <Button
                  variant="default"
                  onClick={submitReportUpdate}
                  disabled={isReportSubmitting}
                  className="mb-2 sm:mb-0"
                >
                  {isReportSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      প্রসেস হচ্ছে...
                    </>
                  ) : (
                    'আপডেট করুন'
                  )}
                </Button>
                
                {selectedReport && (
                  <Button
                    variant={selectedReport.is_banned ? "default" : "destructive"}
                    onClick={() => handleBanUser(
                      selectedReport.reported_user_id,
                      selectedReport.reported_user?.name || 'অজানা ব্যবহারকারী'
                    )}
                    disabled={isReportSubmitting}
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    {selectedReport.is_banned ? 'আনব্যান করুন' : 'ব্যান করুন'}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminReportsPage; 