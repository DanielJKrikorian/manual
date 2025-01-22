import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, DollarSign, Star, MessageSquare, Heart, Loader2, Globe, Facebook, Instagram, Youtube, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import type { Vendor } from '../types';

interface Review {
  id: string;
  rating: number;
  content: string;
  created_at: string;
  couple: {
    partner1_name: string;
    partner2_name: string;
  };
}

interface LeadFormData {
  partner1Name: string;
  partner2Name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  message: string;
}

const VendorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vendorData, setVendorData] = useState<Vendor | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [submittingLead, setSubmittingLead] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewFormData, setReviewFormData] = useState({
    rating: 5,
    content: ''
  });
  const [leadFormData, setLeadFormData] = useState<LeadFormData>({
    partner1Name: '',
    partner2Name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    message: ''
  });

  useEffect(() => {
    loadVendorData();
    checkUserAndSavedStatus();
    loadReviews();
  }, [id]);

  const loadVendorData = async () => {
    try {
      if (!id) return;

      const { data: vendor, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setVendorData(vendor);
    } catch (error) {
      console.error('Error loading vendor:', error);
      toast.error('Failed to load vendor profile');
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      if (!id) return;

      const { data: reviewsData, error } = await supabase
        .from('reviews')
        .select(`
          *,
          couple:couples (
            partner1_name,
            partner2_name
          )
        `)
        .eq('vendor_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(reviewsData || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  const checkUserAndSavedStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !id) return;

      // Get couple ID
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (coupleError && !coupleError.message.includes('contains 0 rows')) {
        throw coupleError;
      }

      if (coupleData) {
        setCoupleId(coupleData.id);

        // Check if vendor is saved
        const { data: savedVendor, error: savedError } = await supabase
          .from('saved_vendors')
          .select('id')
          .eq('couple_id', coupleData.id)
          .eq('vendor_id', id)
          .maybeSingle();

        if (savedError) throw savedError;
        setIsSaved(!!savedVendor);
      }
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };

  const toggleSave = async () => {
    try {
      setSavingFavorite(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to save vendors');
        navigate('/couple/register');
        return;
      }

      if (!coupleId) {
        toast.error('Please create a couple profile to save vendors');
        navigate('/couple/register');
        return;
      }

      if (isSaved) {
        // Remove from saved
        const { error } = await supabase
          .from('saved_vendors')
          .delete()
          .eq('couple_id', coupleId)
          .eq('vendor_id', id);

        if (error) throw error;
        toast.success('Removed from saved vendors');
      } else {
        // Add to saved
        const { error } = await supabase
          .from('saved_vendors')
          .insert([{
            couple_id: coupleId,
            vendor_id: id
          }]);

        if (error) throw error;
        toast.success('Added to saved vendors');
      }

      setIsSaved(!isSaved);
    } catch (error) {
      console.error('Error toggling save:', error);
      toast.error('Failed to update saved vendors');
    } finally {
      setSavingFavorite(false);
    }
  };

  const handleLeadFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorData) return;

    try {
      setSubmittingLead(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to send a message');
        navigate('/couple/register');
        return;
      }

      // Get vendor's user ID
      const { data: vendorUserData, error: vendorError } = await supabase
        .from('vendors')
        .select('user_id')
        .eq('id', vendorData.id)
        .single();

      if (vendorError) throw vendorError;

      // Create message with contact details
      const message = `Availability Check Request

Contact Details:
Partner 1: ${leadFormData.partner1Name}
Partner 2: ${leadFormData.partner2Name}
Email: ${leadFormData.email}
Phone: ${leadFormData.phone}

Preferred Date: ${leadFormData.date}
Preferred Time: ${leadFormData.time}

Message:
${leadFormData.message}`;

      const { error: messageError } = await supabase
        .from('messages')
        .insert([{
          sender_id: user.id,
          receiver_id: vendorUserData.user_id,
          content: message,
          status: 'pending'
        }]);

      if (messageError) throw messageError;

      toast.success('Message sent successfully!');
      setShowLeadForm(false);
      setLeadFormData({
        partner1Name: '',
        partner2Name: '',
        email: '',
        phone: '',
        date: '',
        time: '',
        message: ''
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSubmittingLead(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorData || !coupleId) return;

    try {
      setSubmittingReview(true);

      const { error } = await supabase
        .from('reviews')
        .insert([{
          vendor_id: vendorData.id,
          couple_id: coupleId,
          rating: reviewFormData.rating,
          content: reviewFormData.content
        }]);

      if (error) throw error;

      toast.success('Review submitted successfully!');
      setShowReviewForm(false);
      setReviewFormData({ rating: 5, content: '' });
      loadReviews(); // Reload reviews to show the new one
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-600">Loading vendor profile...</p>
      </div>
    );
  }

  if (!vendorData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-600">Vendor not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="relative h-80 rounded-xl overflow-hidden">
        <img
          src={vendorData.images[0] || "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=80"}
          alt={vendorData.business_name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{vendorData.business_name}</h1>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="ml-1">{vendorData.rating.toFixed(1)} ({reviews.length} reviews)</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-5 h-5" />
                  <span className="ml-1">{vendorData.location}</span>
                </div>
                <div className="flex items-center">
                  <DollarSign className="w-5 h-5" />
                  <span className="ml-1">{vendorData.price_range}</span>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              className="bg-white/10 backdrop-blur-sm hover:bg-white/20"
              onClick={toggleSave}
              disabled={savingFavorite}
            >
              {savingFavorite ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Heart className={`w-5 h-5 ${isSaved ? 'fill-current text-red-500' : ''}`} />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* About */}
          <section className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">About Us</h2>
            <p className="text-gray-600">{vendorData.description}</p>

            {/* Social Links */}
            {(vendorData.website_url ||
              vendorData.facebook_url ||
              vendorData.instagram_url ||
              vendorData.tiktok_url ||
              vendorData.youtube_url) && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-medium mb-4">Connect With Us</h3>
                <div className="flex flex-wrap gap-4">
                  {vendorData.website_url && (
                    <a
                      href={vendorData.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-gray-600 hover:text-primary"
                    >
                      <Globe className="w-5 h-5 mr-2" />
                      Website
                    </a>
                  )}
                  {vendorData.facebook_url && (
                    <a
                      href={vendorData.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-gray-600 hover:text-[#1877F2]"
                    >
                      <Facebook className="w-5 h-5 mr-2" />
                      Facebook
                    </a>
                  )}
                  {vendorData.instagram_url && (
                    <a
                      href={vendorData.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-gray-600 hover:text-[#E4405F]"
                    >
                      <Instagram className="w-5 h-5 mr-2" />
                      Instagram
                    </a>
                  )}
                  {vendorData.tiktok_url && (
                    <a
                      href={vendorData.tiktok_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-gray-600 hover:text-black"
                    >
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                      </svg>
                      TikTok
                    </a>
                  )}
                  {vendorData.youtube_url && (
                    <a
                      href={vendorData.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-gray-600 hover:text-[#FF0000]"
                    >
                      <Youtube className="w-5 h-5 mr-2" />
                      YouTube
                    </a>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Gallery */}
          <section className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">Gallery</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {vendorData.images.length > 0 ? (
                vendorData.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Gallery ${index + 1}`}
                    className="rounded-lg w-full h-32 object-cover"
                  />
                ))
              ) : (
                <p className="col-span-full text-center text-gray-600 py-8">
                  No gallery images available
                </p>
              )}
            </div>
          </section>

          {/* Reviews */}
          <section className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Reviews</h2>
              {coupleId && !showReviewForm && (
                <Button onClick={() => setShowReviewForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Review
                </Button>
              )}
            </div>

            {showReviewForm && (
              <form onSubmit={handleReviewSubmit} className="mb-8 bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium mb-4">Write a Review</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rating
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewFormData(prev => ({ ...prev, rating: star }))}
                        className="text-yellow-400"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= reviewFormData.rating ? 'fill-current' : 'stroke-current fill-none'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Review
                  </label>
                  <textarea
                    required
                    value={reviewFormData.content}
                    onChange={(e) => setReviewFormData(prev => ({ ...prev, content: e.target.value }))}
                    rows={4}
                    placeholder="Share your experience..."
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowReviewForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submittingReview}
                  >
                    {submittingReview ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Review'
                    )}
                  </Button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {reviews.length === 0 ? (
                <p className="text-center text-gray-600 py-8">
                  No reviews yet. Be the first to review this vendor!
                </p>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="border-b last:border-0 pb-4">
                    <div className="flex items-center mb-2">
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
                      <span className="ml-2 text-gray-600">
                        • {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-600">{review.content}</p>
                    {review.couple && (
                      <p className="text-sm font-medium mt-1">
                        - {review.couple.partner1_name} & {review.couple.partner2_name}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            {showLeadForm ? (
              <form onSubmit={handleLeadFormSubmit} className="space-y-4">
                <h3 className="font-semibold mb-4">Check Availability</h3>
                
                {/* Contact Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Partner 1 Name
                    </label>
                    <input
                      type="text"
                      required
                      value={leadFormData.partner1Name}
                      onChange={(e) => setLeadFormData(prev => ({ ...prev, partner1Name: e.target.value }))}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Partner 2 Name
                    </label>
                    <input
                      type="text"
                      required
                      value={leadFormData.partner2Name}
                      onChange={(e) => setLeadFormData(prev => ({ ...prev, partner2Name: e.target.value }))}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={leadFormData.email}
                      onChange={(e) => setLeadFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={leadFormData.phone}
                      onChange={(e) => setLeadFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      required
                      value={leadFormData.date}
                      onChange={(e) => setLeadFormData(prev => ({ ...prev, date: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preferred Time
                    </label>
                    <input
                      type="time"
                      required
                      value={leadFormData.time}
                      onChange={(e) => setLeadFormData(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    required
                    value={leadFormData.message}
                    onChange={(e) => setLeadFormData(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                    placeholder="Tell us about your event..."
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowLeadForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={submittingLead}
                  >
                    {submittingLead ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Request'
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <>
                <Button className="w-full mb-3" onClick={() => setShowLeadForm(true)}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Check Availability
                </Button>
                <Button variant="outline" className="w-full" onClick={() => navigate('/messages')}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message Vendor
                </Button>
              </>
            )}
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="font-semibold mb-4">Business Hours</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Monday - Friday</span>
                <span>9:00 AM - 6:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span>Saturday</span>
                <span>10:00 AM - 4:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span>Sunday</span>
                <span>Closed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorProfile;