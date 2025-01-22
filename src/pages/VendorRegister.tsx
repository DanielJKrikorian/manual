import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';

const VendorRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSignIn, setIsSignIn] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    businessName: '',
    category: '',
    location: '',
    description: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignIn) {
        // Sign in existing user
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (signInError) {
          if (signInError.message.includes('Invalid login credentials')) {
            toast.error('Invalid email or password');
          } else {
            toast.error(signInError.message);
          }
          setLoading(false);
          return;
        }

        if (!signInData.user) {
          toast.error('No user data returned');
          setLoading(false);
          return;
        }

        // Check if user is a vendor
        const { data: vendorData, error: vendorError } = await supabase
          .from('vendors')
          .select('*')
          .eq('user_id', signInData.user.id);

        if (vendorError) {
          console.error('Error fetching vendor:', vendorError);
          toast.error('Failed to verify vendor status');
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        if (!vendorData || vendorData.length === 0) {
          toast.error('This account is not registered as a vendor');
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        toast.success('Signed in successfully!');
        navigate('/dashboard');
      } else {
        // Check if user exists first
        const { data: { user: existingUser } } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (existingUser) {
          toast.error('An account with this email already exists. Please sign in instead.');
          setIsSignIn(true);
          setLoading(false);
          return;
        }

        // Create new user
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              role: 'vendor'
            }
          }
        });

        if (signUpError) {
          toast.error(signUpError.message);
          setLoading(false);
          return;
        }

        if (!signUpData.user) {
          toast.error('No user data returned');
          setLoading(false);
          return;
        }

        // Create vendor profile
        const { error: vendorError } = await supabase
          .from('vendors')
          .insert([{
            user_id: signUpData.user.id,
            business_name: formData.businessName,
            category: formData.category,
            description: formData.description,
            location: formData.location,
            price_range: '$$$',
          }]);

        if (vendorError) {
          console.error('Failed to create vendor profile:', vendorError);
          await supabase.auth.signOut();
          toast.error('Failed to create vendor profile. Please try again.');
          setLoading(false);
          return;
        }

        toast.success('Registration successful! Please check your email to verify your account.');
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold mb-6">{isSignIn ? 'Sign In to Your Business Account' : 'List Your Business'}</h1>
        <p className="text-gray-600 mb-8">
          {isSignIn 
            ? 'Welcome back! Sign in to manage your wedding business profile.'
            : 'Join our marketplace and reach couples planning their perfect wedding day.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {!isSignIn && (
              <>
                <div>
                  <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                    Business Name
                  </label>
                  <input
                    type="text"
                    id="businessName"
                    name="businessName"
                    required
                    value={formData.businessName}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    required
                    value={formData.location}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Business Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    required
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading 
              ? (isSignIn ? 'Signing In...' : 'Creating Account...') 
              : (isSignIn ? 'Sign In' : 'Create Account')}
          </Button>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setIsSignIn(!isSignIn)}
              className="text-primary hover:underline"
            >
              {isSignIn 
                ? "Don't have an account? Create one" 
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VendorRegister;