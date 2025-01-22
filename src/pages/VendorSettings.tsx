import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Save, Loader2, Upload, X, Image as ImageIcon, Star, Globe, Facebook, Instagram, Youtube } from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import CitySelect from '../components/CitySelect';

interface VendorFormData {
  businessName: string;
  category: string;
  description: string;
  location: string;
  priceRange: string;
  websiteUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
}

const VendorSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [formData, setFormData] = useState<VendorFormData>({
    businessName: '',
    category: '',
    description: '',
    location: '',
    priceRange: '',
    websiteUrl: '',
    facebookUrl: '',
    instagramUrl: '',
    tiktokUrl: '',
    youtubeUrl: '',
  });

  useEffect(() => {
    const loadVendorData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error('Please sign in to access settings');
          navigate('/vendor/register');
          return;
        }

        // Load vendor data
        const { data: vendorData, error: vendorError } = await supabase
          .from('vendors')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (vendorError) {
          console.error('Error loading vendor data:', vendorError);
          toast.error('Failed to load your profile');
          return;
        }

        if (vendorData) {
          setFormData({
            businessName: vendorData.business_name || '',
            category: vendorData.category || '',
            description: vendorData.description || '',
            location: vendorData.location || '',
            priceRange: vendorData.price_range || '$$$',
            websiteUrl: vendorData.website_url || '',
            facebookUrl: vendorData.facebook_url || '',
            instagramUrl: vendorData.instagram_url || '',
            tiktokUrl: vendorData.tiktok_url || '',
            youtubeUrl: vendorData.youtube_url || '',
          });

          // Load service areas
          const { data: serviceAreas } = await supabase
            .from('vendor_service_areas')
            .select('city_id')
            .eq('vendor_id', vendorData.id);

          if (serviceAreas) {
            setSelectedCities(serviceAreas.map(area => area.city_id));
          }
        }
      } catch (error) {
        console.error('Error loading vendor data:', error);
        toast.error('Failed to load your profile');
      } finally {
        setLoading(false);
      }
    };

    loadVendorData();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get vendor ID
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!vendorData) throw new Error('Vendor not found');

      // Update vendor profile
      const { error: vendorError } = await supabase
        .from('vendors')
        .update({
          business_name: formData.businessName,
          category: formData.category,
          description: formData.description,
          location: formData.location,
          price_range: formData.priceRange,
          website_url: formData.websiteUrl,
          facebook_url: formData.facebookUrl,
          instagram_url: formData.instagramUrl,
          tiktok_url: formData.tiktokUrl,
          youtube_url: formData.youtubeUrl,
        })
        .eq('user_id', user.id);

      if (vendorError) throw vendorError;

      // Update service areas
      const { error: deleteError } = await supabase
        .from('vendor_service_areas')
        .delete()
        .eq('vendor_id', vendorData.id);

      if (deleteError) throw deleteError;

      if (selectedCities.length > 0) {
        const { error: insertError } = await supabase
          .from('vendor_service_areas')
          .insert(
            selectedCities.map(cityId => ({
              vendor_id: vendorData.id,
              city_id: cityId
            }))
          );

        if (insertError) throw insertError;
      }

      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-600">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b">
          <h1 className="text-2xl font-semibold">Business Settings</h1>
          <p className="text-gray-600">Update your business information</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
                Business Name
              </label>
              <input
                type="text"
                id="businessName"
                name="businessName"
                required
                value={formData.businessName}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category"
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select a category</option>
                <option value="Venues">Venues</option>
                <option value="Photography">Photography</option>
                <option value="Catering">Catering</option>
                <option value="Decor">Decor</option>
                <option value="Music">Music</option>
                <option value="Flowers">Flowers</option>
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Business Description
              </label>
              <textarea
                id="description"
                name="description"
                required
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                required
                value={formData.location}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Service Areas
              </label>
              <CitySelect
                selectedCities={selectedCities}
                onChange={setSelectedCities}
              />
            </div>

            <div>
              <label htmlFor="priceRange" className="block text-sm font-medium text-gray-700 mb-1">
                Price Range
              </label>
              <select
                id="priceRange"
                name="priceRange"
                required
                value={formData.priceRange}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="$">$ (Budget-Friendly)</option>
                <option value="$$">$$ (Moderate)</option>
                <option value="$$$">$$$ (Premium)</option>
                <option value="$$$$">$$$$ (Luxury)</option>
              </select>
            </div>

            {/* Social Links Section */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-medium mb-4">Website & Social Media</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center">
                      <Globe className="w-4 h-4 mr-2" />
                      Website URL
                    </div>
                  </label>
                  <input
                    type="url"
                    id="websiteUrl"
                    name="websiteUrl"
                    value={formData.websiteUrl}
                    onChange={handleChange}
                    placeholder="https://www.example.com"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="facebookUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center">
                      <Facebook className="w-4 h-4 mr-2" />
                      Facebook URL
                    </div>
                  </label>
                  <input
                    type="url"
                    id="facebookUrl"
                    name="facebookUrl"
                    value={formData.facebookUrl}
                    onChange={handleChange}
                    placeholder="https://www.facebook.com/yourbusiness"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="instagramUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center">
                      <Instagram className="w-4 h-4 mr-2" />
                      Instagram URL
                    </div>
                  </label>
                  <input
                    type="url"
                    id="instagramUrl"
                    name="instagramUrl"
                    value={formData.instagramUrl}
                    onChange={handleChange}
                    placeholder="https://www.instagram.com/yourbusiness"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="tiktokUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                      </svg>
                      TikTok URL
                    </div>
                  </label>
                  <input
                    type="url"
                    id="tiktokUrl"
                    name="tiktokUrl"
                    value={formData.tiktokUrl}
                    onChange={handleChange}
                    placeholder="https://www.tiktok.com/@yourbusiness"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="youtubeUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center">
                      <Youtube className="w-4 h-4 mr-2" />
                      YouTube URL
                    </div>
                  </label>
                  <input
                    type="url"
                    id="youtubeUrl"
                    name="youtubeUrl"
                    value={formData.youtubeUrl}
                    onChange={handleChange}
                    placeholder="https://www.youtube.com/@yourbusiness"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VendorSettings;