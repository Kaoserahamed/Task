import React, { useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { ToursContext } from '../../Context/ToursContext';
import { useAuth } from '../../Context/AuthContext';
import Breadcrumb from './Breadcrumb';
import ContactInfoForm from './ContactInfoForm';
import PaymentInfoForm from './PaymentInfoForm';
import OrderSummary from './OrderSummary';
import './Checkout.css';
import socket from '../../socket';

const Checkout = () => {
  const [step, setStep] = useState(1);
  const { tourId } = useParams();
  const { tours = [], loading, updateTour } = useContext(ToursContext);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    specialRequests: '',
    paymentMethod: 'credit-card',
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
    travelers: 1,
  });

  // Find the actual tour from context
  const selectedTour = tours.find(tour => tour._id === tourId);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitContactInfo = (e) => {
    e.preventDefault();

    // Validate traveler count for group tours
    if (selectedTour?.tourType?.group) {
      const availableSeats = selectedTour?.availableSeats || 0;
      const requestedTravelers = parseInt(formData.travelers);

      if (requestedTravelers > availableSeats) {
        alert(`Sorry, only ${availableSeats} seat${availableSeats !== 1 ? 's' : ''} available for this tour.`);
        return;
      }
    }

    setStep(2);
    window.scrollTo(0, 0);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const requestedTravelers = parseInt(formData.travelers);

      // Final validation before booking
      if (selectedTour?.tourType?.group) {
        const availableSeats = selectedTour?.availableSeats || 0;
        if (requestedTravelers > availableSeats) {
          alert(`Sorry, only ${availableSeats} seat${availableSeats !== 1 ? 's' : ''} available for this tour.`);
          return;
        }
      }

      // Calculate total amount
      const totalAmount = selectedTour.price * requestedTravelers;

      const bookingResponse = await fetch('https://backend-eight-tan-16.vercel.app/api/bookings/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tourId: tourId,
          email: user?.user?.email || formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          country: formData.country,
          travelers: requestedTravelers,
          startDate: selectedTour?.startDate || new Date().toISOString(),
          specialRequests: formData.specialRequests,
          paymentMethod: formData.paymentMethod,
          cardHolder: formData.cardHolder,
          cardNumber: formData.cardNumber,
          totalAmount: totalAmount,
          userId:user?.user?._id,
        })
      });

      const bookingData = await bookingResponse.json();

      if (!bookingResponse.ok) {
        throw new Error(bookingData.message || 'Failed to save booking');
      }

      // Update tour seats
      const updateResponse = await fetch(`https://backend-eight-tan-16.vercel.app/api/tours/${tourId}/book-seats`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seatsToBook: requestedTravelers
        })
      });

      if (updateResponse.ok) {
        const updatedTour = await updateResponse.json();
        if (updateTour) {
          updateTour(updatedTour.tour);
        }
        // Emit socket event for real-time seat update
        if (socket) {
          socket.emit('seatsUpdated', {
            tourId: tourId,
            availableSeats: updatedTour.tour.availableSeats,
            travelers: requestedTravelers
          });
        }
      }

      alert(`Payment processed successfully! Your booking reference is: ${bookingData.booking.bookingReference}`);

      // Optional: Redirect to booking confirmation page
      // window.location.href = `/booking-confirmation/${bookingData.booking.bookingReference}`;

    } catch (err) {
      console.error("Error confirming booking:", err);
      alert("Failed to confirm booking. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="checkout-container">
        <div className="main-content">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <h2>Loading tour details...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedTour) {
    return (
      <div className="checkout-container">
        <div className="main-content">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <h2>Tour not found</h2>
            <p>The requested tour could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <Breadcrumb step={step} />

      <div className="main-content">
        <div className="two-col-layout">
          <div className="main-column">
            {step === 1 ? (
              <ContactInfoForm
                formData={formData}
                handleChange={handleChange}
                handleSubmitContactInfo={handleSubmitContactInfo}
                selectedTour={selectedTour}
              />
            ) : (
              <PaymentInfoForm
                formData={formData}
                handleChange={handleChange}
                handlePaymentSubmit={handlePaymentSubmit}
                setStep={setStep}
              />
            )}
          </div>

          <div className="sidebar-column">
            <OrderSummary
              selectedTour={selectedTour}
              formData={formData}
              step={step}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
