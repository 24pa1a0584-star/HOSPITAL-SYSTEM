import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { doctorApi, hospitalApi } from '../../services/api';
import { Doctor, Hospital } from '../../types';
import { DoctorCard } from '../../components/doctors/DoctorCard';
import { BookingModal } from '../../components/booking/BookingModal';
import { Search, Filter, Stethoscope, SlidersHorizontal, RefreshCcw } from 'lucide-react';

export const FindDoctorsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [specialization, setSpecialty] = useState(searchParams.get('specialization') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [maxFee, setMaxFee] = useState<string>('');
  const [sortBy, setSortBy] = useState('experience');

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialtiesList, setSpecialtiesList] = useState<string[]>([]);
  const [hospitalsList, setHospitalsList] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState<Doctor | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Fetch reference lists (specialties, hospitals)
  useEffect(() => {
    hospitalApi.getSpecialties().then((res) => {
      if (res.data.success) setSpecialtiesList(res.data.specialties || []);
    });
    hospitalApi.listHospitals().then((res) => {
      if (res.data.success) setHospitalsList(res.data.hospitals || []);
    });
  }, []);

  const loadDoctors = () => {
    setLoading(true);
    const params: any = {
      search: searchQuery || undefined,
      specialization: specialization || undefined,
      city: city || undefined,
      maxFee: maxFee ? Number(maxFee) : undefined,
      sortBy,
    };

    doctorApi
      .searchDoctors(params)
      .then((res) => {
        if (res.data.success) {
          setDoctors(res.data.doctors || []);
        }
      })
      .catch((err) => {
        console.error('Failed to search doctors:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDoctors();
  }, [specialization, city, maxFee, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDoctors();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSpecialty('');
    setCity('');
    setMaxFee('');
    setSortBy('experience');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div>
        <span className="text-xs font-bold text-teal-healing uppercase tracking-wider block mb-1">
          Medical Directory
        </span>
        <h1 className="font-headline font-bold text-3xl sm:text-4xl text-navy-deep">
          Find Verified Doctors
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Browse certified specialists, check genuine OPD consultation slots, and book your hospital appointment.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Text Search */}
          <div className="md:col-span-4 relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search doctor name or specialty..."
              className="w-full pl-11 pr-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-healing/30"
            />
          </div>

          {/* Specialization Filter */}
          <div className="md:col-span-3">
            <select
              value={specialization}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-healing/30"
            >
              <option value="">All Specialties</option>
              {specialtiesList.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* City / Branch Filter */}
          <div className="md:col-span-3">
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-healing/30"
            >
              <option value="">All Hospital Cities</option>
              <option value="Delhi">New Delhi</option>
              <option value="Bengaluru">Bengaluru</option>
            </select>
          </div>

          {/* Search Button */}
          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-2xl font-bold text-sm text-white bg-teal-healing hover:bg-teal-700 transition-colors shadow-sm"
            >
              Search
            </button>
          </div>
        </form>

        {/* Secondary Filters Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-bold text-slate-500 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Sort By:
            </span>
            <button
              onClick={() => setSortBy('experience')}
              className={`px-3 py-1 rounded-full font-semibold transition-colors ${
                sortBy === 'experience'
                  ? 'bg-navy-deep text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Experience
            </button>
            <button
              onClick={() => setSortBy('fee_asc')}
              className={`px-3 py-1 rounded-full font-semibold transition-colors ${
                sortBy === 'fee_asc'
                  ? 'bg-navy-deep text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Fee: Low to High
            </button>
            <button
              onClick={() => setSortBy('fee_desc')}
              className={`px-3 py-1 rounded-full font-semibold transition-colors ${
                sortBy === 'fee_desc'
                  ? 'bg-navy-deep text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Fee: High to Low
            </button>
          </div>

          <button
            onClick={handleResetFilters}
            className="text-xs font-semibold text-slate-500 hover:text-teal-healing flex items-center gap-1"
          >
            <RefreshCcw className="w-3 h-3" /> Reset Filters
          </button>
        </div>
      </div>

      {/* Results Section */}
      {loading ? (
        <div className="py-24 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-teal-healing/20 border-t-teal-healing rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Loading verified specialists...</p>
        </div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <Stethoscope className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-headline font-bold text-xl text-navy-deep">No Doctors Match Your Filters</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search terms, changing the city filter, or clearing specialization criteria.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-500">
              Showing {doctors.length} Verified Specialist{doctors.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {doctors.map((doc) => (
              <DoctorCard
                key={doc._id}
                doctor={doc}
                onBookClick={(d) => {
                  setSelectedDoctorForBooking(d);
                  setIsBookingModalOpen(true);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal
        doctor={selectedDoctorForBooking}
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setSelectedDoctorForBooking(null);
        }}
      />
    </div>
  );
};
