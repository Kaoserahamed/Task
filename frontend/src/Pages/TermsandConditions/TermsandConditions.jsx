import { useState } from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import './TermsAndConditions.css';

export default function TermsAndConditions() {
  const [expandedSections, setExpandedSections] = useState({
    bookingTerms: true,
    cancellationPolicy: false,
    liabilityWaiver: false,
    privacyPolicy: false,
    photosVideos: false,
    disputeResolution: false
  });
  
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
  };
  
  const handleAcceptTerms = () => {
    setAcceptedTerms(!acceptedTerms);
  };
  
  const Section = ({ id, title, children }) => (
    <div className="terms-section">
      <div 
        className="section-header"
        onClick={() => toggleSection(id)}
      >
        <h3>{title}</h3>
        {expandedSections[id] ? 
          <ChevronUp className="icon" /> : 
          <ChevronDown className="icon" />
        }
      </div>
      {expandedSections[id] && (
        <div className="section-content">
          {children}
        </div>
      )}
    </div>
  );
  
  return (
    <div className="terms-container">
      <header className="terms-header">
        <h1>Terms & Conditions</h1>
        <p className="last-updated">Last updated: May 7, 2025</p>
      </header>
      
      <div className="terms-intro">
        <p>
          Please read these Terms and Conditions carefully before using our tour booking services. 
          By accessing or using our services, you agree to be bound by these Terms and Conditions.
        </p>
      </div>
      
      <Section id="bookingTerms" title="1. Booking Terms">
        <h4>1.1 Booking Process</h4>
        <p>
          All bookings are subject to availability and confirmation. A booking is not confirmed until you receive a confirmation email from us.
        </p>
        
        <h4>1.2 Payment Terms</h4>
        <p>
          A deposit of 25% of the total tour price is required at the time of booking. The remaining balance must be paid no later than 30 days before the start of the tour.
        </p>
        
        <h4>1.3 Pricing and Taxes</h4>
        <p>
          All prices are listed in USD and include applicable taxes. Prices are subject to change without notice until your booking is confirmed.
        </p>
        
        <h4>1.4 Age Requirements</h4>
        <p>
          Participants must be at least 18 years of age or accompanied by an adult. Some tours may have specific age restrictions which will be clearly specified in the tour details.
        </p>
      </Section>
      
      <Section id="cancellationPolicy" title="2. Cancellation and Refund Policy">
        <h4>2.1 Cancellation by Customer</h4>
        <ul>
          <li>Cancellations made 60+ days before the tour: Full refund minus a 5% administrative fee</li>
          <li>Cancellations made 30-59 days before the tour: 50% refund</li>
          <li>Cancellations made 15-29 days before the tour: 25% refund</li>
          <li>Cancellations made less than 15 days before the tour: No refund</li>
        </ul>
        
        <h4>2.2 Cancellation by Company</h4>
        <p>
          We reserve the right to cancel any tour due to insufficient participation, unforeseen circumstances, or force majeure events. In such cases, you will receive a full refund or the option to reschedule.
        </p>
        
        <h4>2.3 Tour Modifications</h4>
        <p>
          We reserve the right to modify tour itineraries, accommodations, or transportation as necessary. Significant changes will be communicated as soon as possible, and you may be entitled to a partial refund if the modifications substantially alter the nature of the tour.
        </p>
      </Section>
      
      <Section id="liabilityWaiver" title="3. Liability Waiver">
        <h4>3.1 Assumption of Risk</h4>
        <p>
          By participating in our tours, you acknowledge and accept the inherent risks associated with travel and outdoor activities. These risks may include but are not limited to physical injury, illness, property damage, or death.
        </p>
        
        <h4>3.2 Release of Liability</h4>
        <p>
          You agree to release our company, its employees, agents, and partners from any liability for injuries, damages, or losses incurred during the tour, except in cases of gross negligence or willful misconduct on our part.
        </p>
        
        <h4>3.3 Insurance Requirement</h4>
        <p>
          All participants are required to have appropriate travel and medical insurance that covers emergency evacuation, medical expenses, trip cancellation, and loss or damage to personal belongings.
        </p>
      </Section>
      
      <Section id="privacyPolicy" title="4. Privacy Policy">
        <h4>4.1 Data Collection</h4>
        <p>
          We collect personal information necessary for booking and providing our services. This includes your name, contact details, payment information, and any specific requirements related to your tour.
        </p>
        
        <h4>4.2 Data Usage</h4>
        <p>
          Your personal information will be used to process your booking, communicate important information about your tour, and improve our services. We may also use your contact information to send promotional materials about our tours and services.
        </p>
        
        <h4>4.3 Data Sharing</h4>
        <p>
          We may share your personal information with third-party service providers involved in fulfilling your tour booking, such as hotels, transportation companies, and local tour operators. We will not sell or rent your personal information to unaffiliated third parties.
        </p>
      </Section>
      
      <Section id="photosVideos" title="5. Photos and Videos">
        <h4>5.1 Company Rights</h4>
        <p>
          We reserve the right to take photographs and videos during tours and use them for promotional purposes, including on our website, social media, and marketing materials.
        </p>
        
        <h4>5.2 Participant Consent</h4>
        <p>
          By participating in our tours, you grant us permission to use photographs or videos that may include your image for promotional purposes without compensation. If you prefer not to be photographed, please inform your tour guide at the beginning of the tour.
        </p>
      </Section>
      
      <Section id="disputeResolution" title="6. Dispute Resolution">
        <h4>6.1 Governing Law</h4>
        <p>
          These Terms and Conditions shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions.
        </p>
        
        <h4>6.2 Dispute Resolution Process</h4>
        <p>
          Any disputes arising from these Terms and Conditions shall first be addressed through informal negotiations. If a resolution cannot be reached, the dispute shall be submitted to binding arbitration in accordance with the rules of the [Relevant Arbitration Association].
        </p>
      </Section>
      
      {/* <div className="terms-acceptance">
        <div className="checkbox-container">
          <div 
            className={`custom-checkbox ${acceptedTerms ? 'checked' : ''}`}
            onClick={handleAcceptTerms}
          >
            {acceptedTerms && <Check className="check-icon" />}
          </div>
          <label onClick={handleAcceptTerms}>
            I have read and agree to the Terms and Conditions
          </label>
        </div>
        
        <button 
          className={`accept-button ${acceptedTerms ? 'active' : 'disabled'}`}
          disabled={!acceptedTerms}
        >
          Accept and Continue
        </button>
      </div> */}
      
      <footer className="terms-footer">
        <p>If you have any questions about these Terms and Conditions, please contact us at support@yourtourwebsite.com</p>
        <p>© 2025 Your Tour Company. All rights reserved.</p>
      </footer>
    </div>
  );
}
