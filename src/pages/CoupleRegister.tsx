import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';

const CoupleRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSignIn, setIsSignIn] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    partner1Name: '',
    partner2Name: '',
    location: '',
    weddingDate: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

        // Check if user is a couple
        const { data: coupleData, error: coupleError } = await supabase
          .from('couples')
          .select('*')
          .eq('user_id', signInData.user.id)
          .maybeSingle();

        if (coupleError && !coupleError.message.includes('contains 0 rows')) {
          console.error('Error fetching couple:', coupleError);
          toast.error('Failed to verify couple account');
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        if (!coupleData) {
          toast.error('This account is not registered as a couple');
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        toast.success('Signed in successfully!');
        navigate('/dashboard');
      } else {
        // Create new user
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              role: 'couple'
            }
          }
        });

        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            toast.error('An account with this email already exists. Please sign in instead.');
            setIsSignIn(true);
          } else {
            toast.error(signUpError.message);
          }
          setLoading(false);
          return;
        }

        if (!signUpData.user) {
          toast.error('No user data returned');
          setLoading(false);
          return;
        }

        // Create couple profile
        const { error: coupleError } = await supabase
          .from('couples')
          .insert([{
            user_id: signUpData.user.id,
            partner1_name: formData.partner1Name,
            partner2_name: formData.partner2Name,
            location: formData.location,
            wedding_date: formData.weddingDate || null,
          }]);

        if (coupleError) {
          console.error('Failed to create couple profile:', coupleError);
          await supabase.auth.signOut();
          toast.error('Failed to create couple profile. Please try again.');
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
        <h1 className="text-3xl font-bold mb-6">
          {isSignIn ? 'Sign In to Your Account' : 'Create Your Couple Account'}
        </h1>
        <p className="text-gray-600 mb-8">
          {isSignIn 
            ? 'Welcome back! Sign in to continue planning your wedding.'
            : 'Start your wedding planning journey with us.'}
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
                  <label htmlFor="partner1Name" className="block text-sm font-medium text-gray-700">
                    Partner 1 Name
                  </label>
                  <input
                    type="text"
                    id="partner1Name"
                    name="partner1Name"
                    required
                    value={formData.partner1Name}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="partner2Name" className="block text-sm font-medium text-gray-700">
                    Partner 2 Name
                  </label>
                  <input
                    type="text"
                    id="partner2Name"
                    name="partner2Name"
                    required
                    value={formData.partner2Name}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                    Wedding Location
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
                  <label htmlFor="weddingDate" className="block text-sm font-medium text-gray-700">
                    Wedding Date (Optional)
                  </label>
                  <input
                    type="date"
                    id="weddingDate"
                    name="weddingDate"
                    value={formData.weddingDate}
                    onChange={handleChange}
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

export default CoupleRegister;