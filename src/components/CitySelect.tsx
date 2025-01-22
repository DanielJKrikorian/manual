import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface City {
  id: string;
  name: string;
  state: string;
}

interface CitySelectProps {
  selectedCities: string[];
  onChange: (cityIds: string[]) => void;
  className?: string;
}

const CitySelect = ({ selectedCities, onChange, className = '' }: CitySelectProps) => {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState<string>('');

  useEffect(() => {
    const loadCities = async () => {
      try {
        const { data, error } = await supabase
          .from('cities')
          .select('*')
          .order('state')
          .order('name');

        if (error) throw error;
        setCities(data || []);
      } catch (error) {
        console.error('Error loading cities:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCities();
  }, []);

  const handleCityToggle = (cityId: string) => {
    const newSelection = selectedCities.includes(cityId)
      ? selectedCities.filter(id => id !== cityId)
      : [...selectedCities, cityId];
    onChange(newSelection);
  };

  // Get unique states
  const states = Array.from(new Set(cities.map(city => city.state))).sort();

  // Filter cities by selected state
  const filteredCities = selectedState
    ? cities.filter(city => city.state === selectedState)
    : cities;

  if (loading) {
    return (
      <div className="space-y-4">
        <select disabled className={className}>
          <option>Loading states...</option>
        </select>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* State Selection */}
      <div>
        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All States</option>
          {states.map(state => (
            <option key={state} value={state}>{state}</option>
          ))}
        </select>
      </div>

      {/* Cities Grid */}
      <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {filteredCities.map(city => (
            <label
              key={city.id}
              className="flex items-start space-x-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedCities.includes(city.id)}
                onChange={() => handleCityToggle(city.id)}
                className="mt-1 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div className="text-sm">
                <div className="font-medium">{city.name}</div>
                <div className="text-gray-500 text-xs">{city.state}</div>
              </div>
            </label>
          ))}
        </div>

        {filteredCities.length === 0 && (
          <p className="text-center text-gray-500 py-4">
            No cities found for the selected state
          </p>
        )}
      </div>

      {/* Selected Count */}
      <div className="text-sm text-gray-600">
        {selectedCities.length} {selectedCities.length === 1 ? 'city' : 'cities'} selected
      </div>
    </div>
  );
};

export default CitySelect;