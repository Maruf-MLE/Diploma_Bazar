import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Search, Loader2, BookOpen } from 'lucide-react';
import { BookEntity, getBooks } from '@/lib/BookEntity';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { useNavigate } from 'react-router-dom';

interface AvailableBooksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sellerId?: string;
}

const AvailableBooksDialog = ({ open, onOpenChange, sellerId }: AvailableBooksDialogProps) => {
  const [books, setBooks] = useState<BookEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  
  useEffect(() => {
    if (open) {
      fetchBooks();
    }
  }, [open]);
  
  const fetchBooks = async () => {
    setLoading(true);
    try {
      // If sellerId is provided, we'll fetch only that seller's books
      const filter = sellerId ? { seller_id: sellerId } : {};
      const { data, error } = await getBooks(filter, 50, 0);
      
      if (error) throw error;
      
      setBooks(data || []);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleBookSelect = (book: BookEntity) => {
    // Close the available books dialog
    onOpenChange(false);
    // Navigate to the book details page with purchase_request parameter
    navigate(`/book/${book.id}?purchase_request=true`);
  };
  
  const filteredBooks = searchTerm 
    ? books.filter(book => 
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        book.author.toLowerCase().includes(searchTerm.toLowerCase()))
    : books;
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">বই পছন্দ করুন</DialogTitle>
          </DialogHeader>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="বইয়ের নাম বা লেখকের নাম লিখুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <ScrollArea className="h-[60vh]">
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredBooks.length > 0 ? (
              <div className="space-y-3 pr-2">
                {filteredBooks.map((book) => (
                  <Card 
                    key={book.id} 
                    className="cursor-pointer transition-all hover:shadow-md"
                    onClick={() => handleBookSelect(book)}
                  >
                    <CardContent className="p-3">
                      <div className="flex gap-3">
                        <div className="w-16 h-20 bg-muted rounded flex items-center justify-center overflow-hidden">
                          {book.cover_image_url ? (
                            <img 
                              src={book.cover_image_url} 
                              alt={book.title} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <BookOpen className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground">{book.title}</h3>
                          <p className="text-sm text-muted-foreground">{book.author}</p>
                          
                          <div className="flex justify-between items-center mt-2">
                            <p className="text-lg font-bold text-primary">৳{book.price}</p>
                            <Badge variant="outline">
                              {book.condition === 'new' ? 'নতুন' :
                               book.condition === 'like_new' ? 'নতুনের মতো' :
                               book.condition === 'good' ? 'ভালো' :
                               book.condition === 'acceptable' ? 'মোটামুটি' : 'পুরনো'}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={book.seller_avatar_url} />
                                <AvatarFallback className="text-xs">
                                  {book.seller_name ? book.seller_name.charAt(0) : 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground">{book.seller_name}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-2 opacity-50" />
                <p className="text-muted-foreground">কোন বই পাওয়া যায়নি</p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AvailableBooksDialog; 