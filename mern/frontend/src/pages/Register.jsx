import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';
import Loader from '../components/common/Loader';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match');
    }

    setLoading(true);
    
    try {
      const { name, email, password, phoneNumber } = formData;

      // Validate phone number
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        setLoading(false);
        return toast.error('Phone number must be exactly 10 digits');
      }

      const registrationData = { name, email, password, phoneNumber: cleanPhone };
      const response = await register(registrationData);
      
      // Check if email verification is required
      if (response?.data?.requiresVerification) {
        navigate('/verify-email', { state: { email, password } });
      } else {
        navigate('/login');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {loading && <Loader fullPage={true} text="Creating account..." />}
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-block mb-6">
            <img src="/logo.png" alt="FMPG Logo" className="h-16 mx-auto" />
          </Link>
          <h2 className="text-3xl font-extrabold text-white">Create an account</h2>
          <p className="mt-2 text-sm text-gray-400">
            Or{' '}
            <Link to="/login" className="font-medium text-lime-400 hover:text-lime-300">
              sign in to your existing account
            </Link>
          </p>
        </div>
        
        <div className="bg-gray-900 rounded-lg shadow-xl p-8 border border-gray-800">
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent text-white"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="John Doe"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent text-white"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your@email.com"
              />
            </div>
            
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
              <input
                type="tel"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent text-white"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                placeholder="+1234567890"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <input
                type="password"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent text-white"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
              <input
                type="password"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent text-white"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="••••••••"
              />
            </div>

            <div>
              <button 
                type="submit" 
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-lime-400 hover:bg-lime-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-400 transition-colors duration-300 disabled:opacity-70"
                disabled={loading}
              >
                Create Account
              </button>
            </div>
            
            <p className="text-center text-xs text-gray-500 mt-4">
              By registering, you agree to our{' '}
              <a href="https://fmpg.vercel.app/TermsAndConditions" className="text-lime-400 hover:text-lime-300">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="https://fmpg.vercel.app/privacypolicy" className="text-lime-400 hover:text-lime-300">
                Privacy Policy
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;