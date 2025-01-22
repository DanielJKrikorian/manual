import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Star, Filter, Crown, Award } from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import type { Vendor } from '../types';

interface City {
  id: string;
  name: string;
  state: string;
}

const VendorSearch = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: 'All Categories',
    priceRange: 'All Prices',
    location: '',
    rating: 'All Ratings'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState('');

  useEffect(() => {
    loadVendors();
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .order('name');

      if (error) throw error;
      setCities(data || []);
    } catch (error) {
      console.error('Error loading cities:', error);
      toast.error('Failed to load cities');
    }
  };

  const loadVendors = async () => {
    try {
      let query = supabase
        .from('vendors')
        .select(`
          *,
          vendor_service_areas!inner (
            city_id
          )
        `);

      if (selectedCity) {
        query = query.eq('vendor_service_areas.city_id', selectedCity);
      }

      const { data, error } = await query;

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error loading vendors:', error);
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  const filterVendors = () => {
    const filtered = vendors.filter(vendor => {
      // Search term filter
      const searchMatch = vendor.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.category.toLowerCase().includes(searchTerm.toLowerCase());
      if (!searchMatch) return false;

      // Category filter
      if (filters.category !== 'All Categories' && vendor.category !== filters.category) {
        return false;
      }

      // Price range filter
      if (filters.priceRange !== 'All Prices' && vendor.price_range !== filters.priceRange) {
        return false;
      }

      // Rating filter
      if (filters.rating !== 'All Ratings') {
        const minimumRating = parseFloat(filters.rating.replace('+', ''));
        if (vendor.rating < minimumRating) {
          return false;
        }
      }

      return true;
    });

    // Sort vendors by subscription plan priority
    return filtered.sort((a, b) => {
      const planPriority = {
        'elite': 3,
        'featured': 2,
        'essential': 1,
        null: 0
      };

      const priorityA = planPriority[a.subscription_plan || null] || 0;
      const priorityB = planPriority[b.subscription_plan || null] || 0;

      return priorityB - priorityA;
    });
  };

  const getSubscriptionBadge = (plan: string | null) => {
    switch (plan) {
      case 'elite':
        return (
          <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-3 py-1 rounded-full flex items-center shadow-lg">
            <Crown className="w-4 h-4 mr-1" />
            Elite
          </div>
        );
      case 'featured':
        return (
          <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-400 to-blue-600 text-white px-3 py-1 rounded-full flex items-center shadow-lg">
            <Award className="w-4 h-4 mr-1" />
            Featured
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Search Header */}
      <div className="flex flex-col items-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Find Wedding Vendors</h1>
        <form onSubmit={(e) => e.preventDefault()} className="w-full max-w-2xl">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search vendors..."
                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <Button
              type="button"
              variant={showFilters ? 'default' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </form>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option>All Categories</option>
                {['Venues', 'Photography', 'Catering', 'Decor', 'Music', 'Flowers'].map(category => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Price Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range
              </label>
              <select
                value={filters.priceRange}
                onChange={(e) => setFilters(prev => ({ ...prev, priceRange: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option>All Prices</option>
                <option>$</option>
                <option>$$</option>
                <option>$$$</option>
                <option>$$$$</option>
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <select
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  loadVendors(); // Reload vendors when city changes
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">All Locations</option>
                {cities.map(city => (
                  <option key={city.id} value={city.id}>
                    {city.name}, {city.state}
                  </option>
                ))}
              </select>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <select
                value={filters.rating}
                onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option>All Ratings</option>
                <option>4.5+</option>
                <option>4.0+</option>
                <option>3.5+</option>
                <option>3.0+</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setFilters({
                  category: 'All Categories',
                  priceRange: 'All Prices',
                  location: '',
                  rating: 'All Ratings'
                });
                setSelectedCity('');
                setSearchTerm('');
                loadVendors();
              }}
            >
              Reset Filters
            </Button>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="flex justify-between items-center">
        <p className="text-gray-600">
          {filterVendors().length} vendor{filterVendors().length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-600">Loading vendors...</p>
          </div>
        ) : filterVendors().length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-600">No vendors found matching your criteria</p>
          </div>
        ) : (
          filterVendors().map((vendor) => (
            <button
              key={vendor.id}
              onClick={() => navigate(`/vendors/${vendor.id}`)}
              className="text-left w-full transition-transform hover:scale-[1.02]"
            >
              <div className="bg-white rounded-lg shadow-sm overflow-hidden relative">
                {getSubscriptionBadge(vendor.subscription_plan)}
                <img
                  src={vendor.images[0] || `https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80`}
                  alt={vendor.business_name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{vendor.business_name}</h3>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    {vendor.location}
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="flex text-yellow-400 mr-1">
                      <Star className="w-4 h-4 fill-current" />
                    </div>
                    <span>{vendor.rating.toFixed(1)}</span>
                    <span className="text-gray-600 mx-1">•</span>
                    <span className="text-gray-600">{vendor.price_range}</span>
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default VendorSearch;