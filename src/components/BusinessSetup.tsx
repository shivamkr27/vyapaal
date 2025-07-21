import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Users,
  Key,
  ArrowRight,
  CheckCircle,
  UserPlus,
  Briefcase,
  LogOut
} from 'lucide-react';
import { User, Business } from '../types';
import { createBusiness, joinBusinessWithRoleCode, saveBusiness } from '../utils/businessUtils';

interface BusinessSetupProps {
  user: User;
  onComplete: (updatedUser: User) => void;
  onLogout?: () => void;
}

const BusinessSetup: React.FC<BusinessSetupProps> = ({ user, onComplete, onLogout }) => {
  const [setupType, setSetupType] = useState<'choose' | 'create' | 'join'>('choose');
  const [formData, setFormData] = useState({
    businessName: '',
    roleCode: '',
    phone: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [businessCreated, setBusinessCreated] = useState<Business | null>(null);
  const [updatedUser, setUpdatedUser] = useState<User | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateCreateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateJoinForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.roleCode.trim()) {
      newErrors.roleCode = 'Role code is required';
    } else if (formData.roleCode.length < 8) {
      newErrors.roleCode = 'Role code must be at least 8 characters';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateBusiness = async () => {
    if (!validateCreateForm()) return;

    setIsLoading(true);

    try {
      // Create new business
      const business = createBusiness(formData.businessName, user.email, user.id);
      saveBusiness(business);

      // Update business in database
      const response = await apiService.updateBusiness({
        businessName: business.businessName,
        businessCode: business.businessCode,
        isBusinessOwner: true
      });

      setUpdatedUser(response.user);
      setBusinessCreated(business);

    } catch (error) {
      setErrors({ submit: 'Failed to create business. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinBusiness = async () => {
    if (!validateJoinForm()) return;

    setIsLoading(true);

    try {
      // Join business using role code
      const result = joinBusinessWithRoleCode(formData.roleCode.toUpperCase(), {
        name: user.name,
        email: user.email,
        phone: formData.phone
      });

      if (!result) {
        setErrors({ roleCode: 'Invalid role code or you are already part of this business' });
        setIsLoading(false);
        return;
      }

      const { business, role, staffId } = result;

      // Update business in database
      const response = await apiService.updateBusiness({
        businessName: formData.businessName,
        businessCode: formData.businessCode,
        isBusinessOwner: false
      });

      onComplete(response.user);

    } catch (error) {
      setErrors({ submit: 'Failed to join business. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteSetup = () => {
    if (businessCreated && updatedUser) {
      onComplete(updatedUser);
    }
  };

  if (businessCreated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 w-full max-w-md text-center shadow-2xl"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>

          <h2 className="text-3xl font-bold text-gray-800 mb-4">Business Created!</h2>
          <p className="text-gray-600 mb-6">Your business has been successfully created.</p>

          <div className="bg-gray-50 rounded-2xl p-6 mb-6">
            <h3 className="font-bold text-gray-800 mb-4">Your Business Details:</h3>
            <div className="space-y-3 text-left">
              <div>
                <span className="text-gray-600">Business Name:</span>
                <p className="font-semibold">{businessCreated.businessName}</p>
              </div>
              <div>
                <span className="text-gray-600">Business Code:</span>
                <p className="font-bold text-2xl text-blue-600">{businessCreated.businessCode}</p>
                <p className="text-sm text-gray-500">Share this code with your staff to let them join</p>
              </div>
            </div>
          </div>

          <motion.button
            onClick={handleCompleteSetup}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center space-x-3"
            whileHover={{ scale: 1.02 }}
          >
            <span>Continue to Dashboard</span>
            <ArrowRight className="h-5 w-5" />
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl"
      >
        {/* Header with logout button */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to Vyapaal!</h1>
            <p className="text-xl text-gray-600">Let's set up your business account</p>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          )}
        </div>

        {setupType === 'choose' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <motion.button
                onClick={() => setSetupType('create')}
                className="group p-8 border-2 border-gray-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 text-left"
                whileHover={{ scale: 1.02 }}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Create Business</h3>
                <p className="text-gray-600">Start your own business and manage your team</p>
              </motion.button>

              <motion.button
                onClick={() => setSetupType('join')}
                className="group p-8 border-2 border-gray-200 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition-all duration-300 text-left"
                whileHover={{ scale: 1.02 }}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <UserPlus className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Join Business</h3>
                <p className="text-gray-600">Join an existing business using a business code</p>
              </motion.button>
            </div>
          </div>
        )}

        {setupType === 'create' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <Briefcase className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800">Create Your Business</h2>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Business Name</label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                placeholder="Enter your business name"
              />
              {errors.businessName && <p className="text-red-500 text-sm mt-1">{errors.businessName}</p>}
            </div>

            {errors.submit && <p className="text-red-500 text-sm text-center">{errors.submit}</p>}

            <div className="flex space-x-4">
              <button
                onClick={() => setSetupType('choose')}
                className="flex-1 py-3 px-6 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <motion.button
                onClick={handleCreateBusiness}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2"
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Business</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}

        {setupType === 'join' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <Key className="h-6 w-6 text-emerald-600" />
              <h2 className="text-2xl font-bold text-gray-800">Join Existing Business</h2>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Role Code</label>
              <input
                type="text"
                name="roleCode"
                value={formData.roleCode}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-300 text-center text-lg font-bold tracking-wider"
                placeholder="ABC123-MAN456"
                maxLength={15}
                style={{ textTransform: 'uppercase' }}
              />
              {errors.roleCode && <p className="text-red-500 text-sm mt-1">{errors.roleCode}</p>}
              <p className="text-gray-500 text-sm mt-1">Enter the role code provided by your business owner (includes your specific role)</p>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-300"
                placeholder="Enter your phone number"
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>

            {errors.submit && <p className="text-red-500 text-sm text-center">{errors.submit}</p>}

            <div className="flex space-x-4">
              <button
                onClick={() => setSetupType('choose')}
                className="flex-1 py-3 px-6 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <motion.button
                onClick={handleJoinBusiness}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2"
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Join Business</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default BusinessSetup;