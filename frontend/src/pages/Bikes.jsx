import { useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "../context/AuthContext";
import { 
  Bike, 
  LogOut, 
  Clock, 
  DollarSign, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle 
} from 'lucide-react';
import { API_ENDPOINTS } from "../config/api";

const BookingCountdown = ({ endTime, status }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (status !== 'active') return;

    const calculateTime = () => {
      const difference = new Date(endTime) - new Date();

      if (difference < 0) {
        setTimeLeft('Completed');
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      let displayString = '';
      if (hours > 0) displayString += `${hours}h `;
      displayString += `${minutes}m ${seconds}s`;
      setTimeLeft(displayString);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [endTime, status]);

  if (status !== 'active') {
    return (
       <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
        status === 'cancelled' 
          ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
          : 'bg-slate-700/30 text-slate-400 border border-slate-700/20'
      }`}>
        {status}
      </span>
    );
  }

  if (timeLeft === 'Completed') {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase bg-slate-700/30 text-slate-400 border border-slate-700/20">
        Completed
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-sm font-semibold animate-pulse">
      <Clock className="w-4 h-4 text-emerald-500" />
      <span>{timeLeft || 'Calculating...'}</span>
    </div>
  );
}

const Bikes = () => {
  const { token, user, logoutUser } = useContext(AuthContext);

  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
    
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' or 'bookings'
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedBike, setSelectedBike] = useState(null);
  const [bookingDuration, setBookingDuration] = useState(1);
  const [bookingInProgress, setBookingInProgress] = useState(false);
    
  const [notification, setNotification] = useState(null);
  
  // 1. Toast Notification Helper
  const showToast = (type, message) => {
    setNotification({ type, message });

    setTimeout(() => {
      setNotification(null);
    }, 6000)
  };

  // 2. Fetch the user's booking history from the backend
  const fetchBookings = useCallback(async () => {
    try {
      setBookingsLoading(true);
      const res = await fetch(API_ENDPOINTS.BOOKINGS.USER_BOOKINGS, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch bookings.');
      }
      setBookings(data);
    } catch (err) {
      setBookingsError(err.message);
    } finally {
      setBookingsLoading(false);
    }
  }, [token]);

  // Standalone Fetch Bikes function
  const fetchBikes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(API_ENDPOINTS.BIKES.LIST, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch bikes.');
      }
      setBikes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // 3. Send booking request to backend (with OCC Concurrency handling)
  const handleBookBike = async () => {
    if (!selectedBike) return;
    setBookingInProgress(true);

    try {
      const res = await fetch(API_ENDPOINTS.BOOKINGS.CREATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bikeId: selectedBike._id,
          duration: bookingDuration
        })
      });

      const data = await res.json();

      // Catch 409 Conflict (Optimistic Concurrency Control failure)
      if (res.status === 409) {
        showToast('error', data.message || 'Someone else booked this bike just a second ago! Please try another.');
        setShowModal(false);
        fetchBikes();
        return;
      }

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create booking.');
      }

      // Success flow
      showToast('success', `Bike "${selectedBike.name}" has been booked successfully!`);
      setShowModal(false);

      // Refresh catalog and bookings lists
      await Promise.all([fetchBikes(), fetchBookings()]);

      // Auto-switch to rentals tab to let the user see their countdown timer
      setActiveTab('bookings');

    } catch (err) {
      showToast('error', err.message);
    } finally {
      setBookingInProgress(false);
    }
  };

  // 4. Cancel active booking request
  const handleCancelBooking = async (bookingId, bikeName) => {
    if (!window.confirm(`Are you sure you want to cancel your rental for ${bikeName}?`)) {
      return;
    }
    
    try {
      const res = await fetch(API_ENDPOINTS.BOOKINGS.CANCEL(bookingId), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to cancel booking.');
      }

      showToast('success', `Booking cancelled. The bike is now available.`);
      await Promise.all([fetchBikes(), fetchBookings()]);
    } catch (err) {
      showToast('error', err.message);
    }
  };
  
  // 5. Open Booking modal helper
  const openBookingModal = (bike) => {
    setSelectedBike(bike);
    setBookingDuration(1);
    setShowModal(true);
  }
  
  // 6. Time and Date Formatter Helper
  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  // Initial Data Loader
  useEffect(() => {
    if (token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      Promise.all([fetchBikes(), fetchBookings()]).catch(() => {
        // Handled inside individual fetch functions
      });
    }
  }, [token, fetchBikes, fetchBookings]);

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
    
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium">Loading bikes catalog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col relative overflow-x-hidden">
      
      {/* 🚀 FLOATING TOAST NOTIFICATIONS */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-bounce shadow-2xl">
          <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border text-sm max-w-md backdrop-blur-md ${
            notification.type === 'success' 
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200' 
              : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <div>
              <p className="font-bold">{notification.type === 'success' ? 'Success' : 'Booking Error'}</p>
              <p className="text-xs opacity-90 mt-0.5">{notification.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* 1. TOP NAVBAR */}
      <nav className="bg-slate-800 border-b border-slate-700 py-4 px-6 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500 p-2 rounded-lg">
            <Bike className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">BikeGo</span>
        </div>
        
        <div className="flex items-center gap-6">
          <span className="text-sm text-slate-300 hidden sm:inline">
            Hello, <span className="text-emerald-400 font-semibold">{user?.username}</span>!
          </span>
          <button
            onClick={logoutUser}
            className="flex items-center gap-2 bg-slate-700/50 hover:bg-red-500/20 hover:text-red-300 border border-slate-600 hover:border-red-500/30 px-4 py-2 rounded-xl text-sm font-semibold transition duration-150"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </nav>

      {/* 2. SUB-HEADER / TAB NAVIGATION */}
      <header className="bg-slate-800/40 border-b border-slate-700/30 py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {activeTab === 'browse' ? 'Rent a Bike' : 'My Rentals Dashboard'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {activeTab === 'browse' 
                ? 'Select a bike to reserve a slot immediately.' 
                : 'Track and manage your active and past reservations.'
              }
            </p>
          </div>
          {/* Tab Controller Buttons */}
          <div className="bg-slate-800 p-1.5 rounded-2xl border border-slate-700 flex gap-1 self-start sm:self-center">
            <button
              onClick={() => setActiveTab('browse')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition duration-150 ${
                activeTab === 'browse' 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              Browse Catalog
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition duration-150 flex items-center gap-1.5 ${
                activeTab === 'bookings' 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              My Rentals
              {bookings.filter(b => b.status === 'active').length > 0 && (
                <span className="bg-emerald-400/20 text-emerald-400 border border-emerald-400/30 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold animate-pulse">
                  {bookings.filter(b => b.status === 'active').length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 3. MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        
        {/* Error Alert Box */}
        {activeTab === 'browse' && error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl mb-8 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}
        {activeTab === 'bookings' && bookingsError && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl mb-8 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <span className="text-sm font-medium">{bookingsError}</span>
          </div>
        )}

        {/* LOADING STATE */}
        {((activeTab === 'browse' && loading) || (activeTab === 'bookings' && bookingsLoading)) ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 text-sm font-medium">Fetching details...</p>
          </div>
        ) : activeTab === 'browse' ? (
          
          /* ---------------- TAB: BROWSE CATALOG ---------------- */
          bikes.length === 0 ? (
            <div className="bg-slate-800/40 rounded-2xl border border-slate-700/50 p-12 text-center max-w-md mx-auto mt-12">
              <HelpCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white">No bikes available</h3>
              <p className="text-slate-400 text-sm mt-1">Please try again later or check server connection.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bikes.map((bike) => (
                <div 
                  key={bike._id} 
                  className="bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-700 flex flex-col transition duration-200 hover:-translate-y-1 hover:border-slate-600"
                >
                  {/* Bike Image */}
                  <img 
                    src={bike.image} 
                    alt={bike.name} 
                    className="w-full h-48 object-cover"
                  />
                  {/* Card Body */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    
                    {/* Title and Badge */}
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h3 className="text-lg font-bold text-white leading-tight">{bike.name}</h3>
                        
                        {/* Status Badge */}
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap border ${
                          bike.status === 'available' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}>
                          {bike.status === 'available' ? 'Available' : 'Booked'}
                        </span>
                      </div>
                      {/* Bike Type Tag */}
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-4">
                        {bike.type} Bike
                      </p>
                    </div>

                    {/* Pricing & Actions */}
                    <div>
                      <div className="flex justify-between items-center border-t border-slate-700/60 pt-4 mb-4">
                        <div className="flex items-center text-slate-400 text-sm">
                          <Clock className="w-4 h-4 mr-1 text-slate-500" />
                          <span>Hourly Rate</span>
                        </div>
                        <div className="flex items-center text-white font-extrabold text-lg">
                          <DollarSign className="w-4 h-4 text-emerald-400" />
                          <span>{bike.hourlyRate.toFixed(2)}/hr</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      {bike.status === 'available' ? (
                        <button
                          onClick={() => openBookingModal(bike)}
                          className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-bold py-2.5 rounded-xl transition duration-150 shadow-lg shadow-emerald-500/20 text-sm"
                        >
                          Book Now
                        </button>
                      ) : (
                        <button
                          disabled
                          className="w-full bg-slate-700 text-slate-400 cursor-not-allowed py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"
                        >
                          <Clock className="w-4 h-4 text-slate-500" />
                          Unavailable (Free {formatTime(bike.availableAt)})
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          
          /* ---------------- TAB: MY RENTALS ---------------- */
          bookings.length === 0 ? (
            <div className="bg-slate-800/40 rounded-2xl border border-slate-700/50 p-12 text-center max-w-md mx-auto mt-12">
              <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white">No rental history</h3>
              <p className="text-slate-400 text-sm mt-1">You haven't reserved any bikes yet. Go to the Catalog to place a booking!</p>
              <button
                onClick={() => setActiveTab('browse')}
                className="mt-6 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white px-5 py-2.5 rounded-xl text-xs font-bold border border-emerald-500/20 transition duration-150"
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const bike = booking.bikeId;
                const isBookingActive = booking.status === 'active' && new Date(booking.endTime) > new Date();
                return (
                  <div 
                    key={booking._id} 
                    className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-5 transition duration-200 hover:border-slate-600"
                  >
                    {/* Left side: Info */}
                    <div className="flex gap-4 items-center">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 hidden sm:block shrink-0">
                        <img 
                          src={bike?.image || 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=100'} 
                          alt={bike?.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white">{bike?.name || 'Bike Rental'}</h3>
                          <span className="text-[10px] text-slate-400 uppercase bg-slate-700/50 px-2 py-0.5 rounded font-bold">
                            {bike?.type || 'Standard'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-400 text-xs mt-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>Started: {formatDate(booking.startTime)}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>Ends: {formatDate(booking.endTime)}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Right side: Status and actions */}
                    <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-slate-700/40 pt-3 md:pt-0 shrink-0">
                      {/* Timer Countdown Component */}
                      <BookingCountdown endTime={booking.endTime} status={booking.status} />
                      {/* Cancel Action */}
                      {isBookingActive && (
                        <button
                          onClick={() => handleCancelBooking(booking._id, bike?.name || 'this bike')}
                          className="bg-slate-700/40 hover:bg-rose-500/20 hover:text-rose-300 border border-slate-600 hover:border-rose-500/30 px-4 py-2 rounded-xl text-xs font-bold transition duration-150"
                        >
                          Cancel Rental
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </main>

      {/* 🔒 CONFIRM BOOKING & SELECT DURATION DIALOG MODAL */}
      {showModal && selectedBike && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Glassmorphic Backdrop overlay */}
          <div 
            onClick={() => setShowModal(false)}
            className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm transition-opacity duration-300"
          ></div>
          
          {/* Modal Container */}
          <div className="bg-slate-800 border border-slate-700 rounded-3xl w-full max-w-md shadow-2xl p-6 relative z-10 overflow-hidden transform transition-transform duration-300 scale-100">
            
            {/* Header info */}
            <div className="flex items-start gap-4">
              <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/25">
                <Bike className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Book Rental Slot</h3>
                <p className="text-xs text-slate-400 mt-0.5">Please customize your rental parameters below.</p>
              </div>
            </div>
            {/* Bike details preview */}
            <div className="bg-slate-900/50 rounded-2xl border border-slate-700/30 p-4 mt-6 flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-white">{selectedBike.name}</p>
                <p className="text-[10px] text-emerald-400 uppercase mt-0.5 font-bold">{selectedBike.type} Bike</p>
              </div>
              <p className="text-sm font-black text-white">${selectedBike.hourlyRate.toFixed(2)}/hr</p>
            </div>
            {/* Form Fields: Rental Duration */}
            <div className="mt-6">
              <label className="text-xs font-bold text-slate-300 block mb-2">Select Rental Duration</label>
              <select
                value={bookingDuration}
                onChange={(e) => setBookingDuration(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value={1}>1 Hour Slot</option>
                <option value={2}>2 Hours Slot</option>
                <option value={4}>4 Hours Slot</option>
                <option value={8}>8 Hours Slot</option>
              </select>
            </div>
            {/* Live Pricing Breakdown */}
            <div className="mt-6 pt-5 border-t border-slate-700/50 flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-400">Total Price Estimate</p>
                <p className="text-[10px] text-slate-500 italic mt-0.5">No pre-payment required</p>
              </div>
              <p className="text-2xl font-black text-white tracking-tight">
                ${(selectedBike.hourlyRate * bookingDuration).toFixed(2)}
              </p>
            </div>
            {/* Modal Actions */}
            <div className="grid grid-cols-2 gap-3 mt-8">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={bookingInProgress}
                className="bg-slate-700 hover:bg-slate-650 active:scale-[0.98] text-slate-300 font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition duration-150 border border-slate-600/35"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBookBike}
                disabled={bookingInProgress}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-[0.98] text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition duration-150 shadow-lg shadow-emerald-500/20 flex items-center justify-center"
              >
                {bookingInProgress ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Confirm Booking'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bikes;