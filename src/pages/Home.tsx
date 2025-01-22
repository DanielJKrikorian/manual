import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, MessageSquare, Star } from 'lucide-react';
import { Button } from '../components/ui/button';

const Home = () => {
  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="text-center space-y-8">
        <h1 className="text-5xl font-bold text-gray-900">
          Find Your Perfect Wedding Vendors
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Connect with trusted wedding professionals who will make your special day unforgettable
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/vendors">
            <Button size="lg">Start Planning</Button>
          </Link>
          <Link to="/vendor/register">
            <Button size="lg" variant="outline">List Your Business</Button>
          </Link>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            image: "https://images.unsplash.com/photo-1519741497674-611481863552",
            title: "Venues",
          },
          {
            image: "https://images.unsplash.com/photo-1514849302-984523450cf4",
            title: "Photography",
          },
          {
            image: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9",
            title: "Catering",
          },
        ].map((category) => (
          <div key={category.title} className="relative group overflow-hidden rounded-lg">
            <img
              src={`${category.image}?auto=format&fit=crop&w=800&q=80`}
              alt={category.title}
              className="w-full h-64 object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <h3 className="text-white text-2xl font-semibold">{category.title}</h3>
            </div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {[
          {
            icon: <Search className="w-8 h-8 text-rose-500" />,
            title: "Easy Search",
            description: "Find and compare vendors based on your preferences and budget",
          },
          {
            icon: <Calendar className="w-8 h-8 text-rose-500" />,
            title: "Smart Booking",
            description: "Schedule appointments and manage bookings in one place",
          },
          {
            icon: <MessageSquare className="w-8 h-8 text-rose-500" />,
            title: "Direct Communication",
            description: "Chat with vendors and discuss your requirements seamlessly",
          },
        ].map((feature) => (
          <div key={feature.title} className="text-center space-y-4">
            <div className="flex justify-center">{feature.icon}</div>
            <h3 className="text-xl font-semibold">{feature.title}</h3>
            <p className="text-gray-600">{feature.description}</p>
          </div>
        ))}
      </section>

      {/* Testimonials */}
      <section className="bg-gray-100 rounded-2xl p-12">
        <h2 className="text-3xl font-bold text-center mb-12">What Couples Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            {
              quote: "Found our dream venue and photographer in just one day. The platform made everything so easy!",
              author: "Sarah & Michael",
              rating: 5,
            },
            {
              quote: "The vendor comparison feature helped us make informed decisions within our budget.",
              author: "Emma & James",
              rating: 5,
            },
          ].map((testimonial) => (
            <div key={testimonial.author} className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex text-yellow-400 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">"{testimonial.quote}"</p>
              <p className="font-medium">{testimonial.author}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;