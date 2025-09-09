import React, { useState, useEffect } from 'react';
import { Bell, Check, Loader2, Trash2, X, AlertCircle, RefreshCw, WifiOff, ShoppingBag, CreditCard, BookOpen, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

import { useNotifications } from '@/contexts/NotificationContext';
import { deleteNotification, handleNotificationClick } from '@/lib/NotificationService';
import { useToast } from '@/hooks/use-toast';

const NotificationDropdown = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, refreshNotifications, connectionStatus, error } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [manualRefresh, setManualRefresh] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Debug logs
  useEffect(() => {
    console.log('NotificationDropdown - Current notifications:', notifications);
    console.log('NotificationDropdown - Unread count:', unreadCount);
  }, [notifications, unreadCount]);

  // Refresh notifications and mark unread as read when dropdown opens
  useEffect(() => {
    if (isOpen && manualRefresh) {
      console.log('Dropdown opened manually, refreshing notifications...');
      refreshNotifications();
      setManualRefresh(false);
    }
  }, [isOpen, manualRefresh, refreshNotifications]);

  // Auto mark all unread notifications as read when dropdown opens
  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      console.log('Dropdown opened with unread notifications, marking all as read...');
      // Use a small delay to ensure the dropdown is fully opened
      const timeoutId = setTimeout(() => {
        markAllAsRead();
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, unreadCount, markAllAsRead]);

  // Handle dropdown open
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setManualRefresh(true);
    }
    setIsOpen(open);
  };

  // Format notification time
  const formatNotificationTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;
      
      if (diffInHours < 24) {
        return format(date, 'p', { locale: bn }); // Just time if less than 24 hours
      } else if (diffInHours < 48) {
        return 'গতকাল';
      } else {
        return format(date, 'PP', { locale: bn }); // Full date otherwise
      }
    } catch (error) {
      return 'অজানা সময়';
    }
  };

  // Handle notification click
  const handleNotificationItemClick = (notification: any) => {
    console.log('NotificationDropdown - Notification clicked:', notification);
    
    try {
      // First close the dropdown
      setIsOpen(false);
      
      // Show toast for debugging
      toast({
        title: 'নোটিফিকেশন ক্লিক করা হয়েছে',
        description: 'রিডাইরেক্ট করা হচ্ছে...',
        duration: 1500,
      });
      
      // Mark notification as read if needed
      if (!notification.is_read) {
        markAsRead(notification.id);
      }
      
      // Use the handleNotificationClick function from NotificationService
      // This ensures consistent handling of all notification types
      handleNotificationClick(notification, navigate, () => {});
    } catch (error) {
      console.error('Error in handleNotificationItemClick:', error);
      
      // Always redirect to messages page instead of reloading
      window.location.href = '/messages';
    }
  };

  // Handle delete notification
  const handleDeleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
    setDeletingIds(prev => new Set(prev).add(id));
    
    try {
      const { success, error } = await deleteNotification(id);
      
      if (error) throw error;
      
      if (success) {
        toast({
          title: 'নোটিফিকেশন মুছে ফেলা হয়েছে',
          duration: 3000
        });
        refreshNotifications();
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: 'নোটিফিকেশন মুছতে সমস্যা হয়েছে',
        variant: 'destructive'
      });
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'purchase_request':
        return <ShoppingBag className="h-4 w-4 text-blue-500" />;
      case 'request_accepted':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'request_rejected':
        return <X className="h-4 w-4 text-red-500" />;
      case 'book_sold':
        return <CreditCard className="h-4 w-4 text-purple-500" />;
      case 'book_available':
        return <BookOpen className="h-4 w-4 text-amber-500" />;
      case 'payment_received':
        return <CreditCard className="h-4 w-4 text-emerald-500" />;
      case 'payment_sent':
        return <CreditCard className="h-4 w-4 text-orange-500" />;
      case 'message':
        return <MessageCircle className="h-4 w-4 text-indigo-500" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  // Get notification badge color based on type
  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case 'purchase_request':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'request_accepted':
        return 'bg-green-50 text-green-600 border-green-100';
      case 'request_rejected':
        return 'bg-red-50 text-red-600 border-red-100';
      case 'book_sold':
        return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'book_available':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'payment_received':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'payment_sent':
        return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'message':
        return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      default:
        return 'bg-primary/5 text-primary border-primary/10';
    }
  };

  // Render connection status
  const renderConnectionStatus = () => {
    if (connectionStatus === 'disconnected') {
      return (
        <div className="flex items-center justify-center p-2 bg-red-50 text-red-600 text-xs">
          <WifiOff className="h-3 w-3 mr-1" />
          <span>অফলাইন মোড - ইন্টারনেট কানেকশন চেক করুন</span>
        </div>
      );
    }
    return null;
  };

  // Render error state
  const renderErrorState = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-[200px] text-center p-4">
          <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
          <p className="text-muted-foreground text-sm">নোটিফিকেশন লোড করতে সমস্যা হয়েছে</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => refreshNotifications()}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            আবার চেষ্টা করুন
          </Button>
        </div>
      );
    }
    return null;
  };

  // Test navigation function
  const testNavigation = () => {
    console.log('Testing navigation...');
    try {
      navigate('/messages?seller=test-user-id');
      toast({
        title: 'নেভিগেশন টেস্ট সফল',
        description: '/messages?seller=test-user-id এ নেভিগেট করা হয়েছে',
        duration: 3000
      });
    } catch (error) {
      console.error('Navigation test failed:', error);
      toast({
        title: 'নেভিগেশন টেস্ট ব্যর্থ',
        description: error instanceof Error ? error.message : 'অজানা ত্রুটি',
        variant: 'destructive',
        duration: 5000
      });
    }
  };

  // Add a debug function to test direct navigation
  const testDirectNavigation = () => {
    const testUrl = `/messages?seller=test-user-id`;
    console.log('Testing direct navigation to:', testUrl);
    
    // Show a toast
    toast({
      title: 'নেভিগেশন টেস্ট',
      description: `${testUrl} এ রিডাইরেক্ট করা হচ্ছে`,
      duration: 2000,
    });
    
    // Redirect after toast is shown
    setTimeout(() => {
      window.location.href = testUrl;
    }, 2000);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-gray-50 hover:text-primary transition-colors duration-200">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className={`absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 ${getNotificationBadgeColor(notifications[0]?.type)}`}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[350px] shadow-lg border-gray-100">
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary/5 to-transparent">
          <h3 className="font-semibold text-sm text-primary">নোটিফিকেশন</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-xs hover:text-primary hover:bg-gray-50 transition-colors duration-200"
              onClick={() => markAllAsRead()}
            >
              সব পঠিত হিসেবে চিহ্নিত করুন
            </Button>
          )}
        </div>
        <Separator className="bg-gray-100" />
        
        {/* Debug button - only in development */}
        {/* Removing test navigation button */}
        
        {/* Connection status indicator */}
        {renderConnectionStatus()}
        
        <ScrollArea className="h-[350px]">
          {loading ? (
            <div className="p-3 space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50/50 rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : renderErrorState() || (notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-center p-4">
              <Bell className="h-12 w-12 text-muted-foreground mb-3 opacity-15" />
              <p className="text-muted-foreground text-sm">কোন নোটিফিকেশন নেই</p>
            </div>
          ) : (
            <div className="py-2 space-y-1">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`px-4 py-3 flex items-start gap-3 cursor-pointer group ${
                    !notification.is_read 
                      ? 'bg-primary/5' 
                      : ''
                  } rounded-md mx-1 focus:bg-transparent hover:bg-transparent data-[highlighted]:bg-transparent`}
                  onClick={() => handleNotificationItemClick(notification)}
                >
                  <div className="flex-shrink-0 mt-1">
                    {notification.sender_id ? (
                      <Avatar className="h-10 w-10 border-2 border-primary/10">
                        <AvatarImage src={notification.sender_avatar_url} />
                        <AvatarFallback className="bg-primary/5 text-primary">
                          {notification.sender_name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center">
                        {getNotificationIcon(notification.type)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!notification.is_read ? 'font-medium text-primary' : 'text-gray-800'}`}>
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {formatNotificationTime(notification.created_at)}
                      </span>
                      {!notification.is_read && (
                        <Badge variant="outline" className="h-5 px-1 text-[10px] bg-primary/5 text-primary border-primary/10">
                          নতুন
                        </Badge>
                      )}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          ))}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;
