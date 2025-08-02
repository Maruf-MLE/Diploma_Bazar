import React from 'react';
import { 
  Bell, 
  Check, 
  Trash2, 
  MessageCircle, 
  ShoppingCart, 
  AlertCircle,
  BookOpen,
  User,
  Calendar,
  UserCheck,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/contexts/NotificationContext';
import { Notification } from '@/lib/NotificationService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { handleNotificationClick } from '@/lib/NotificationService';

// Type-specific icon mapping
const notificationIcons = {
  'message': <MessageCircle className="h-4 w-4" />,
  'purchase_request': <ShoppingCart className="h-4 w-4" />,
  'system': <AlertCircle className="h-4 w-4" />,
  'book_added': <BookOpen className="h-4 w-4" />,
  'user_joined': <User className="h-4 w-4" />,
  'reminder': <Calendar className="h-4 w-4" />,
  'verification_approved': <UserCheck className="h-4 w-4 text-green-500" />,
  'verification_rejected': <XCircle className="h-4 w-4 text-red-500" />
};

interface NotificationItemProps {
  notification: Notification;
  onClose: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClose }) => {
  const { markAsRead } = useNotifications();
  const navigate = useNavigate();
  
  const handleClick = async () => {
    // Use the handleNotificationClick function from NotificationService
    await handleNotificationClick(notification, navigate, onClose);
  };
  
  // Format the timestamp
  const timeAgo = notification.created_at 
    ? formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })
    : '';
  
  return (
    <div 
      className={`p-3 border-b border-primary/10 ${notification.is_read ? 'bg-transparent' : 'bg-primary/5'} cursor-pointer`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {notification.sender_avatar_url ? (
            <Avatar className="h-8 w-8">
              <AvatarImage src={notification.sender_avatar_url} />
              <AvatarFallback>
                {notification.sender_name?.charAt(0) || 'N'}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {notificationIcons[notification.type as keyof typeof notificationIcons] || <Bell className="h-4 w-4" />}
            </div>
          )}
        </div>
        
        <div className="flex-grow">
          <h4 className="text-sm font-medium line-clamp-2">{notification.message}</h4>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{notification.message}</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
            
            <div className="flex items-center gap-1">
              {!notification.is_read && (
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-6 w-6 text-muted-foreground hover:text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsRead(notification.id);
                  }}
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface NotificationListProps {
  onClose: () => void;
}

const NotificationList: React.FC<NotificationListProps> = ({ onClose }) => {
  const { notifications, loading, unreadCount, markAllAsRead } = useNotifications();
  
  return (
    <div className="w-full sm:w-80 md:w-96 bg-background border border-border rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-base">নোটিফিকেশন</h3>
          <p className="text-xs text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount}টি অপঠিত নোটিফিকেশন`
              : 'সব নোটিফিকেশন পড়া হয়েছে'}
          </p>
        </div>
        
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8"
            onClick={markAllAsRead}
          >
            সব পঠিত করুন
          </Button>
        )}
      </div>
      
      <ScrollArea className="h-[350px]">
        {loading ? (
          <div className="p-8 flex flex-col items-center justify-center">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mb-2"></div>
            <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p>
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((notification) => (
            <NotificationItem 
              key={notification.id} 
              notification={notification} 
              onClose={onClose} 
            />
          ))
        ) : (
          <div className="p-8 flex flex-col items-center justify-center">
            <Bell className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">কোন নোটিফিকেশন নেই</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default NotificationList; 