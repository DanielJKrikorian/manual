import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Check, X, ArrowRight, Calendar, MapPin } from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface Lead {
  id: string;
  couple_id: string;
  partner1_name: string;
  partner2_name: string;
  location: string;
  wedding_date: string | null;
  last_message: string;
  created_at: string;
  status: 'pending' | 'accepted' | 'declined' | 'closed';
}

const VendorLeads = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'declined' | 'closed'>('all');

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/vendor/signin');
        return;
      }

      // Get leads using the messages_with_couples view
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages_with_couples')
        .select('*')
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Process and deduplicate leads
      const processedLeads = messagesData
        .filter(msg => msg.couple_id) // Filter out messages without couple data
        .reduce((acc: Lead[], msg) => {
          const existingLead = acc.find(lead => lead.couple_id === msg.couple_id);
          if (!existingLead) {
            acc.push({
              id: msg.id,
              couple_id: msg.couple_id,
              partner1_name: msg.partner1_name,
              partner2_name: msg.partner2_name,
              location: msg.location,
              wedding_date: msg.wedding_date,
              last_message: msg.content,
              created_at: msg.created_at,
              status: msg.status
            });
          }
          return acc;
        }, []);

      setLeads(processedLeads);
    } catch (error) {
      console.error('Error loading leads:', error);
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const handleLeadAction = async (leadId: string, status: 'accepted' | 'declined') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update all messages in the conversation
      const { error } = await supabase
        .from('messages')
        .update({ status })
        .eq('id', leadId);

      if (error) throw error;

      // Update local state
      setLeads(prev =>
        prev.map(lead =>
          lead.id === leadId ? { ...lead, status } : lead
        )
      );

      toast.success(`Lead ${status} successfully`);
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Failed to update lead');
    }
  };

  const filteredLeads = leads.filter(lead => 
    filter === 'all' ? true : lead.status === filter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-600">Loading leads...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-gray-600">Manage your incoming leads</p>
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'accepted', 'declined', 'closed'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              onClick={() => setFilter(status)}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {filteredLeads.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No leads found</h2>
          <p className="text-gray-600">
            {filter === 'all' 
              ? 'When couples contact you, their inquiries will appear here.'
              : `No ${filter} leads at the moment.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLeads.map((lead) => (
            <div key={lead.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">
                    {lead.partner1_name} & {lead.partner2_name}
                  </h3>
                  <div className="flex items-center gap-6 text-gray-600">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {lead.location}
                    </div>
                    {lead.wedding_date && (
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(lead.wedding_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600">{lead.last_message}</p>
                  <p className="text-sm text-gray-500">
                    Received {new Date(lead.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(lead.status)}`}>
                    {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                  </span>
                  <div className="flex gap-2">
                    {lead.status === 'pending' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleLeadAction(lead.id, 'declined')}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          className="text-green-600 bg-green-100 hover:bg-green-200"
                          onClick={() => handleLeadAction(lead.id, 'accepted')}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/messages')}
                    >
                      View Messages
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorLeads;