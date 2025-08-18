import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, BookOpen, User, MessageCircle, Settings, LogOut, ShoppingCart, Search, FileCheck, Home, BookMarked, PenLine, HelpCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import NotificationDropdown from './NotificationDropdown';
import { countUnreadMessages } from '@/lib/MessageService';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const profileDropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Determine if scrolled enough to change background
      if (currentScrollY > 0) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
      
      // Determine scroll direction to show/hide navbar
      if (currentScrollY > 50) { // Lower threshold to make it work in hero section
        if (currentScrollY > lastScrollY + 5) { // More sensitive hiding
          // Scrolling down - hide navbar
          setVisible(false);
        } else if (currentScrollY < lastScrollY - 2) { // More sensitive showing
          // Scrolling up - show navbar
          setVisible(true);
        }
      } else {
        // Always visible at the top
        setVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    // Use a more frequent update for smoother response
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Set up real-time updates for unread message count
  useEffect(() => {
    if (user) {
      // Initial check
      directCheckUnreadCount();
      
      // Debug log for profile image
      console.log('User profile data:', {
        hasUserMetadata: !!user.user_metadata,
        avatarUrl: user.user_metadata?.avatar_url,
        name: user.user_metadata?.name,
        userId: user.id
      });

      const messageChannel = supabase
        .channel('messages-nav')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${user.id}`
          },
          (payload) => {
            console.log('New message received in navigation:', payload);
            // Just update the unread count whenever there's a new message
            directCheckUnreadCount();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Message updated in navigation:', payload);
            // Check if status was updated to 'read'
            if (payload.new && payload.new.status === 'read') {
              console.log('Message marked as read, updating unread count');
              directCheckUnreadCount();
            }
          }
        )
        .subscribe((status) => {
          console.log('Navigation message channel status:', status);
        });

      // Set up interval to periodically refresh unread count
      const intervalId = setInterval(() => {
        directCheckUnreadCount();
      }, 30000); // Every 30 seconds

      return () => {
        supabase.removeChannel(messageChannel);
        clearInterval(intervalId);
      };
    }
  }, [user]);

  // Also fetch unread count when location changes (e.g., user navigates to messages page)
  useEffect(() => {
    if (user) {
      directCheckUnreadCount();
    }
  }, [location.pathname, user]);

  // Listen for custom event when messages are marked as read
  useEffect(() => {
    const handleUnreadMessagesUpdated = () => {
      console.log('Received unread-messages-updated event');
      
      // Add a small delay to ensure database operations have completed
      setTimeout(() => {
        console.log('Checking unread messages after event');
        directCheckUnreadCount();
      }, 800);
    };
    
    window.addEventListener('unread-messages-updated', handleUnreadMessagesUpdated);
    
    return () => {
      window.removeEventListener('unread-messages-updated', handleUnreadMessagesUpdated);
    };
  }, []);
  
  // Listen for messages-marked-read custom event
  useEffect(() => {
    const handleMessagesMarkedRead = (event: any) => {
      console.log('Received messages-marked-read event:', event.detail);
      
      // Immediately update unread count directly from database
      directCheckUnreadCount();
    };
    
    window.addEventListener('messages-marked-read', handleMessagesMarkedRead as EventListener);
    
    return () => {
      window.removeEventListener('messages-marked-read', handleMessagesMarkedRead as EventListener);
    };
  }, []);

  const fetchUnreadMessageCount = async () => {
    if (!user) return;
    
    // Just use the direct check function
    directCheckUnreadCount();
  };

  // Direct check for unread messages from database
  const directCheckUnreadCount = async () => {
    if (!user) return;
    
    try {
      console.log('Directly checking unread messages from database');
      
      // Query the database directly
      const { data, error } = await supabase
        .from('messages')
        .select('id')
        .eq('receiver_id', user.id)
        .not('status', 'eq', 'read');
      
      if (error) {
        console.error('Error directly checking unread messages:', error);
        return;
      }
      
      const count = data ? data.length : 0;
      console.log('Direct unread message count:', count);
      
      // Only update if count has changed
      if (count !== unreadMessageCount) {
        console.log('Updating unread message count from', unreadMessageCount, 'to', count);
        setUnreadMessageCount(count);
      }
    } catch (error) {
      console.error('Error directly checking unread messages:', error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleProfileDropdown = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "সফল",
        description: "আপনি সফলভাবে লগআউট করেছেন",
      });
      navigate("/login");
    } catch (error) {
      toast({
        title: "ত্রুটি",
        description: "লগআউট করা সম্ভব হয়নি",
        variant: "destructive",
      });
    }
  };
  
  const isActive = (path) => {
    return location.pathname === path ? 'text-primary font-medium' : 'text-foreground/80 hover:text-primary';
  };

  const isMobileActive = (path) => {
    if (location.pathname === path) {
      return 'text-primary';
    }
    return 'text-gray-500';
  };

  return (
    <>
      {/* Main Navigation */}
      <nav 
        className={`fixed w-full z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100/50' 
            : 'bg-white border-b border-gray-100/50 shadow-sm'
        } ${
          visible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Navigation */}
          <div className="hidden md:flex justify-between items-center h-16 py-0">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold gradient-text">
                ডিপ্লোমা বাজার
              </span>
            </Link>

            {/* Desktop Menu - Modern Layout */}
            {location.pathname !== '/messages' && (
              <div className="flex items-center space-x-1">
                <Link to="/" className={`${isActive('/')} transition-all duration-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/10`}>
                  <Home className="h-4 w-4 inline mr-2" />
                  হোম
                </Link>
                <Link to="/browse" className={`${isActive('/browse')} transition-all duration-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/10`}>
                  <Search className="h-4 w-4 inline mr-2" />
                  বই খুঁজুন
                </Link>
                <Link to="/sell-book" className={`${isActive('/sell-book')} transition-all duration-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/10`}>
                  <PenLine className="h-4 w-4 inline mr-2" />
                  বই বিক্রি করুন
                </Link>
                <Link to="/messages" className={`${isActive('/messages')} transition-all duration-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/10 relative`}>
                  <MessageCircle className="h-4 w-4 inline mr-2" />
                  মেসেজ
                  {unreadMessageCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-white text-xs rounded-full flex items-center justify-center shadow-lg">
                      {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                    </span>
                  )}
                </Link>
                <Link to="/profile" className={`${isActive('/profile')} transition-all duration-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/10`}>
                  <User className="h-4 w-4 inline mr-2" />
                  প্রোফাইল
                </Link>
              </div>
            )}

            {/* User Menu / Auth Buttons */}
            <div className="flex items-center space-x-6">
              {user ? (
                <div className="flex items-center space-x-4">
                  {/* Notification Bell */}
                  <NotificationDropdown />
                  
                  {/* User dropdown - replaced with hamburger menu */}
                                      <div className="relative group" ref={profileDropdownRef}>
                    <div 
                      className="cursor-pointer"
                      onClick={toggleProfileDropdown}
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                        <Menu className="h-5 w-5 text-gray-600" />
                      </div>
                    </div>
                    
                    {profileDropdownOpen && (
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white/90 backdrop-blur-md rounded-lg shadow-lg border border-gray-100/50 z-50 overflow-hidden">
                        <div className="p-3 border-b border-gray-100">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-200 shadow-sm">
                              {user.user_metadata && user.user_metadata.avatar_url ? (
                                <img 
                                  src={user.user_metadata.avatar_url} 
                                  alt="Profile" 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    console.log('Dropdown profile image failed to load');
                                    e.currentTarget.src = '';
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 text-gray-600"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
                                  }}
                                />
                              ) : (
                                <User className="h-6 w-6 text-gray-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{user.user_metadata?.name || 'ব্যবহারকারী'}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-2">
                          <Link to="/verification" className="flex items-center space-x-2 p-2 rounded hover:bg-primary/5 hover:text-primary transition-colors duration-200 text-sm">
                            <FileCheck className="h-4 w-4 text-gray-500" />
                            <span>ভেরিফিকেশন</span>
                          </Link>
                          <div className="h-px bg-gray-100 my-1"></div>
                          <Link to="/settings" className="flex items-center space-x-2 p-2 rounded hover:bg-primary/5 hover:text-primary transition-colors duration-200 text-sm">
                            <Settings className="h-4 w-4 text-gray-500" />
                            <span>সেটিংস এবং গোপনীয়তা</span>
                          </Link>
                          <Link to="/help" className="flex items-center space-x-2 p-2 rounded hover:bg-primary/5 hover:text-primary transition-colors duration-200 text-sm">
                            <HelpCircle className="h-4 w-4 text-gray-500" />
                            <span>সাহায্য এবং সমর্থন</span>
                          </Link>
                          <div className="h-px bg-gray-100 my-1"></div>
                          <button 
                            onClick={handleLogout}
                            className="flex w-full items-center space-x-2 p-2 rounded hover:bg-red-50 hover:text-red-600 transition-colors duration-200 text-sm"
                          >
                            <LogOut className="h-4 w-4 text-gray-500" />
                            <span>লগ আউট</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link to="/login">
                    <Button 
                      variant="ghost" 
                      className="text-sm font-medium hover:bg-primary/10 hover:text-primary transition-all duration-200"
                    >
                      লগ ইন
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button className="primary-button text-sm px-5 py-2 rounded-full shadow-sm hover:shadow-md transition-all duration-200">
                      রেজিস্টার করুন
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Top Navigation */}
          <div className="md:hidden flex justify-between items-center h-16">
            {/* Logo - Mobile */}
            <Link to="/" className="flex items-center">
              <BookOpen className="h-7 w-7 text-primary" />
            </Link>

            {/* Main Navigation Items Group */}
            <div className="flex items-center justify-center mx-1 ml-4">
              <Link to="/" className="px-1 mx-1">
                <span className={`text-sm font-medium ${isMobileActive('/')}`}>হোম</span>
              </Link>
              
              <Link to="/browse" className="px-1 mx-1">
                <span className={`text-sm font-medium ${isMobileActive('/browse')}`}>খুঁজুন</span>
              </Link>
              
              <Link to="/sell-book" className="px-1 mx-1">
                <span className={`text-sm font-medium ${isMobileActive('/sell-book')}`}>বিক্রি</span>
              </Link>
              
            </div>

            {/* Spacer */}
            <div className="flex-grow"></div>

            {/* Action Icons Group */}
            <div className="flex items-center">
              {user && (
                <>
                  {/* Messages - Mobile */}
                  <Link to="/messages" className="relative p-0.5 mx-0.5">
                    <MessageCircle className={`h-5 w-5 ${isMobileActive('/messages')}`} />
                    {unreadMessageCount > 0 && (
                      <span className="absolute top-0 right-0 h-4 w-4 bg-primary text-white text-xs rounded-full flex items-center justify-center">
                        {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                      </span>
                    )}
                  </Link>
                  
                  {/* Notifications - Mobile */}
                  <div className="p-0.5 mx-0.5">
                    <NotificationDropdown />
                  </div>
                  
                  {/* Profile/Menu - Mobile - Only for logged in users - Hidden on messages page */}
                  {location.pathname !== '/messages' && (
                    <div className="p-0.5 mx-0.5 relative" onClick={toggleMenu}>
                      <div className="flex flex-col items-center">
                        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-200 shadow-sm relative">
                          {user.user_metadata && user.user_metadata.avatar_url ? (
                            <>
                              <img 
                                src={user.user_metadata.avatar_url} 
                                alt="Profile" 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  console.log('Profile image failed to load');
                                  e.currentTarget.src = '';
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.parentElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 text-gray-600"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
                                }}
                              />
                              <ChevronDown className="h-9 w-9 text-gray-700 absolute bottom-[-2px] right-0 left-0 mx-auto stroke-[3px]" />
                            </>
                          ) : (
                            <>
                              <User className="h-4 w-4 text-gray-600" />
                              <ChevronDown className="h-6 w-6 text-gray-700 absolute bottom-[-2px] right-0 left-0 mx-auto stroke-[3px]" />
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {/* Login/Register buttons for logged out users - All pages */}
              {!user && (
                <div className="flex items-center space-x-2">
                  <Link to="/login" className="px-1 mx-1">
                    <span className={`text-sm font-medium ${isMobileActive('/login')}`}>লগ ইন</span>
                  </Link>
                  <Link to="/register">
                    <Button 
                      size="sm"
                      className="primary-button text-xs px-3 py-1.5 rounded-full shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      রেজিস্টার
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu - Slide In Panel */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm" 
            onClick={toggleMenu}
          />
          <div 
            className="fixed top-0 right-0 bottom-0 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out"
            style={{ animation: 'slideIn 0.3s ease-out forwards' }}
          >
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold gradient-text">ডিপ্লোমা বাজার</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMenu}
                className="p-1"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {user && (
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-200 shadow-sm">
                    {user.user_metadata && user.user_metadata.avatar_url ? (
                      <img 
                        src={user.user_metadata.avatar_url} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.log('Sidebar profile image failed to load');
                          e.currentTarget.src = '';
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 text-gray-600"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
                        }}
                      />
                    ) : (
                      <User className="h-6 w-6 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{user.user_metadata?.name || 'ব্যবহারকারী'}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              {user ? (
                <div className="space-y-1">
                  <Link 
                    to="/sell-book"
                    onClick={toggleMenu}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors duration-200"
                  >
                    <PenLine className="h-5 w-5" />
                    <span className="font-medium">বই বিক্রি করুন</span>
                  </Link>
                  
                  <Link 
                    to="/verification"
                    onClick={toggleMenu}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors duration-200"
                  >
                    <FileCheck className="h-5 w-5" />
                    <span className="font-medium">ভেরিফিকেশন</span>
                  </Link>
                  
                  <Link 
                    to="/profile" 
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors duration-200" 
                    onClick={toggleMenu}
                  >
                    <User className="h-5 w-5" />
                    <span className="font-medium">প্রোফাইল</span>
                  </Link>
                  
                  <Link 
                    to="/settings"
                    onClick={toggleMenu}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors duration-200"
                  >
                    <Settings className="h-5 w-5" />
                    <span className="font-medium">সেটিংস এবং গোপনীয়তা</span>
                  </Link>
                  
                  <Link 
                    to="/help"
                    onClick={toggleMenu}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors duration-200"
                  >
                    <HelpCircle className="h-5 w-5" />
                    <span className="font-medium">সাহায্য এবং সমর্থন</span>
                  </Link>
                  
                  <div className="h-px bg-gray-100 my-2"></div>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMenu();
                      handleLogout();
                    }}
                    className="flex w-full items-center space-x-3 p-3 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">লগ আউট</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <Link 
                    to="/login"
                    onClick={toggleMenu}
                    className="flex w-full items-center justify-center p-3 rounded-lg bg-white hover:bg-primary/10 hover:text-primary border border-gray-200 transition-colors duration-200"
                  >
                    <span className="font-medium">লগ ইন</span>
                  </Link>
                  
                  <Link 
                    to="/register"
                    onClick={toggleMenu}
                    className="flex w-full items-center justify-center p-3 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors duration-200"
                  >
                    <span className="font-medium">রেজিস্টার করুন</span>
                  </Link>
                </div>
              )}
            </div>
            
            {/* Remove the login/register and logout buttons at the bottom */}
            
          </div>
        </div>
      )}

      {/* Add animation styles */}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
};

export default Navigation;
