import React, { useState, useEffect } from 'react';
import { Send, Check, X, Lock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  status: 'pending' | 'accepted' | 'declined' | 'closed';
  created_at: string;
}

interface Conversation {
  user_id: string;
  name: string;
  last_message?: string;
  unread?: number;
  status: 'pending' | 'accepted' | 'declined' | 'closed';
}

const Messages = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'vendor' | 'couple' | null>(null);

  useEffect(() => {
    checkUserRole();
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation]);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user is a vendor
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (vendorData) {
        setUserRole('vendor');
        return;
      }

      // Check if user is a couple
      const { data: coupleData } = await supabase
        .from('couples')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (coupleData) {
        setUserRole('couple');
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const loadConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          receiver_id,
          content,
          status,
          created_at
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group messages by conversation
      const conversationsMap = new Map<string, Conversation>();
      messages?.forEach(message => {
        const otherId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
        if (!conversationsMap.has(otherId)) {
          conversationsMap.set(otherId, {
            user_id: otherId,
            name: `User ${otherId.slice(0, 4)}...`,
            last_message: message.content,
            unread: message.sender_id !== user.id ? 1 : 0,
            status: message.status
          });
        }
      });

      setConversations(Array.from(conversationsMap.values()));
      setLoading(false);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversations');
      setLoading(false);
    }
  };

  const loadMessages = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const handleLeadAction = async (status: 'accepted' | 'declined' | 'closed') => {
    if (!selectedConversation) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update all messages in the conversation
      const { error } = await supabase
        .from('messages')
        .update({ status })
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedConversation}),and(sender_id.eq.${selectedConversation},receiver_id.eq.${user.id})`);

      if (error) throw error;

      // Update local state
      setMessages(prev => prev.map(msg => ({ ...msg, status })));
      setConversations(prev =>
        prev.map(conv =>
          conv.user_id === selectedConversation
            ? { ...conv, status }
            : conv
        )
      );

      // Send automatic response based on action
      let response = '';
      if (status === 'accepted') {
        response = "Thank you for your interest! I'd love to work with you. Let's discuss the details.";
      } else if (status === 'declined') {
        response = "Thank you for your interest, but I'm unable to take on this project at the moment.";
      } else if (status === 'closed') {
        response = "This lead has been closed by the couple.";
      }

      if (response) {
        await sendMessage(response);
      }
      
      toast.success(`Lead ${status} successfully`);
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast.error('Failed to update lead status');
    }
  };

  const sendMessage = async (content = newMessage) => {
    if (!content.trim() || !selectedConversation) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to send messages');
        return;
      }

      // Check if conversation is closed
      const currentStatus = messages[0]?.status;
      if (currentStatus === 'closed') {
        toast.error('This conversation has been closed');
        return;
      }

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedConversation,
          content: content.trim(),
          status: currentStatus || 'pending'
        });

      if (error) throw error;

      setNewMessage('');
      loadMessages(selectedConversation);
      loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Accepted</span>;
      case 'declined':
        return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Declined</span>;
      case 'closed':
        return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">Closed</span>;
      default:
        return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Pending</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-12rem)] bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="flex h-full">
        {/* Conversations List */}
        <div className="w-1/3 border-r">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Messages</h2>
          </div>
          <div className="overflow-y-auto h-[calc(100%-4rem)]">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading conversations...</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No conversations yet</div>
            ) : (
              conversations.map((conversation) => (
                <button
                  key={conversation.user_id}
                  onClick={() => setSelectedConversation(conversation.user_id)}
                  className={`w-full p-4 text-left hover:bg-gray-50 ${
                    selectedConversation === conversation.user_id ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{conversation.name}</h3>
                      <p className="text-sm text-gray-600 truncate">{conversation.last_message}</p>
                      {getStatusBadge(conversation.status)}
                    </div>
                    {conversation.unread ? (
                      <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                        {conversation.unread}
                      </span>
                    ) : null}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-medium">
                  {conversations.find(c => c.user_id === selectedConversation)?.name}
                </h3>
                {messages[0]?.status !== 'closed' && (
                  <div className="flex gap-2">
                    {userRole === 'vendor' && messages[0]?.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleLeadAction('declined')}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          className="text-green-600 bg-green-100 hover:bg-green-200"
                          onClick={() => handleLeadAction('accepted')}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                      </>
                    )}
                    {userRole === 'couple' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-gray-600 hover:bg-gray-50"
                        onClick={() => handleLeadAction('closed')}
                      >
                        <Lock className="w-4 h-4 mr-1" />
                        Close Lead
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === selectedConversation ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        message.sender_id === selectedConversation
                          ? 'bg-gray-100'
                          : 'bg-primary text-white'
                      }`}
                    >
                      <p>{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder={messages[0]?.status === 'closed' ? 'This conversation is closed' : 'Type a message...'}
                    disabled={messages[0]?.status === 'closed'}
                    className="flex-1 px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                  <Button 
                    onClick={() => sendMessage()}
                    disabled={messages[0]?.status === 'closed'}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;