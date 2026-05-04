import { useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import './Faq.css';

export default function Faq() {
  const [expandedSections, setExpandedSections] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  
  // FAQ categories and questions
  const faqCategories = [
    {
      id: 'booking',
      title: 'Booking & Reservations',
      questions: [
        {
          id: 'booking1',
          question: 'How far in advance should I book a tour?',
          answer: 'We recommend booking at least 3-4 months in advance for our most popular tours, especially during peak season (June-September). This ensures you get your preferred dates and accommodations. However, we occasionally have last-minute availability, so it\'s always worth checking with us.'
        },
        {
          id: 'booking2',
          question: 'What payment methods do you accept?',
          answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, bank transfers, and various digital payment options. All payments are processed securely through our encrypted payment gateway.'
        },
        {
          id: 'booking3',
          question: 'Is there a deposit required to secure my booking?',
          answer: 'Yes, a 25% non-refundable deposit is required to confirm your booking. The remaining balance is due 30 days before your tour start date. For bookings made less than 30 days before departure, full payment is required at the time of booking.'
        },
        {
          id: 'booking4',
          question: 'Can I reserve now and pay later?',
          answer: 'We offer a 48-hour hold on reservations without payment, which allows you time to make travel arrangements. After 48 hours, a deposit is required to confirm your booking.'
        }
      ]
    },
    {
      id: 'tours',
      title: 'Our Tours',
      questions: [
        {
          id: 'tours1',
          question: 'What is the average group size for your tours?',
          answer: 'Our standard tours typically have 8-12 participants, ensuring a personalized experience while still enjoying the social aspects of group travel. Some specialized tours may have smaller groups of 4-6 people. Private tours are also available for families or friend groups who prefer to travel exclusively together.'
        },
        {
          id: 'tours2',
          question: 'Are your tours suitable for children?',
          answer: 'Most of our tours are designed for adults, but we do offer family-friendly tours specifically tailored for travelers with children. These tours include activities appropriate for various age groups and accommodations suitable for families. The minimum age requirement varies by tour, so please check the specific tour details or contact us for more information.'
        },
        {
          id: 'tours3',
          question: 'What is the physical fitness level required for your tours?',
          answer: 'Our tours vary in physical intensity. Each tour description includes a fitness level indicator: Easy (suitable for most people with basic mobility), Moderate (requires ability to walk 3-5 miles daily on varied terrain), Challenging (includes longer hikes, possibly at elevation or in variable conditions), and Strenuous (designed for experienced hikers/trekkers). Please review these requirements carefully before booking.'
        },
        {
          id: 'tours4',
          question: 'Do you offer customized or private tours?',
          answer: 'Yes! We specialize in creating customized itineraries for private groups. Whether you\'re traveling with family, friends, or colleagues, we can design a tour that matches your interests, timeline, and preferences. Private tours offer flexibility in scheduling, accommodations, and activities.'
        }
      ]
    },
    {
      id: 'preparation',
      title: 'Preparation & Packing',
      questions: [
        {
          id: 'prep1',
          question: 'What should I pack for my tour?',
          answer: 'A detailed packing list is provided in your pre-departure information packet, which you\'ll receive after booking. Generally, we recommend layered clothing, comfortable walking shoes, weather-appropriate gear, personal medications, and travel documents. Specialized equipment required for certain activities (like hiking poles or snorkeling gear) may be provided depending on the tour.'
        },
        {
          id: 'prep2',
          question: 'Do I need travel insurance?',
          answer: 'Yes, comprehensive travel insurance is mandatory for all participants. Your policy must cover emergency medical treatment, evacuation, trip cancellation, and lost luggage. We recommend purchasing insurance as soon as you book your tour. We can recommend reliable providers if needed.'
        },
        {
          id: 'prep3',
          question: 'Are visas required for your tours?',
          answer: 'Visa requirements depend on your nationality and the destination countries included in your tour. It is your responsibility to check visa requirements and obtain necessary visas before departure. We provide general information about visa requirements in our tour documentation, but requirements can change, so we recommend checking with the relevant embassies or consulates for the most current information.'
        },
        {
          id: 'prep4',
          question: 'What vaccinations are required?',
          answer: 'Vaccination requirements vary by destination. We recommend consulting with a travel health specialist or your physician at least 6-8 weeks before departure. They can advise on necessary vaccinations and preventive medications based on your specific health needs and the countries you\'ll be visiting.'
        }
      ]
    },
    {
      id: 'during',
      title: 'During Your Tour',
      questions: [
        {
          id: 'during1',
          question: 'Will I have access to Wi-Fi during the tour?',
          answer: 'Wi-Fi availability varies by destination and accommodation. Most hotels and lodges in urban areas offer Wi-Fi, though connection quality can vary. In remote locations, internet access may be limited or unavailable. We provide information about connectivity expectations in your pre-departure materials. If staying connected is essential, we recommend researching international data plans or portable Wi-Fi devices.'
        },
        {
          id: 'during2',
          question: 'What happens if there\'s an emergency during my tour?',
          answer: 'All our tour guides are trained in emergency procedures and first aid. They carry first aid kits and communication devices (satellite phones in remote areas). We maintain 24/7 emergency contact services, and our local teams can quickly arrange medical assistance or evacuation if needed. Emergency protocols and contact information are provided in your tour documentation.'
        },
        {
          id: 'during3',
          question: 'Are meals included in the tour price?',
          answer: 'Meal inclusions vary by tour and are clearly indicated in each tour itinerary using B (Breakfast), L (Lunch), and D (Dinner) notations. Most tours include breakfast daily, with a mix of other included and independent meals. Special dietary requirements can be accommodated with advance notice.'
        },
        {
          id: 'during4',
          question: 'What is your policy on tipping guides and drivers?',
          answer: 'Tipping is customary in the tourism industry but always at your discretion. We provide tipping guidelines specific to each destination in your pre-departure information. As a general rule, for good service, we suggest $10-15 per day for tour guides and $5-7 per day for drivers, but this varies by country and service level.'
        }
      ]
    },
    {
      id: 'cancellation',
      title: 'Cancellations & Changes',
      questions: [
        {
          id: 'cancel1',
          question: 'What is your cancellation policy?',
          answer: 'Our standard cancellation policy is as follows: Cancellations 60+ days before departure: Full refund minus deposit; 30-59 days: 50% refund; 15-29 days: 25% refund; Less than 15 days: No refund. We strongly recommend comprehensive travel insurance that includes cancellation coverage for unforeseen circumstances.'
        },
        {
          id: 'cancel2',
          question: 'Can I transfer my booking to another person?',
          answer: 'Yes, you may transfer your booking to another person if you are unable to travel. A transfer fee of $100 applies, and the new traveler must accept and meet all tour requirements. Transfer requests must be submitted in writing at least 30 days before departure, along with the new traveler\'s details.'
        },
        {
          id: 'cancel3',
          question: 'What happens if you cancel the tour?',
          answer: 'In the rare event that we must cancel a scheduled tour (due to insufficient participants, safety concerns, or force majeure events), you will be offered the choice of a full refund, credit toward a future tour, or an alternative tour if available. We are not responsible for additional expenses incurred in preparing for the tour (e.g., non-refundable airfare), which is why travel insurance is essential.'
        },
        {
          id: 'cancel4',
          question: 'Can I change my tour dates after booking?',
          answer: 'Date changes are subject to availability and may incur a rebooking fee of $75. Changes requested less than 60 days before departure are treated as a cancellation and new booking, subject to our standard cancellation terms. We try to be flexible but cannot guarantee availability on alternative dates, especially during peak season.'
        }
      ]
    }
  ];
  
  const toggleQuestion = (questionId) => {
    setExpandedSections({
      ...expandedSections,
      [questionId]: !expandedSections[questionId]
    });
  };
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value.toLowerCase());
  };
  
  // Filter questions based on search query
  const filterQuestions = () => {
    if (!searchQuery) return faqCategories;
    
    return faqCategories.map(category => {
      const filteredQuestions = category.questions.filter(q => 
        q.question.toLowerCase().includes(searchQuery) || 
        q.answer.toLowerCase().includes(searchQuery)
      );
      
      return {
        ...category,
        questions: filteredQuestions
      };
    }).filter(category => category.questions.length > 0);
  };
  
  const filteredCategories = filterQuestions();
  
  return (
    <div className="faq-container">
      <header className="faq-header">
        <h1>Frequently Asked Questions</h1>
        <p className="faq-subtitle">Find answers to common questions about our tours</p>
      </header>
      
      <div className="search-container">
        <div className="search-wrapper">
          <Search className="search-icon" />
          <input 
            type="text" 
            placeholder="Search for questions..." 
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
      </div>
      
      {filteredCategories.length === 0 ? (
        <div className="no-results">
          <p>No questions found matching "{searchQuery}". Please try a different search term.</p>
        </div>
      ) : (
        filteredCategories.map(category => (
          <div key={category.id} className="faq-category">
            <h2 className="category-title">{category.title}</h2>
            
            {category.questions.map(item => (
              <div key={item.id} className="faq-item">
                <button 
                  className="faq-question"
                  onClick={() => toggleQuestion(item.id)}
                  aria-expanded={expandedSections[item.id]}
                >
                  <span>{item.question}</span>
                  {expandedSections[item.id] ? 
                    <ChevronUp className="faq-icon" /> : 
                    <ChevronDown className="faq-icon" />
                  }
                </button>
                
                {expandedSections[item.id] && (
                  <div className="faq-answer">
                    <p>{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))
      )}
      
      <div className="faq-contact">
        <h3>Still have questions?</h3>
        <p>
          Our customer service team is here to help you with any questions not answered above.
          Contact us at <a href="mailto:support@yourtourwebsite.com">support@yourtourwebsite.com</a> or 
          call us at <a href="tel:+11234567890">+1 (123) 456-7890</a>.
        </p>
      </div>
      
      <footer className="faq-footer">
        <p>© 2025 Your Tour Company. All rights reserved.</p>
      </footer>
    </div>
  );
}
