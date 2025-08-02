import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, AlertTriangle } from 'lucide-react';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  transactionId?: string; // Add optional transactionId parameter
  onReportSubmit?: () => void;
}

const reportReasons = [
  { id: 'fake_profile', label: 'ভুয়া প্রোফাইল' },
  { id: 'inappropriate_behavior', label: 'অনুপযুক্ত আচরণ' },
  { id: 'scam', label: 'প্রতারণা' },
  { id: 'fake_books', label: 'ভুয়া বই বিক্রয়' },
  { id: 'other', label: 'অন্যান্য' }
];

const ReportDialog = ({ open, onOpenChange, userId, userName, transactionId, onReportSubmit }: ReportDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'লগইন প্রয়োজন',
        description: 'রিপোর্ট করতে লগইন করুন',
        variant: 'destructive'
      });
      return;
    }
    
    if (!reason) {
      toast({
        title: 'কারণ প্রয়োজন',
        description: 'অনুগ্রহ করে একটি রিপোর্টের কারণ নির্বাচন করুন',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      console.log('Submitting report with data:', {
        reported_user_id: userId,
        reporter_id: user?.id,
        reason,
        details
      });
      
      // Check if the reports table exists
      try {
        const { count, error: countError } = await supabase
          .from('reports')
          .select('*', { count: 'exact', head: true });
          
        console.log('Table check result:', { count, error: countError });
        
        if (countError) {
          console.error('Reports table might not exist:', countError);
          
          // Try to create the table via a temporary solution
          const { data: createResult, error: createError } = await supabase
            .rpc('create_reports_table_simple', {}, { count: 'exact' });
            
          console.log('Table creation attempt:', { createResult, createError });
          
          if (createError) {
            console.error('Failed to create reports table:', createError);
          }
        }
      } catch (tableError) {
        console.error('Error checking reports table:', tableError);
      }
      
      // Insert report into database with more detailed logging
      const { data, error } = await supabase
        .from('reports')
        .insert({
          reported_user_id: userId,
          reporter_id: user.id,
          reason: reason,
          details: details,
          status: 'pending',
          transaction_id: transactionId // Include the transaction ID if provided
        })
        .select();
      
      console.log('Insert result:', { data, error });
      
      if (error) {
        // If we get a relation doesn't exist error, try a fallback approach
        if (error.message && error.message.includes('relation "reports" does not exist')) {
          console.log('Reports table does not exist, using fallback notification');
          
          // Create a notification for admins instead
          const { error: notifError } = await supabase
            .from('notifications')
            .insert({
              user_id: null, // Will be seen by admins
              message: `REPORT: ${userName} reported by ${user.id} for ${reason}`,
              related_user_id: userId,
              sender_id: user.id,
              type: 'report',
              data: { 
                reason, 
                details,
                reported_user_id: userId,
                reporter_id: user.id
              }
            });
          
          if (notifError) {
            console.error('Fallback notification failed:', notifError);
            throw notifError;
          }
          
          console.log('Used notification fallback for report');
        } else {
          throw error;
        }
      }
      
      toast({
        title: 'রিপোর্ট সাবমিট হয়েছে',
        description: 'আপনার রিপোর্ট সফলভাবে সাবমিট হয়েছে। আমরা শীঘ্রই পর্যালোচনা করব।',
      });
      
      // Reset form
      setReason('');
      setDetails('');
      
      // Close dialog
      onOpenChange(false);
      
      // Call callback if provided
      if (onReportSubmit) {
        onReportSubmit();
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      
      // Log detailed error info
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      
      toast({
        title: 'ত্রুটি',
        description: 'রিপোর্ট সাবমিট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-xl">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            ব্যবহারকারী রিপোর্ট করুন
          </DialogTitle>
          <DialogDescription className="text-center">
            {userName || 'ব্যবহারকারী'}-কে রিপোর্ট করার কারণ জানান
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Report Reason */}
          <div className="space-y-3">
            <h4 className="font-medium">রিপোর্টের কারণ:</h4>
            <RadioGroup value={reason} onValueChange={setReason}>
              {reportReasons.map((item) => (
                <div key={item.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={item.id} id={item.id} />
                  <Label htmlFor={item.id}>{item.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          {/* Additional Details */}
          <div className="space-y-2">
            <h4 className="font-medium">অতিরিক্ত বিবরণ:</h4>
            <Textarea
              placeholder="বিস্তারিত লিখুন..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              বাতিল
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting || !reason}
              variant="destructive"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  সাবমিট হচ্ছে...
                </>
              ) : (
                'রিপোর্ট করুন'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog; 