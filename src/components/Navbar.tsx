import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Search, MessageSquare, UserCircle, Bell } from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '../lib/supabase';

interface Notification {
  id: string;
  title: string;
  time: string;
  read: boolean;
  type: 'booking' | 'message' | 'review' | 'vendor_response' | 'booking_confirmation';
  entityId?: string; // ID of the related entity (booking, message, etc.)
}

const Navbar = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<'vendor' | 'couple' | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUserRole(null);
        return;
      }

      // Check if user is a vendor
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (vendorData) {
        setUserRole('vendor');
        loadVendorNotifications(user.id);
        return;
      }

      // Check if user is a couple
      const { data: coupleData } = await supabase
        .from('couples')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (coupleData) {
        setUserRole('couple');
        loadCoupleNotifications(user.id);
        return;
      }

      setUserRole(null);
    };

    checkUserRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUserRole();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadVendorNotifications = async (userId: string) => {
    // Example notifications with types and entityIds
    const mockNotifications = [
      { 
        id: '1', 
        title: 'New booking request from Sarah & Michael', 
        time: '2 hours ago', 
        read: false,
        type: 'booking' as const,
        entityId: 'booking123'
      },
      { 
        id: '2', 
        title: 'Message received from Emma & James', 
        time: '5 hours ago', 
        read: false,
        type: 'message' as const,
        entityId: 'message456'
      },
      { 
        id: '3', 
        title: 'New review posted', 
        time: '1 day ago', 
        read: true,
        type: 'review' as const,
        entityId: 'review789'
      },
    ];
    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);
  };

  const loadCoupleNotifications = async (userId: string) => {
    // Example notifications with types and entityIds
    const mockNotifications = [
      { 
        id: '1', 
        title: 'Vendor "Elegant Events" responded to your inquiry', 
        time: '1 hour ago', 
        read: false,
        type: 'vendor_response' as const,
        entityId: 'message123'
      },
      { 
        id: '2', 
        title: 'New message from Dream Venue', 
        time: '3 hours ago', 
        read: false,
        type: 'message' as const,
        entityId: 'message456'
      },
      { 
        id: '3', 
        title: 'Booking confirmed with Perfect Photography', 
        time: '1 day ago', 
        read: true,
        type: 'booking_confirmation' as const,
        entityId: 'booking789'
      },
    ];
    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);
  };

  const handleMessagesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!userRole) {
      navigate('/signin');
      return;
    }
    navigate('/messages');
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark notification as read
    setNotifications(prev =>
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'booking':
      case 'booking_confirmation':
        navigate(`/dashboard`, { 
          state: { 
            scrollToBookings: true,
            highlightBooking: notification.entityId 
          }
        });
        break;
      case 'message':
      case 'vendor_response':
        navigate(`/messages`, { 
          state: { 
            openConversation: notification.entityId 
          }
        });
        break;
      case 'review':
        navigate(`/dashboard`, { 
          state: { 
            scrollToReviews: true,
            highlightReview: notification.entityId 
          }
        });
        break;
      default:
        navigate('/dashboard');
    }
    
    setShowNotifications(false);
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Heart className="w-6 h-6 text-rose-500" />
            <span className="text-xl font-semibold">WeddingHub</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link to="/vendors" className="flex items-center space-x-1 text-gray-600 hover:text-gray-900">
              <Search className="w-4 h-4" />
              <span>Find Vendors</span>
            </Link>
            {userRole && (
              <>
                <a
                  href="#"
                  onClick={handleMessagesClick}
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Messages</span>
                </a>
                <Link to="/dashboard" className="flex items-center space-x-1 text-gray-600 hover:text-gray-900">
                  <UserCircle className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {!userRole ? (
              <>
                <Button variant="ghost" onClick={() => navigate('/signin')}>Sign In</Button>
                <Button onClick={() => navigate('/get-started')}>Get Started</Button>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-1 rounded-full hover:bg-gray-100"
                  >
                    <Bell className="w-5 h-5 text-gray-600" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg py-2 z-50">
                      <div className="px-4 py-2 border-b">
                        <h3 className="font-semibold">Notifications</h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-600">
                            No notifications
                          </div>
                        ) : (
                          notifications.map(notification => (
                            <button
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`w-full px-4 py-3 hover:bg-gray-50 text-left ${
                                !notification.read ? 'bg-primary/5' : ''
                              }`}
                            >
                              <p className={`text-sm ${!notification.read ? 'font-medium' : ''}`}>
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {notification.time}
                              </p>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                  {userRole === 'vendor' ? 'Vendor Dashboard' : 'Couple Dashboard'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;