import React, { useEffect, useState } from 'react';
import { Search, Store, MapPin, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import type { Vendor } from '../../types';

interface VendorWithEmail extends Vendor {
  email?: string;
}

const AdminVendors = () => {
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<VendorWithEmail[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState({
    category: 'All Categories',
    subscriptionPlan: 'All Plans'
  });

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      // First get all vendors
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .order('business_name');

      if (vendorError) throw vendorError;

      // Then get all user emails in a single query
      const userIds = vendorData?.map(v => v.user_id) || [];
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email')
        .in('id', userIds);

      if (userError) throw userError;

      // Create a map of user IDs to emails
      const userEmailMap = new Map(userData?.map(u => [u.id, u.email]));

      // Combine the data
      const vendorsWithEmail = vendorData?.map(vendor => ({
        ...vendor,
        email: userEmailMap.get(vendor.user_id)
      })) || [];

      setVendors(vendorsWithEmail);
    } catch (error) {
      console.error('Error loading vendors:', error);
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = 
      vendor.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = 
      filter.category === 'All Categories' || 
      vendor.category === filter.category;

    const matchesSubscription = 
      filter.subscriptionPlan === 'All Plans' || 
      vendor.subscription_plan === filter.subscriptionPlan;

    return matchesSearch && matchesCategory && matchesSubscription;
  });

  const categories = ['All Categories', ...Array.from(new Set(vendors.map(v => v.category)))];
  const subscriptionPlans = ['All Plans', 'essential', 'featured', 'elite'];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Vendor Management</h1>
        <p className="text-gray-600">View and manage all vendor accounts</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search vendors..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>

          {/* Category Filter */}
          <select
            value={filter.category}
            onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
            className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          {/* Subscription Filter */}
          <select
            value={filter.subscriptionPlan}
            onChange={(e) => setFilter(prev => ({ ...prev, subscriptionPlan: e.target.value }))}
            className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {subscriptionPlans.map(plan => (
              <option key={plan} value={plan}>
                {plan === 'All Plans' ? plan : plan.charAt(0).toUpperCase() + plan.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Vendors List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading vendors...</p>
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No vendors found</h2>
            <p className="text-gray-600">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          filteredVendors.map((vendor) => (
            <div key={vendor.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">{vendor.business_name}</h3>
                  <div className="flex items-center gap-6 text-gray-600">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {vendor.location}
                    </div>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-1" />
                      {vendor.rating.toFixed(1)}
                    </div>
                    <div>
                      {vendor.category}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Email: {vendor.email}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {vendor.subscription_plan ? (
                    <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                      {vendor.subscription_plan.charAt(0).toUpperCase() + vendor.subscription_plan.slice(1)}
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800">
                      No Plan
                    </span>
                  )}
                  {vendor.subscription_end_date && (
                    <span className="text-sm text-gray-500">
                      Expires: {new Date(vendor.subscription_end_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminVendors;