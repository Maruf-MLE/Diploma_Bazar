import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { BookEntity, updateBook, uploadBookImage } from '@/lib/BookEntity';
import { X, Check, Loader2, Upload, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';

// Book condition options
const bookConditions = [
  { value: 'new', label: 'নতুন' },
  { value: 'like_new', label: 'নতুনের মতো' },
  { value: 'good', label: 'ভালো' },
  { value: 'acceptable', label: 'মোটামুটি' },
  { value: 'poor', label: 'পুরনো' }
];

interface BookEditDialogProps {
  book: BookEntity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookUpdated: (updatedBook: BookEntity) => void;
}

const BookEditDialog: React.FC<BookEditDialogProps> = ({
  book,
  open,
  onOpenChange,
  onBookUpdated
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  
  // State for validation errors
  const [validationError, setValidationError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<Partial<BookEntity>>({
    title: book?.title || '',
    author: book?.author || '',
    description: book?.description || '',
    price: book?.price || 0,
    condition: book?.condition || 'good',
    condition_description: book?.condition_description || '',
    category: book?.category || 'academic',
    semester: book?.semester || '',
    department: book?.department || '',
    institute_name: book?.institute_name || '',
    location: book?.location || '',
    is_negotiable: book?.is_negotiable !== undefined ? book.is_negotiable : true,
    status: book?.status || 'available'
  });
  
  // Cover image preview
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(
    book?.cover_image_url || null
  );
  
  // Check if user can edit this book
  useEffect(() => {
    if (book && user) {
      // Check if the user is the seller
      const isOwner = book.seller_id === user.id;
      
      // Check if the book is available or pending (not sold)
      const isEditable = book.status === 'available' || book.status === 'pending';
      
      // Set validation error if conditions aren't met
      if (!isOwner) {
        setValidationError('আপনি শুধুমাত্র আপনার নিজের বই এডিট করতে পারবেন।');
        setCanEdit(false);
      } else if (!isEditable) {
        setValidationError('বিক্রিত বই এডিট করা যাবে না। শুধুমাত্র বিক্রয়যোগ্য বই এডিট করা যাবে।');
        setCanEdit(false);
      } else {
        setValidationError(null);
        setCanEdit(true);
      }
    }
  }, [book, user]);
  
  // Reset form when book changes
  React.useEffect(() => {
    if (book) {
      setFormData({
        title: book.title || '',
        author: book.author || '',
        description: book.description || '',
        price: book.price || 0,
        condition: book.condition || 'good',
        condition_description: book.condition_description || '',
        category: book.category || 'academic',
        semester: book.semester || '',
        department: book.department || '',
        institute_name: book.institute_name || '',
        location: book.location || '',
        is_negotiable: book.is_negotiable !== undefined ? book.is_negotiable : true,
        status: book.status || 'available'
      });
      setCoverImagePreview(book.cover_image_url || null);
    }
  }, [book]);
  
  // Handle text input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || 0 : value
    }));
  };
  
  // Handle select input changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle checkbox changes
  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  // Handle cover image upload
  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !book || !canEdit) return;
    
    try {
      setUploadingCover(true);
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "ত্রুটি",
          description: "ফাইল সাইজ 5MB এর বেশি হতে পারবে না",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
        toast({
          title: "ত্রুটি",
          description: "শুধুমাত্র JPEG, PNG, WebP ফাইল আপলোড করা যাবে",
          variant: "destructive",
        });
        return;
      }
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Upload to Supabase
      const { data: imageUrl, error } = await uploadBookImage(book.id, file, true);
      
      if (error) throw error;
      
      if (imageUrl) {
        setFormData(prev => ({
          ...prev,
          cover_image_url: imageUrl
        }));
        
        toast({
          title: "সফল",
          description: "কভার ছবি আপডেট হয়েছে",
        });
      }
    } catch (error) {
      console.error('Error uploading cover image:', error);
      toast({
        title: "ত্রুটি",
        description: "ছবি আপলোড করতে ব্যর্থ হয়েছে",
        variant: "destructive",
      });
    } finally {
      setUploadingCover(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!book || !canEdit) return;
    
    try {
      setIsSubmitting(true);
      
      // Validate required fields
      const requiredFields = ['title', 'author', 'description', 'condition', 'price'];
      const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
      
      if (missingFields.length > 0) {
        toast({
          title: "ত্রুটি",
          description: "সব প্রয়োজনীয় তথ্য পূরণ করুন।",
          variant: "destructive",
        });
        return;
      }
      
      // Create a clean update object without restricted fields
      const updatesData: Partial<BookEntity> = {
        title: formData.title,
        author: formData.author,
        description: formData.description,
        price: formData.price,
        condition: formData.condition,
        condition_description: formData.condition_description,
        semester: formData.semester,
        location: formData.location,
        is_negotiable: formData.is_negotiable,
        cover_image_url: formData.cover_image_url,
      };
      
      // Update book in database
      const { data, error } = await updateBook(book.id, updatesData);
      
      if (error) throw error;
      
      if (data) {
        toast({
          title: "সফল",
          description: "বইয়ের তথ্য আপডেট হয়েছে",
        });
        
        // Pass updated book to parent component
        onBookUpdated(data);
        
        // Close dialog
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error updating book:', error);
      toast({
        title: "ত্রুটি",
        description: "বইয়ের তথ্য আপডেট করতে ব্যর্থ হয়েছে",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>বই এডিট করুন</DialogTitle>
          <DialogDescription>
            বইয়ের তথ্য আপডেট করুন। সম্পন্ন হলে সেভ বাটনে ক্লিক করুন।
          </DialogDescription>
        </DialogHeader>
        
        {validationError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>এডিট করা সম্ভব নয়</AlertTitle>
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col items-center gap-2">
              <Label>কভার ছবি</Label>
              <div className="relative w-40 h-60 bg-muted rounded-md overflow-hidden">
                {coverImagePreview ? (
                  <img 
                    src={coverImagePreview} 
                    alt="Book cover" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                    কোনো ছবি নেই
                  </div>
                )}
                
                <Button
                  type="button"
                  size="sm"
                  className="absolute bottom-2 right-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingCover || !canEdit}
                >
                  {uploadingCover ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleCoverImageUpload}
                  className="hidden"
                  accept="image/jpeg, image/png, image/jpg, image/webp"
                  disabled={!canEdit}
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="title" className="text-sm font-medium text-slate-800">
                বইয়ের নাম *
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                disabled={!canEdit}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description" className="text-sm font-medium text-slate-800">
                বই সমূহ *
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                required
                disabled={!canEdit}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="price" className="text-sm font-medium text-slate-800">
                মূল্য (টাকা) *
              </Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleInputChange}
                required
                disabled={!canEdit}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="condition" className="text-sm font-medium text-slate-800">
                বইয়ের অবস্থা *
              </Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) => handleSelectChange('condition', value)}
                disabled={!canEdit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="অবস্থা নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {bookConditions.map((condition) => (
                      <SelectItem key={condition.value} value={condition.value}>
                        {condition.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="condition_description">বইয়ের অবস্থার বিবরণ</Label>
              <Textarea
                id="condition_description"
                name="condition_description"
                value={formData.condition_description}
                onChange={handleInputChange}
                rows={2}
                placeholder="বইয়ের অবস্থা সম্পর্কে আরও বিস্তারিত লিখুন (ঐচ্ছিক)"
                disabled={!canEdit}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="department">বিভাগ</Label>
                <Input
                  id="department"
                  name="department"
                  value={formData.department}
                  placeholder="ঐচ্ছিক"
                  disabled={true}
                  className="bg-muted/50"
                />
                {canEdit && (
                  <p className="text-xs text-muted-foreground">বিভাগ পরিবর্তন করা যাবে না</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="semester">সেমিস্টার</Label>
                <Input
                  id="semester"
                  name="semester"
                  value={formData.semester}
                  onChange={handleInputChange}
                  placeholder="ঐচ্ছিক"
                  disabled={!canEdit}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="institute_name">প্রতিষ্ঠান</Label>
                <Input
                  id="institute_name"
                  name="institute_name"
                  value={formData.institute_name}
                  placeholder="ঐচ্ছিক"
                  disabled={true}
                  className="bg-muted/50"
                />
                {canEdit && (
                  <p className="text-xs text-muted-foreground">প্রতিষ্ঠান পরিবর্তন করা যাবে না</p>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              <X className="mr-2 h-4 w-4" />
              বাতিল
            </Button>
            <Button type="submit" disabled={isSubmitting || !canEdit}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  সেভ হচ্ছে...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  সেভ করুন
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookEditDialog; 