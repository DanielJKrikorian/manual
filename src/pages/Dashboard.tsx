import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, MessageSquare, Heart, Settings, LogOut, Star, Pencil, X, Loader2, InboxIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import type { Vendor, Couple } from '../types';

interface Review {
  id: string;
  rating: number;
  content: string;
  created_at: string;
  vendor: {
    id: string;
    business_name: string;
    category: string;
  };
}

interface VendorInquiry {
  vendor: Vendor;
  lastMessage: string;
  lastMessageDate: string;
  status: 'pending' | 'responded' | 'booked';
}

interface VendorDashboardProps {
  vendor: Vendor;
}

interface CoupleDashboardProps {
  couple: Couple;
}

const VendorDashboard: React.FC<VendorDashboardProps> = ({ vendor }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [appointmentsCount, setAppointmentsCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [profileViews, setProfileViews] = useState(0);
  const [pendingLeads, setPendingLeads] = useState(0);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  useEffect(() => {
    // Load appointments count
    const loadAppointmentsCount = async () => {
      try {
        const { data: appointmentsData, error } = await supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('vendor_id', vendor.id)
          .eq('status', 'confirmed');

        if (!error) {
          setAppointmentsCount(appointmentsData?.length || 0);
        }
      } catch (error) {
        console.error('Error loading appointments count:', error);
      }
    };

    // Load unread messages count
    const loadUnreadMessages = async () => {
      try {
        const { data: messages, error } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('receiver_id', vendor.user_id)
          .eq('status', 'pending');

        if (!error) {
          setUnreadMessages(messages?.length || 0);
        }
      } catch (error) {
        console.error('Error loading unread messages:', error);
      }
    };

    // Load pending leads count
    const loadPendingLeads = async () => {
      try {
        const { data: leads, error } = await supabase
          .from('messages')
          .select('sender_id', { count: 'exact', head: true })
          .eq('receiver_id', vendor.user_id)
          .eq('status', 'pending');

        if (!error) {
          setPendingLeads(leads?.length || 0);
        }
      } catch (error) {
        console.error('Error loading pending leads:', error);
      }
    };

    // Load profile views (mock data for now)
    setProfileViews(Math.floor(Math.random() * 50) + 10);

    loadAppointmentsCount();
    loadUnreadMessages();
    loadPendingLeads();

    // Check for successful subscription
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('session_id');
    if (sessionId) {
      toast.success('Subscription activated successfully!');
    }
  }, [location, vendor.id, vendor.user_id]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {vendor.business_name}!</h1>
          <p className="text-gray-600">Manage your wedding business</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/reviews")}>
            <Star className="w-4 h-4 mr-2" />
            Reviews
          </Button>
          <Button variant="outline" onClick={() => navigate("/leads")}>
            <InboxIcon className="w-4 h-4 mr-2" />
            Leads
          </Button>
          <Button variant="outline" onClick={() => navigate("/vendor/settings")}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { 
            icon: <Calendar className="w-6 h-6 text-rose-500" />, 
            label: 'Upcoming Appointments', 
            value: appointmentsCount.toString(),
            onClick: () => navigate('/calendar')
          },
          { 
            icon: <MessageSquare className="w-6 h-6 text-rose-500" />, 
            label: 'Unread Messages', 
            value: unreadMessages.toString(),
            onClick: () => navigate('/messages')
          },
          { 
            icon: <InboxIcon className="w-6 h-6 text-rose-500" />, 
            label: 'Pending Leads', 
            value: pendingLeads.toString(),
            onClick: () => navigate('/leads')
          },
          { 
            icon: <Heart className="w-6 h-6 text-rose-500" />, 
            label: 'Profile Views', 
            value: profileViews.toString(),
            onClick: () => navigate(`/vendors/${vendor.id}`)
          },
        ].map((stat) => (
          <button
            key={stat.label}
            onClick={stat.onClick}
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow text-left w-full"
          >
            <div className="flex items-center space-x-4">
              {stat.icon}
              <div>
                <p className="text-gray-600">{stat.label}</p>
                <p className="text-2xl font-semibold">{stat.value}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Subscription Status */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Subscription Status</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Current Plan: {vendor.subscription_plan || 'No active plan'}</p>
            {vendor.subscription_end_date && (
              <p className="text-sm text-gray-600">
                Renews on: {new Date(vendor.subscription_end_date).toLocaleDateString()}
              </p>
            )}
          </div>
          <Button onClick={() => navigate('/subscription')}>
            {vendor.subscription_plan ? 'Manage Plan' : 'Choose a Plan'}
          </Button>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {[
            { type: 'booking', title: 'New booking request from Sarah & Michael', time: '2 hours ago' },
            { type: 'message', title: 'New message from Emma & James', time: '5 hours ago' },
            { type: 'review', title: 'New 5-star review received', time: '1 day ago' },
          ].map((activity, index) => (
            <div key={index} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              <div className="flex-1">
                <p className="font-medium">{activity.title}</p>
                <p className="text-sm text-gray-600">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const CoupleDashboard: React.FC<CoupleDashboardProps> = ({ couple }) => {
  const navigate = useNavigate();
  const [savedVendorsCount, setSavedVendorsCount] = useState(0);
  const [inquiries, setInquiries] = useState<VendorInquiry[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [savingReview, setSavingReview] = useState(false);
  const [editReviewData, setEditReviewData] = useState({
    rating: 5,
    content: ''
  });

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Load saved vendors count
        const { count: savedCount } = await supabase
          .from('saved_vendors')
          .select('*', { count: 'exact', head: true })
          .eq('couple_id', user.id);

        setSavedVendorsCount(savedCount || 0);

        // Load reviews
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select(`
            id,
            rating,
            content,
            created_at,
            vendor:vendors (
              id,
              business_name,
              category
            )
          `)
          .eq('couple_id', couple.id)
          .order('created_at', { ascending: false });

        if (reviewsError) throw reviewsError;
        setReviews(reviewsData || []);

        // Load vendor inquiries using the secure view
        const { data: messages, error } = await supabase
          .from('vendor_messages_secure')
          .select('*')
          .eq('sender_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading messages:', error);
          throw error;
        }

        if (messages) {
          // Group messages by vendor and get the latest status
          const vendorInquiries = messages.reduce((acc: VendorInquiry[], message) => {
            const existingInquiry = acc.find(i => i.vendor.id === message.vendor_id);
            if (!existingInquiry) {
              acc.push({
                vendor: {
                  id: message.vendor_id,
                  business_name: message.business_name,
                  category: message.category,
                  location: message.location,
                  price_range: message.price_range,
                  rating: message.rating,
                  images: []
                },
                lastMessage: message.content,
                lastMessageDate: message.created_at,
                status: message.status || 'pending'
              });
            }
            return acc;
          }, []);

          setInquiries(vendorInquiries);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [couple.id]);

  const handleEditReview = (review: Review) => {
    setEditingReview(review.id);
    setEditReviewData({
      rating: review.rating,
      content: review.content
    });
  };

  const handleUpdateReview = async () => {
    if (!editingReview) return;
    setSavingReview(true);

    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          rating: editReviewData.rating,
          content: editReviewData.content
        })
        .eq('id', editingReview);

      if (error) throw error;

      // Update local state
      setReviews(prev =>
        prev.map(review =>
          review.id === editingReview
            ? {
                ...review,
                rating: editReviewData.rating,
                content: editReviewData.content
              }
            : review
        )
      );

      toast.success('Review updated successfully');
      setEditingReview(null);
    } catch (error) {
      console.error('Error updating review:', error);
      toast.error('Failed to update review');
    } finally {
      setSavingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      setReviews(prev => prev.filter(review => review.id !== reviewId));
      toast.success('Review deleted successfully');
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {couple.partner1_name} & {couple.partner2_name}!
          </h1>
          <p className="text-gray-600">Plan your perfect wedding</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/settings")}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { 
            icon: <Calendar className="w-6 h-6 text-rose-500" />, 
            label: 'Days Until Wedding', 
            value: couple.wedding_date ? Math.ceil((new Date(couple.wedding_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 'Not set',
            onClick: () => navigate('/settings')
          },
          { 
            icon: <MessageSquare className="w-6 h-6 text-rose-500" />, 
            label: 'Vendor Messages', 
            value: inquiries.length,
            onClick: () => navigate('/messages')
          },
          { 
            icon: <Heart className="w-6 h-6 text-rose-500" />, 
            label: 'Saved Vendors', 
            value: savedVendorsCount,
            onClick: () => navigate('/saved-vendors')
          },
        ].map((stat) => (
          <button
            key={stat.label}
            onClick={stat.onClick}
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow text-left w-full"
          >
            <div className="flex items-center space-x-4">
              {stat.icon}
              <div>
                <p className="text-gray-600">{stat.label}</p>
                <p className="text-2xl font-semibold">{stat.value}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Wedding Details */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Wedding Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-600">Location</p>
              <p className="font-medium">{couple.location || 'Not set'}</p>
            </div>
            <div>
              <p className="text-gray-600">Wedding Date</p>
              <p className="font-medium">
                {couple.wedding_date 
                  ? new Date(couple.wedding_date).toLocaleDateString() 
                  : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Budget</p>
              <p className="font-medium">
                {couple.budget 
                  ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(couple.budget)
                  : 'Not set'}
              </p>
            </div>
          </div>
        </section>

        {/* Your Reviews */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Your Reviews</h2>
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <p className="text-gray-600 text-center py-4">
                You haven't written any reviews yet
              </p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
                  {editingReview === review.id ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rating
                        </label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() => setEditReviewData(prev => ({ ...prev, rating }))}
                              className="text-yellow-400"
                            >
                              <Star
                                className={`w-6 h-6 ${
                                  rating <= editReviewData.rating ? 'fill-current' : 'stroke-current fill-none'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Review
                        </label>
                        <textarea
                          value={editReviewData.content}
                          onChange={(e) => setEditReviewData(prev => ({ ...prev, content: e.target.value }))}
                          rows={3}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingReview(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleUpdateReview}
                          disabled={savingReview}
                        >
                          {savingReview ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'Save Changes'
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{review.vendor.business_name}</h3>
                          <p className="text-sm text-gray-600">{review.vendor.category}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditReview(review)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center my-2">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating ? 'fill-current' : 'stroke-current fill-none'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="ml-2 text-sm text-gray-600">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-gray-600">{review.content}</p>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Vendor Inquiries */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Vendor Inquiries</h2>
        <div className="space-y-4">
          {loading ? (
            <p className="text-gray-600">Loading inquiries...</p>
          ) : inquiries.length === 0 ? (
            <p className="text-gray-600">No vendor inquiries yet</p>
          ) : (
            inquiries.map((inquiry, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg cursor-pointer"
                onClick={() => navigate('/messages')}
              >
                <div>
                  <h3 className="font-medium">{inquiry.vendor.business_name}</h3>
                  <p className="text-sm text-gray-600">{inquiry.lastMessage}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(inquiry.lastMessageDate).toLocaleDateString()}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm ${
                  inquiry.status === 'booked' 
                    ? 'bg-green-100 text-green-800'
                    : inquiry.status === 'responded'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<'vendor' | 'couple' | null>(null);
  const [userData, setUserData] = useState<Vendor | Couple | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error('Please sign in to access the dashboard');
          navigate('/get-started');
          return;
        }

        // Try to load vendor data
        const { data: vendorData, error: vendorError } = await supabase
          .from('vendors')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (vendorData) {
          setUserType('vendor');
          setUserData(vendorData);
        } else {
          // If not a vendor, try to load couple data
          const { data: coupleData, error: coupleError } = await supabase
            .from('couples')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (coupleData) {
            setUserType('couple');
            setUserData(coupleData);
          } else {
            // If neither vendor nor couple data exists, redirect to get started
            toast.error('Please complete your profile setup');
            navigate('/get-started');
            return;
          }
        }
      } catch (error: any) {
        console.error('Error loading user data:', error);
        if (error.message?.includes('JSON object requested, multiple (or no) rows returned')) {
          toast.error('Please complete your profile setup');
          navigate('/get-started');
        } else {
          toast.error('Failed to load user data');
        }
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  if (!userData || !userType) {
    return null;
  }

  return userType === 'vendor' 
    ? <VendorDashboard vendor={userData as Vendor} />
    : <CoupleDashboard couple={userData as Couple} />;
};

export default Dashboard;