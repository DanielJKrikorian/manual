import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Save, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import type { Couple } from '../types';

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    partner1Name: '',
    partner2Name: '',
    location: '',
    weddingDate: '',
    budget: '',
  });

  useEffect(() => {
    const loadCoupleData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error('Please sign in to access settings');
          navigate('/couple/register');
          return;
        }

        // First check if this is a couple account
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (userError || !userData) {
          console.error('Error fetching user role:', userError);
          toast.error('Failed to verify account type');
          navigate('/');
          return;
        }

        if (userData.role !== 'couple') {
          toast.error('This page is only accessible to couple accounts');
          navigate('/dashboard');
          return;
        }

        const { data: coupleData, error: coupleError } = await supabase
          .from('couples')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (coupleError) {
          console.error('Error loading couple data:', coupleError);
          toast.error('Failed to load your profile');
          return;
        }

        if (!coupleData) {
          // If no couple profile exists, create one
          const { error: createError } = await supabase
            .from('couples')
            .insert([{
              user_id: user.id,
              partner1_name: '',
              partner2_name: '',
              location: '',
            }]);

          if (createError) {
            console.error('Error creating couple profile:', createError);
            toast.error('Failed to create couple profile');
            return;
          }

          // Use empty default values
          setFormData({
            partner1Name: '',
            partner2Name: '',
            location: '',
            weddingDate: '',
            budget: '',
          });
        } else {
          // Use existing data
          setFormData({
            partner1Name: coupleData.partner1_name || '',
            partner2Name: coupleData.partner2_name || '',
            location: coupleData.location || '',
            weddingDate: coupleData.wedding_date ? new Date(coupleData.wedding_date).toISOString().split('T')[0] : '',
            budget: coupleData.budget?.toString() || '',
          });
        }
      } catch (error) {
        console.error('Error loading couple data:', error);
        toast.error('Failed to load your profile');
      } finally {
        setLoading(false);
      }
    };

    loadCoupleData();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      const updates: Partial<Couple> = {
        partner1_name: formData.partner1Name,
        partner2_name: formData.partner2Name,
        location: formData.location,
        wedding_date: formData.weddingDate || null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
      };

      const { error } = await supabase
        .from('couples')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

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
          <h1 className="text-2xl font-semibold">Account Settings</h1>
          <p className="text-gray-600">Update your profile information</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="partner1Name" className="block text-sm font-medium text-gray-700 mb-1">
                Partner 1 Name
              </label>
              <input
                type="text"
                id="partner1Name"
                name="partner1Name"
                required
                value={formData.partner1Name}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="partner2Name" className="block text-sm font-medium text-gray-700 mb-1">
                Partner 2 Name
              </label>
              <input
                type="text"
                id="partner2Name"
                name="partner2Name"
                required
                value={formData.partner2Name}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Wedding Location
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
              <label htmlFor="weddingDate" className="block text-sm font-medium text-gray-700 mb-1">
                Wedding Date
              </label>
              <input
                type="date"
                id="weddingDate"
                name="weddingDate"
                value={formData.weddingDate}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
                Budget (Optional)
              </label>
              <input
                type="number"
                id="budget"
                name="budget"
                placeholder="Enter your wedding budget"
                value={formData.budget}
                onChange={handleChange}
                min="0"
                step="100"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
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

export default Settings;