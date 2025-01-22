import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users2, Store, Star, DollarSign, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

interface Stats {
  totalVendors: number;
  totalCouples: number;
  totalBookings: number;
  totalRevenue: number;
  activeSubscriptions: number;
}

interface RecentMember {
  id: string;
  email: string;
  role: 'vendor' | 'couple';
  created_at: string;
  details?: {
    business_name?: string;
    partner1_name?: string;
    partner2_name?: string;
  };
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalVendors: 0,
    totalCouples: 0,
    totalBookings: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
  });
  const [recentMembers, setRecentMembers] = useState<RecentMember[]>([]);

  useEffect(() => {
    loadStats();
    loadRecentMembers();
  }, []);

  const loadStats = async () => {
    try {
      // Get total vendors
      const { count: vendorsCount } = await supabase
        .from('vendors')
        .select('*', { count: 'exact', head: true });

      // Get total couples
      const { count: couplesCount } = await supabase
        .from('couples')
        .select('*', { count: 'exact', head: true });

      // Get total bookings
      const { count: bookingsCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true });

      // Get active subscriptions
      const { count: subscriptionsCount } = await supabase
        .from('vendors')
        .select('*', { count: 'exact', head: true })
        .not('subscription_plan', 'is', null);

      setStats({
        totalVendors: vendorsCount || 0,
        totalCouples: couplesCount || 0,
        totalBookings: bookingsCount || 0,
        totalRevenue: 0, // This would need to be calculated from actual payment data
        activeSubscriptions: subscriptionsCount || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Failed to load dashboard statistics');
    }
  };

  const loadRecentMembers = async () => {
    try {
      // Get recent users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (usersError) throw usersError;

      // Get additional details for each user
      const enrichedMembers = await Promise.all(
        users.map(async (user) => {
          const member: RecentMember = {
            id: user.id,
            email: user.email,
            role: user.role,
            created_at: user.created_at,
            details: {}
          };

          if (user.role === 'vendor') {
            const { data: vendorData } = await supabase
              .from('vendors')
              .select('business_name')
              .eq('user_id', user.id)
              .single();
            
            if (vendorData) {
              member.details = { business_name: vendorData.business_name };
            }
          } else if (user.role === 'couple') {
            const { data: coupleData } = await supabase
              .from('couples')
              .select('partner1_name, partner2_name')
              .eq('user_id', user.id)
              .single();
            
            if (coupleData) {
              member.details = {
                partner1_name: coupleData.partner1_name,
                partner2_name: coupleData.partner2_name
              };
            }
          }

          return member;
        })
      );

      setRecentMembers(enrichedMembers);
    } catch (error) {
      console.error('Error loading recent members:', error);
      toast.error('Failed to load recent members');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };

  const getMemberName = (member: RecentMember) => {
    if (member.role === 'vendor' && member.details?.business_name) {
      return member.details.business_name;
    } else if (member.role === 'couple' && member.details?.partner1_name && member.details?.partner2_name) {
      return `${member.details.partner1_name} & ${member.details.partner2_name}`;
    }
    return member.email;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-600">Loading statistics...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Wedding Marketplace Statistics</h1>
        <p className="text-gray-600">Overview of platform activity and growth</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
        {[
          {
            label: 'Total Vendors',
            value: stats.totalVendors,
            icon: <Store className="w-8 h-8 text-primary" />,
            onClick: () => navigate('/admin/vendors')
          },
          {
            label: 'Total Couples',
            value: stats.totalCouples,
            icon: <Users2 className="w-8 h-8 text-primary" />
          },
          {
            label: 'Total Bookings',
            value: stats.totalBookings,
            icon: <Star className="w-8 h-8 text-primary" />
          },
          {
            label: 'Active Subscriptions',
            value: stats.activeSubscriptions,
            icon: <Store className="w-8 h-8 text-primary" />
          },
          {
            label: 'Total Revenue',
            value: `$${stats.totalRevenue.toLocaleString()}`,
            icon: <DollarSign className="w-8 h-8 text-primary" />
          }
        ].map((stat, index) => (
          <button
            key={index}
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

      {/* Recent Activity */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Members</h2>
        <div className="space-y-4">
          {recentMembers.length === 0 ? (
            <p className="text-gray-600 text-center py-4">
              No recent members to display
            </p>
          ) : (
            recentMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between py-3 border-b last:border-0"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    member.role === 'vendor' ? 'bg-blue-100' : 'bg-rose-100'
                  }`}>
                    {member.role === 'vendor' ? (
                      <Store className={`w-5 h-5 text-blue-600`} />
                    ) : (
                      <Users2 className={`w-5 h-5 text-rose-600`} />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{getMemberName(member)}</p>
                    <p className="text-sm text-gray-600">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    member.role === 'vendor' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </span>
                  <span className="text-sm text-gray-500">
                    <Calendar className="w-4 h-4 inline-block mr-1" />
                    {formatDate(member.created_at)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;