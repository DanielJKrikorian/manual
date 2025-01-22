import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

const CoupleSignIn = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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
      // First check if the user exists
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
        return;
      }

      if (!signInData.user) {
        toast.error('No user data returned');
        return;
      }

      // Verify this is a couple account
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .select('*')
        .eq('user_id', signInData.user.id)
        .maybeSingle();

      if (coupleError) {
        console.error('Error fetching couple data:', coupleError);
        toast.error('Failed to verify couple account');
        await supabase.auth.signOut();
        return;
      }

      if (!coupleData) {
        toast.error('This account is not registered as a couple');
        await supabase.auth.signOut();
        return;
      }

      toast.success('Signed in successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast.error('Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users2 className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Sign in to your Couple Account</h1>
        <p className="text-gray-600 mt-2">Welcome back! Please enter your details.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
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
              value={formData.password}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have a couple account?{' '}
            <button
              onClick={() => navigate('/couple/register')}
              className="text-primary hover:underline font-medium"
            >
              Register here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CoupleSignIn;