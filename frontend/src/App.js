import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './Components/Navbar/Navbar';
import Homepage from './Pages/Homepage/Homepage';
import PackageDetails from './Pages/PackageDetails/PackageDetails';
import LoginSignup from './Pages/LoginSignup/LoginSignup';
import ProfilePage from './Pages/ProfilePage/ProfilePage';
import ChatPage from './Pages/ChatPage/ChatPage';
import { ToursProvider } from './Context/ToursContext';
import { AuthProvider } from './Context/AuthContext';
import PrivateRoute from './Components/PrivateRoute/PrivateRoute';
import TermsAndConditions from './Pages/TermsandConditions/TermsandConditions';
import Faq from './Pages/Faq/Faq';
import ReviewPage from './Pages/Review/ReviewPage';
import ExploreByCategory from './Pages/ExploreByCategory/ExploreByCategory';
import SearchFilter from './Pages/SearchFilter/SearchFilter';
import PopularTours from './Pages/PopularTours/PopularTours';
import Checkout from './Pages/Checkout/Checkout';
import './App.css';
import { ThemeProvider } from './Context/ThemeContext';
import WeatherSuggestion from './Pages/weatherSuggestion/WeatherSuggestion';
import Places from './Pages/Places'; // adjust path if needed
import HotelRestaurants from './Pages/HotelRestaurants';
import ResetPassword from './Pages/ResetPassword/ResetPassword';
import NewPassword from './Pages/NewPassword/NewPassword';

function App() {
  return (
    <AuthProvider>
      <ToursProvider>
        <ThemeProvider>
          <BrowserRouter>
            <div className="App">
              <Navbar />
              <Routes>
                <Route path="/" element={<Homepage />} />
                <Route path="/package/:id" element={<PackageDetails />} />
                <Route path="/login" element={<LoginSignup />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/reset-password/:token" element={<NewPassword />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/populartours" element={<PopularTours />} />
                <Route path="/weather" element={<WeatherSuggestion />} />
                <Route path="/places" element={<Places />} />
                <Route path="/hotels-and-restaurants" element={<HotelRestaurants />} />
                <Route 
                  path="/profile" 
                  element={
                    <PrivateRoute>
                      <ProfilePage />
                    </PrivateRoute>
                  } 
                />
                <Route path="/search" element={<SearchFilter />} />
                <Route path="/explore/:category?" element={<ExploreByCategory />} />
                <Route path="/checkout/:tourId" element={<Checkout />} />
                <Route path="/terms" element={<TermsAndConditions />} />
                <Route path="/terms/:section" element={<TermsAndConditions />} />
                <Route path="/faq" element={<Faq />} />
                <Route path="/review" element={<ReviewPage />} />
                <Route path="/weather" element={<WeatherSuggestion />} />
              </Routes>
            </div>
          </BrowserRouter>
        </ThemeProvider>
      </ToursProvider>
    </AuthProvider>
  );
}

export default App;

