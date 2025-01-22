import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, MapPin, Users2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface Appointment {
  id: string;
  couple_id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  couple: {
    partner1_name: string;
    partner2_name: string;
    location: string;
  };
}

const VendorCalendar = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<'list' | 'calendar'>('list');

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/vendor/signin');
        return;
      }

      // Get vendor ID
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!vendorData) {
        toast.error('Vendor profile not found');
        return;
      }

      // Get appointments with couple details
      const { data: appointmentsData, error } = await supabase
        .from('appointments')
        .select(`
          *,
          couple:couples (
            partner1_name,
            partner2_name,
            location
          )
        `)
        .eq('vendor_id', vendorData.id)
        .order('start_time', { ascending: true });

      if (error) throw error;

      setAppointments(appointmentsData);
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, status: 'confirmed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId);

      if (error) throw error;

      setAppointments(prev =>
        prev.map(app =>
          app.id === appointmentId ? { ...app, status } : app
        )
      );

      toast.success(`Appointment ${status}`);
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Failed to update appointment');
    }
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-600">Loading appointments...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Appointments</h1>
          <p className="text-gray-600">Manage your appointments with couples</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            onClick={() => setView('list')}
          >
            List View
          </Button>
          <Button
            variant={view === 'calendar' ? 'default' : 'outline'}
            onClick={() => setView('calendar')}
          >
            Calendar View
          </Button>
        </div>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No appointments yet</h2>
          <p className="text-gray-600">
            When couples book appointments with you, they'll appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold mb-2">{appointment.title}</h3>
                  <div className="space-y-2 text-gray-600">
                    <div className="flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {formatDate(appointment.start_time)}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                    </div>
                    <div className="flex items-center">
                      <Users2 className="w-4 h-4 mr-2" />
                      {appointment.couple.partner1_name} & {appointment.couple.partner2_name}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {appointment.couple.location}
                    </div>
                  </div>
                  {appointment.description && (
                    <p className="mt-4 text-gray-600">{appointment.description}</p>
                  )}
                </div>
                <div className="flex flex-col items-end space-y-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(appointment.status)}`}>
                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                  </span>
                  {appointment.status === 'pending' && (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                      >
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                      >
                        Confirm
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorCalendar;