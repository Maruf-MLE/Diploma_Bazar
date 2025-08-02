import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardFooter } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { Badge } from './ui/badge';
import { BookOpen, DollarSign, Calendar, MapPin, Star, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';
import RatingDialog from './RatingDialog';
import { useToast } from '@/hooks/use-toast';

interface PurchaseHistory {
  id: string;
  book_id: string;
  buyer_id: string;
  seller_id: string;
  price: number;
  purchase_date: string;
  meetup_location: string;
  meetup_date: string;
  book_title: string;
  book_author: string;
  book_cover_image_url?: string;
  buyer_has_reviewed?: boolean;
  seller_has_reviewed?: boolean;
  type?: 'purchase_history' | 'marked_as_sold';
}

interface PurchaseHistoryListProps {
  userId: string;
  viewType: 'all' | 'purchases' | 'sales';
}

const PurchaseHistoryList: React.FC<PurchaseHistoryListProps> = ({ userId, viewType = 'all' }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [purchases, setPurchases] = useState<PurchaseHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseHistory | null>(null);

  useEffect(() => {
    const fetchPurchaseHistory = async () => {
      try {
        setLoading(true);
        
        // Fetch regular purchase history
        let query = supabase
          .from('purchase_history')
          .select('*');
        
        // Filter based on viewType
        if (viewType === 'purchases') {
          query = query.eq('buyer_id', userId);
        } else if (viewType === 'sales') {
          query = query.eq('seller_id', userId);
        } else {
          // 'all' - both purchases and sales
          query = query.or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);
        }
        
        // Order by most recent first
        query = query.order('purchase_date', { ascending: false });
        
        const { data: purchaseData, error } = await query;
        
        if (error) throw error;
        
        let allTransactions: PurchaseHistory[] = (purchaseData || []).map(item => ({
          ...item,
          type: 'purchase_history'
        }));
        
        // If we're showing sales, also fetch books marked as sold
        if (viewType === 'sales' || viewType === 'all') {
          const { data: soldBooksData, error: soldBooksError } = await supabase
            .from('books')
            .select('*')
            .eq('seller_id', userId)
            .eq('status', 'sold');
            
          if (soldBooksError) {
            console.error('Error fetching sold books:', soldBooksError);
          } else if (soldBooksData && soldBooksData.length > 0) {
            // Convert sold books to the same format as purchase history
            const soldBooksTransactions: PurchaseHistory[] = soldBooksData.map(book => ({
              id: book.id,
              book_id: book.id,
              buyer_id: '', // Unknown buyer
              seller_id: book.seller_id,
              price: book.price,
              purchase_date: book.updated_at || book.created_at,
              meetup_location: book.location || 'অজানা',
              meetup_date: book.updated_at || book.created_at,
              book_title: book.title,
              book_author: book.author,
              book_cover_image_url: book.cover_image_url,
              type: 'marked_as_sold'
            }));
            
            // Combine both types of transactions
            allTransactions = [...allTransactions, ...soldBooksTransactions];
            
            // Sort by date
            allTransactions.sort((a, b) => 
              new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime()
            );
          }
        }
        
        setPurchases(allTransactions);
      } catch (error) {
        console.error('Error fetching purchase history:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchPurchaseHistory();
    }
  }, [userId, viewType]);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'PPP', { locale: bn });
    } catch (error) {
      return dateStr;
    }
  };
  
  // রেটিং দেওয়ার ফাংশন
  const handleRating = (purchase: PurchaseHistory) => {
    if (!user) {
      toast({
        title: 'লগইন প্রয়োজন',
        description: 'রেটিং দিতে লগইন করুন',
        variant: 'destructive'
      });
      return;
    }
    
    // Don't allow rating for books that were just marked as sold
    if (purchase.type === 'marked_as_sold') {
      toast({
        title: 'রেটিং দেওয়া যাবে না',
        description: 'শুধুমাত্র সম্পন্ন লেনদেনের জন্য রেটিং দেওয়া যাবে',
        variant: 'destructive'
      });
      return;
    }
    
    setSelectedPurchase(purchase);
    setIsRatingDialogOpen(true);
  };
  
  // ইউজার কি ক্রেতা নাকি বিক্রেতা তা চেক করি
  const isBuyer = (purchase: PurchaseHistory) => purchase.buyer_id === userId;
  
  // ইউজার আগে রেটিং দিয়েছে কিনা চেক করি
  const hasAlreadyReviewed = (purchase: PurchaseHistory) => {
    if (purchase.type === 'marked_as_sold') return true; // Can't review these
    if (isBuyer(purchase)) {
      return purchase.buyer_has_reviewed;
    } else {
      return purchase.seller_has_reviewed;
    }
  };
  
  // রেটিং সাবমিট করার পর পারচেজ লিস্ট আপডেট করি
  const handleRatingSubmit = async (purchaseId: string, isBuyerReview: boolean) => {
    // আপডেট করা পারচেজ লিস্ট ফেচ করি
    const { data, error } = await supabase
      .from('purchase_history')
      .select('*')
      .eq('id', purchaseId)
      .single();
      
    if (error) {
      console.error('Error fetching updated purchase:', error);
      return;
    }
    
    if (data) {
      // পারচেজ লিস্ট আপডেট করি
      setPurchases(prevPurchases => 
        prevPurchases.map(p => 
          p.id === purchaseId ? data : p
        )
      );
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <Skeleton className="h-20 w-16" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className="text-center py-8">
        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">
          {viewType === 'purchases' 
            ? 'আপনি এখনও কোনো বই কেনেননি' 
            : viewType === 'sales'
            ? 'আপনি এখনও কোনো বই বিক্রি করেননি'
            : 'কোনো লেনদেন ইতিহাস নেই'}
        </h3>
        <p className="text-muted-foreground">
          {viewType === 'purchases'
            ? 'আপনার প্রয়োজনীয় বই খুঁজুন'
            : viewType === 'sales'
            ? 'বই বিক্রি করুন'
            : 'আপনার কেনাবেচার ইতিহাস এখানে দেখানো হবে'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {purchases.map((purchase) => (
          <Card key={purchase.id} className="overflow-hidden bg-[#F8FBFF]">
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <img 
                    src={purchase.book_cover_image_url || '/placeholder.svg'} 
                    alt={purchase.book_title}
                    className="h-24 w-20 object-cover rounded"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-md">{purchase.book_title}</h3>
                    <Badge className={
                      purchase.type === 'marked_as_sold' 
                        ? 'bg-purple-500' 
                        : purchase.buyer_id === userId 
                          ? 'bg-blue-500' 
                          : 'bg-green-500'
                    }>
                      {purchase.type === 'marked_as_sold' 
                        ? 'বিক্রিত' 
                        : purchase.buyer_id === userId 
                          ? 'কিনেছেন' 
                          : 'বিক্রি করেছেন'}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">{purchase.book_author}</p>
                  
                  <div className="text-sm flex items-center">
                    <DollarSign className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    <span>মূল্য: ৳{purchase.price}</span>
                  </div>
                  
                  <div className="text-sm flex items-center">
                    <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    <span>
                      {purchase.type === 'marked_as_sold' ? 'বিক্রির তারিখ: ' : 'ক্রয়ের তারিখ: '}
                      {formatDate(purchase.purchase_date)}
                    </span>
                  </div>
                  
                  {purchase.type !== 'marked_as_sold' && (
                  <div className="text-sm flex items-center">
                    <MapPin className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    <span>স্থান: {purchase.meetup_location}</span>
                  </div>
                  )}
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="p-3 pt-0 border-t">
              <div className="w-full flex justify-end">
                {purchase.type !== 'marked_as_sold' ? (
                <Button
                  variant="rating-button"
                  size="sm"
                  className={hasAlreadyReviewed(purchase) ? 'opacity-50 cursor-not-allowed' : ''}
                  onClick={() => handleRating(purchase)}
                  disabled={hasAlreadyReviewed(purchase)}
                >
                  <Star className="h-4 w-4 mr-1" /> 
                  {hasAlreadyReviewed(purchase) 
                    ? 'রেটিং দেওয়া হয়েছে' 
                    : isBuyer(purchase) 
                      ? 'বিক্রেতাকে রেটিং দিন' 
                      : 'ক্রেতাকে রেটিং দিন'}
                </Button>
                ) : (
                  <Badge variant="outline" className="text-purple-500 border-purple-200">
                    <ShoppingBag className="h-3 w-3 mr-1" /> মার্কেটপ্লেস থেকে সরানো হয়েছে
                  </Badge>
                )}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {selectedPurchase && (
        <RatingDialog
          open={isRatingDialogOpen}
          onOpenChange={setIsRatingDialogOpen}
          sellerId={isBuyer(selectedPurchase) ? selectedPurchase.seller_id : selectedPurchase.buyer_id}
          sellerName={isBuyer(selectedPurchase) ? 'বিক্রেতা' : 'ক্রেতা'}
          purchaseId={selectedPurchase.id}
          isBuyerReview={isBuyer(selectedPurchase)}
          isSellerReview={!isBuyer(selectedPurchase)}
          onRatingSubmit={() => handleRatingSubmit(selectedPurchase.id, isBuyer(selectedPurchase))}
        />
      )}
    </>
  );
};

export default PurchaseHistoryList; 