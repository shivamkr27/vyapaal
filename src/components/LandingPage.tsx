import React, { useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import emailjs from '@emailjs/browser';
import apiService from '../services/api';
import {
  Building2,
  Mail,
  Shield,
  Zap,
  Clock,
  Users,
  Phone,
  MapPin,
  CheckCircle,
  ArrowRight,
  Play,
  Globe,
  Database,
  Cloud,
  Smartphone,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Star,
  Quote,
  Facebook,
  Instagram,
  Youtube,
  Twitter as TwitterIcon,
  Layers,
  Sparkles,
  Rocket,
  Heart,
  Send,
  Copy,
  ExternalLink
} from 'lucide-react';
import { User as UserType } from '../types';

interface LandingPageProps {
  onLogin: (user: UserType, isNewRegistration?: boolean) => void;
}

interface Review {
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar: string;
  timestamp: number;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);
  const [currentReview, setCurrentReview] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    businessCode: '',
    isBusinessOwner: false,
    isJoiningBusiness: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [contactErrors, setContactErrors] = useState<Record<string, string>>({});
  const [isContactLoading, setIsContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Navigation and feedback states
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    rating: 5,
    message: '',
    email: ''
  });
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  // Direct review submission states
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    name: '',
    role: '',
    content: '',
    rating: 5,
    email: ''
  });
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [isReviewLoading, setIsReviewLoading] = useState(false);

  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, 100]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!isLoginMode) {
      if (!formData.name) {
        newErrors.name = 'Name is required';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (isLoginMode) {
        // Login using API
        const response = await apiService.login({
          email: formData.email,
          password: formData.password
        });

        onLogin({
          id: response.user?.id || '',
          email: response.user?.email || '',
          name: response.user?.name || '',
          createdAt: response.user?.createdAt || ''
        }, false); // false = existing user login
      } else {
        // Register using API
        const response = await apiService.register({
          name: formData.name,
          email: formData.email,
          password: formData.password
        });

        onLogin({
          id: response.user?.id || '',
          email: response.user?.email || '',
          name: response.user?.name || '',
          createdAt: response.user?.createdAt || ''
        }, true); // true = new user registration
      }
    } catch (error: any) {
      setErrors({ submit: error.message || 'An error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      businessName: '',
      businessCode: '',
      isBusinessOwner: false,
      isJoiningBusiness: false
    });
    setErrors({});
  };

  const features = [
    {
      icon: Database,
      title: 'Smart Analytics',
      description: 'AI-powered insights that transform your business data into actionable intelligence.',
      gradient: 'from-blue-500 to-cyan-400'
    },
    {
      icon: Cloud,
      title: 'Cloud Infrastructure',
      description: 'Scalable cloud solutions with 99.9% uptime and enterprise-grade security.',
      gradient: 'from-purple-500 to-pink-400'
    },
    {
      icon: Shield,
      title: 'Advanced Security',
      description: 'Bank-level encryption and multi-layer security protocols protect your data.',
      gradient: 'from-emerald-500 to-teal-400'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Optimized performance with sub-second response times and real-time updates.',
      gradient: 'from-amber-500 to-orange-400'
    },
    {
      icon: Globe,
      title: 'Global Reach',
      description: 'Multi-region deployment with CDN acceleration for better accessibility.',
      gradient: 'from-indigo-500 to-purple-400'
    },
    {
      icon: Smartphone,
      title: 'Mobile First',
      description: 'Native mobile experience with offline capabilities and seamless sync.',
      gradient: 'from-rose-500 to-pink-400'
    }
  ];

  const stats = [
    { number: '50+', label: 'Early Users', icon: Users, color: 'text-blue-600' },
    { number: '99%', label: 'Uptime', icon: Shield, color: 'text-emerald-600' },
    { number: '24/7', label: 'Support', icon: Clock, color: 'text-amber-600' },
    { number: '12+', label: 'Features', icon: Sparkles, color: 'text-purple-600' }
  ];

  // Initialize reviews from localStorage or use default reviews
  const [reviews, setReviews] = useState(() => {
    const savedReviews = localStorage.getItem('vyapaal_reviews');
    if (savedReviews) {
      return JSON.parse(savedReviews);
    }
    return [
      {
        name: 'Rajesh Kumar',
        role: 'Business Owner',
        content: 'Vyapaal has transformed how I manage my business. The analytics are incredible!',
        rating: 5,
        avatar: '👨‍💼',
        timestamp: Date.now() - 86400000 * 3 // 3 days ago
      },
      {
        name: 'Priya Sharma',
        role: 'Startup Founder',
        content: 'Amazing platform! Easy to use and very powerful features for growing businesses.',
        rating: 5,
        avatar: '👩‍💻',
        timestamp: Date.now() - 86400000 * 2 // 2 days ago
      },
      {
        name: 'Amit Patel',
        role: 'Entrepreneur',
        content: 'The best business management tool I have used. Highly recommended!',
        rating: 5,
        avatar: '👨‍🚀',
        timestamp: Date.now() - 86400000 * 1 // 1 day ago
      },
      {
        name: 'Sneha Gupta',
        role: 'Small Business Owner',
        content: 'Vyapaal made my business operations so much smoother. Love the interface!',
        rating: 5,
        avatar: '👩‍💼',
        timestamp: Date.now() - 86400000 * 0.5 // 12 hours ago
      }
    ];
  });

  const nextFeature = () => {
    setCurrentFeature((prev) => (prev + 1) % features.length);
  };

  const prevFeature = () => {
    setCurrentFeature((prev) => (prev - 1 + features.length) % features.length);
  };

  // Contact form handlers
  const handleContactInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContactForm(prev => ({ ...prev, [name]: value }));
    if (contactErrors[name]) {
      setContactErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateContactForm = () => {
    const newErrors: Record<string, string> = {};

    if (!contactForm.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!contactForm.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(contactForm.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!contactForm.message.trim()) {
      newErrors.message = 'Message is required';
    }

    setContactErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!validateContactForm()) return;

    setIsContactLoading(true);
    setContactErrors({});

    try {
      console.log('=== EMAILJS DEBUG INFO ===');
      console.log('Service ID:', 'service_mjiboeo');
      console.log('Template ID:', 'template_32c8qxf');
      console.log('Public Key:', 'uHVREo5DFJpl6aFBJ');
      console.log('Form Data:', {
        name: contactForm.name,
        email: contactForm.email,
        message: contactForm.message
      });

      // Initialize EmailJS with your public key
      emailjs.init('uHVREo5DFJpl6aFBJ');
      console.log('EmailJS initialized');

      // Prepare template parameters
      const templateParams = {
        name: contactForm.name,
        email: contactForm.email,
        message: contactForm.message,
      };
      console.log('Template Parameters:', templateParams);

      // Send email using your exact configuration
      console.log('Attempting to send email...');
      const result = await emailjs.send(
        'service_mjiboeo',
        'template_32c8qxf',
        templateParams,
        'uHVREo5DFJpl6aFBJ'
      );

      console.log('✅ Email sent successfully!', result);
      console.log('Response status:', result.status);
      console.log('Response text:', result.text);

      setContactSuccess(true);
      setContactForm({ name: '', email: '', message: '' });
      setTimeout(() => setContactSuccess(false), 5000);

    } catch (error: any) {
      console.error('❌ Email sending failed:', error);
      console.error('Error status:', error.status);
      console.error('Error text:', error.text);
      console.error('Full error:', error);

      // Show specific error message
      let errorMessage = 'Failed to send email. ';
      if (error.status === 400) {
        errorMessage += 'Bad request - check template variables.';
      } else if (error.status === 401) {
        errorMessage += 'Unauthorized - check your public key.';
      } else if (error.status === 404) {
        errorMessage += 'Service or template not found.';
      } else if (error.status === 412) {
        errorMessage += 'Template variables mismatch.';
      } else {
        errorMessage += `Error ${error.status}: ${error.text}`;
      }

      setContactErrors({ submit: errorMessage });

      // Fallback: Open email client
      const subject = encodeURIComponent('Contact from Vyapaal Website');
      const body = encodeURIComponent(
        `Name: ${contactForm.name}\n` +
        `Email: ${contactForm.email}\n\n` +
        `Message:\n${contactForm.message}`
      );

      setTimeout(() => {
        window.open(`mailto:infovyapaal@gmail.com?subject=${subject}&body=${body}`, '_blank');
      }, 2000);

    } finally {
      setIsContactLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Navigation handlers
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNavClick = (item: string) => {
    switch (item.toLowerCase()) {
      case 'features':
        setShowFeatureModal(true);
        break;
      case 'support':
        setShowSupportModal(true);
        break;
      case 'about':
      case 'reviews':
      case 'contact':
        scrollToSection(item.toLowerCase());
        break;
      default:
        scrollToSection(item.toLowerCase());
    }
  };

  // Feedback handlers
  const handleFeedbackInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFeedbackForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Store feedback locally instead of sending email
      const feedback = {
        rating: feedbackForm.rating,
        message: feedbackForm.message,
        email: feedbackForm.email,
        timestamp: Date.now()
      };

      // Save to localStorage
      const existingFeedback = JSON.parse(localStorage.getItem('vyapaal_feedback') || '[]');
      existingFeedback.push(feedback);
      localStorage.setItem('vyapaal_feedback', JSON.stringify(existingFeedback));

      console.log('Feedback saved locally:', feedback);

      setFeedbackSuccess(true);
      setFeedbackForm({ rating: 5, message: '', email: '' });
      setTimeout(() => {
        setFeedbackSuccess(false);
        setShowFeedbackModal(false);
      }, 3000);
    } catch (error) {
      console.error('Feedback saving failed:', error);
    }
  };

  // Review form handlers
  const handleReviewInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setReviewForm(prev => ({ ...prev, [name]: value }));
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!reviewForm.name.trim() || !reviewForm.content.trim()) {
      alert('Please fill in your name and review message.');
      return;
    }

    setIsReviewLoading(true);

    try {
      // Generate random avatar for the new review
      const avatars = ['👨‍💼', '👩‍💻', '👨‍🚀', '👩‍💼', '👤', '🧑‍💻', '👨‍🔬', '👩‍🔬'];
      const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];

      // Create new review object
      const newReview = {
        name: reviewForm.name,
        role: reviewForm.role || 'User',
        content: reviewForm.content,
        rating: reviewForm.rating,
        avatar: randomAvatar,
        timestamp: Date.now()
      };

      // Add new review to the beginning and keep only latest 4
      const updatedReviews = [newReview, ...reviews].slice(0, 4);

      // Update state and localStorage
      setReviews(updatedReviews);
      localStorage.setItem('vyapaal_reviews', JSON.stringify(updatedReviews));

      console.log('Review added successfully:', newReview);
      setReviewSuccess(true);
      setReviewForm({ name: '', role: '', content: '', rating: 5, email: '' });

      setTimeout(() => {
        setReviewSuccess(false);
        setShowReviewForm(false);
      }, 3000);

    } catch (error) {
      console.error('Review submission failed:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setIsReviewLoading(false);
    }
  };

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentReview((prev) => (prev + 1) % reviews.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 text-gray-800">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-amber-200/30 to-orange-300/20 rounded-full filter blur-3xl animate-float"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-purple-200/30 to-pink-300/20 rounded-full filter blur-3xl animate-float animation-delay-1000"></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-gradient-to-br from-blue-200/20 to-indigo-300/20 rounded-full filter blur-3xl animate-float animation-delay-2000"></div>
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="fixed top-0 left-0 right-0 z-50 glass-cream shadow-warm"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <motion.div
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-warm">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-display font-bold gradient-text-warm">Vyapaal</span>
            </motion.div>

            <div className="hidden lg:flex items-center space-x-12">
              {['Features', 'About', 'Reviews', 'Contact'].map((item) => (
                <motion.button
                  key={item}
                  onClick={() => handleNavClick(item)}
                  className="text-gray-700 hover:text-amber-700 transition-elegant font-medium relative group"
                  whileHover={{ y: -2 }}
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 group-hover:w-full transition-all duration-300"></span>
                </motion.button>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              <motion.button
                onClick={() => {
                  setIsLoginMode(true);
                  setShowAuthModal(true);
                }}
                className="text-gray-700 hover:text-amber-700 transition-elegant font-medium"
                whileHover={{ scale: 1.05 }}
              >
                Sign In
              </motion.button>
              <motion.button
                onClick={() => {
                  setIsLoginMode(false);
                  setShowAuthModal(true);
                }}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-6 py-3 rounded-full font-semibold shadow-warm transition-elegant"
                whileHover={{ scale: 1.05, y: -2 }}
              >
                Get Started
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        <motion.div
          className="absolute inset-0"
          style={{ y: y1 }}
        >
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-amber-200/40 to-orange-300/30 rounded-full filter blur-3xl animate-gentle-bounce"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-purple-200/40 to-pink-300/30 rounded-full filter blur-3xl animate-gentle-bounce animation-delay-2000"></div>
        </motion.div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="space-y-8"
            >
              <div className="space-y-6">
                <motion.h1
                  className="text-6xl lg:text-7xl font-display font-bold leading-tight"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.4 }}
                >
                  <span className="block text-gray-800">Transform Your</span>
                  <span className="block gradient-text-elegant animate-gradient-shift">Business Journey</span>
                </motion.h1>

                <motion.p
                  className="text-xl lg:text-2xl text-gray-600 leading-relaxed max-w-2xl"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.6 }}
                >
                  Experience the future of business management with AI-powered insights,
                  seamless automation, and elegant design that scales with your ambitions.
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.8 }}
                className="flex flex-col sm:flex-row gap-6"
              >
                <motion.button
                  onClick={() => {
                    setIsLoginMode(false);
                    setShowAuthModal(true);
                  }}
                  className="group bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-8 py-4 rounded-full font-semibold text-lg flex items-center justify-center space-x-3 shadow-warm transition-elegant"
                  whileHover={{ scale: 1.05, y: -3 }}
                >
                  <span>Start Your Journey</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>

                <motion.a
                  href="https://www.youtube.com/@Vyapaal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group glass-cream text-gray-700 px-8 py-4 rounded-full font-semibold text-lg flex items-center justify-center space-x-3 transition-elegant hover:shadow-warm"
                  whileHover={{ scale: 1.05, y: -3 }}
                >
                  <Play className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  <span>Watch Demo</span>
                </motion.a>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1 }}
                className="flex items-center space-x-8 text-sm text-gray-500"
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span>Get Started Today</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span>Join Our Community</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span>Start Your Journey</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Content - 3D Illustration */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="relative"
            >
              <div className="relative">
                {/* 3D Floating Elements */}
                <motion.div
                  className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl shadow-2xl"
                  animate={{
                    y: [0, -20, 0],
                    rotateY: [0, 180, 360]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <Database className="h-10 w-10 text-white" />
                  </div>
                </motion.div>

                <motion.div
                  className="absolute top-32 right-16 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-400 rounded-full shadow-2xl"
                  animate={{
                    y: [0, 15, 0],
                    x: [0, 10, 0]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <Cloud className="h-8 w-8 text-white" />
                  </div>
                </motion.div>

                <motion.div
                  className="absolute bottom-20 left-20 w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-3xl shadow-2xl"
                  animate={{
                    rotateZ: [0, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <Shield className="h-12 w-12 text-white" />
                  </div>
                </motion.div>

                {/* Central Dashboard */}
                <div className="relative glass-cream rounded-3xl p-8 shadow-elegant">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-display font-semibold text-gray-800">Business Analytics</h3>
                      <div className="text-3xl font-bold gradient-text-warm">+47%</div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-white/60 rounded-2xl p-4 shadow-warm">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Revenue</div>
                            <div className="text-xl font-bold text-emerald-600">₹2.4L</div>
                          </div>
                        </div>
                        <div className="text-xs text-emerald-600 font-medium">+23.5% from last month</div>
                      </div>

                      <div className="bg-white/60 rounded-2xl p-4 shadow-warm">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center">
                            <Users className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Clients</div>
                            <div className="text-xl font-bold text-blue-600">124</div>
                          </div>
                        </div>
                        <div className="text-xs text-blue-600 font-medium">+12% growth rate</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 font-medium">Performance Metrics</span>
                      </div>

                      {[
                        { label: 'Revenue Growth', value: 85, color: 'from-emerald-500 to-teal-400' },
                        { label: 'Customer Satisfaction', value: 92, color: 'from-blue-500 to-cyan-400' },
                        { label: 'Operational Efficiency', value: 78, color: 'from-amber-500 to-orange-400' }
                      ].map((metric, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">{metric.label}</span>
                            <span className="font-semibold text-gray-800">{metric.value}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <motion.div
                              className={`h-2 bg-gradient-to-r ${metric.color} rounded-full`}
                              initial={{ width: 0 }}
                              animate={{ width: `${metric.value}%` }}
                              transition={{ duration: 1.5, delay: 0.5 + index * 0.2 }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-20"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="text-center group"
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-white to-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-elegant group-hover:shadow-warm transition-elegant">
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
                <div className="text-3xl font-display font-bold text-gray-800 mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>      {/* Fe
atures Section with Sliding */}
      <section id="features" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl lg:text-6xl font-display font-bold mb-6 gradient-text-elegant">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Discover cutting-edge tools designed to revolutionize how you manage and grow your business
            </p>
          </motion.div>

          {/* Sliding Features */}
          <div className="relative">
            <div className="overflow-hidden rounded-3xl">
              <motion.div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentFeature * 100}%)` }}
              >
                {features.map((feature, index) => (
                  <div key={index} className="w-full flex-shrink-0 px-4">
                    <motion.div
                      className="group relative max-w-2xl mx-auto"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-gray-50/80 rounded-3xl transform rotate-1 group-hover:rotate-0 transition-elegant"></div>
                        <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-12 shadow-elegant group-hover:shadow-warm transition-elegant text-center">
                          <div className={`w-24 h-24 bg-gradient-to-br ${feature.gradient} rounded-3xl flex items-center justify-center mb-8 mx-auto group-hover:scale-110 transition-elegant shadow-warm`}>
                            <feature.icon className="h-12 w-12 text-white" />
                          </div>
                          <h3 className="text-3xl font-display font-bold text-gray-800 mb-6">
                            {feature.title}
                          </h3>
                          <p className="text-xl text-gray-600 leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={prevFeature}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-elegant hover:shadow-warm transition-elegant flex items-center justify-center group"
            >
              <ChevronLeft className="h-6 w-6 text-gray-600 group-hover:text-amber-600 transition-colors" />
            </button>
            <button
              onClick={nextFeature}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-elegant hover:shadow-warm transition-elegant flex items-center justify-center group"
            >
              <ChevronRight className="h-6 w-6 text-gray-600 group-hover:text-amber-600 transition-colors" />
            </button>

            {/* Dots Indicator */}
            <div className="flex justify-center space-x-2 mt-8">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentFeature(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentFeature
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 w-8'
                    : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section id="reviews" className="py-32 bg-gradient-to-br from-gray-50 to-white relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl lg:text-6xl font-display font-bold mb-6 gradient-text-elegant">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              See what our early users are saying about Vyapaal
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {reviews.map((review: Review, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`group relative ${index === currentReview ? 'scale-105' : ''}`}
                whileHover={{
                  scale: 1.05,
                  y: -10,
                  transition: { duration: 0.3 }
                }}
              >
                <div className="relative bg-white rounded-3xl p-8 shadow-elegant group-hover:shadow-warm transition-elegant">
                  <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
                    <Quote className="h-4 w-4 text-white" />
                  </div>

                  <div className="flex items-center space-x-4 mb-6">
                    <div className="text-4xl">{review.avatar}</div>
                    <div>
                      <h4 className="font-bold text-gray-800">{review.name}</h4>
                      <p className="text-gray-600 text-sm">{review.role}</p>
                    </div>
                  </div>

                  <div className="flex space-x-1 mb-4">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-amber-400 fill-current" />
                    ))}
                  </div>

                  <p className="text-gray-700 leading-relaxed italic">
                    "{review.content}"
                  </p>

                  {index === currentReview && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-full flex items-center justify-center"
                    >
                      <Heart className="h-3 w-3 text-white fill-current" />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Direct Review Submission */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-center"
          >
            {!showReviewForm ? (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-800">Share Your Experience</h3>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Have you used Vyapaal? We'd love to hear about your experience and share it with others!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.button
                    onClick={() => setShowReviewForm(true)}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-8 py-4 rounded-full font-semibold text-lg flex items-center justify-center space-x-3 shadow-warm transition-elegant"
                    whileHover={{ scale: 1.05, y: -2 }}
                  >
                    <Star className="h-5 w-5" />
                    <span>Write a Review</span>
                  </motion.button>
                  <motion.button
                    onClick={() => setShowFeedbackModal(true)}
                    className="bg-white border-2 border-gray-300 hover:border-amber-500 text-gray-700 hover:text-amber-600 px-8 py-4 rounded-full font-semibold text-lg flex items-center justify-center space-x-3 transition-elegant"
                    whileHover={{ scale: 1.05, y: -2 }}
                  >
                    <Heart className="h-5 w-5" />
                    <span>Quick Feedback</span>
                  </motion.button>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl mx-auto"
              >
                <div className="bg-white rounded-3xl p-8 shadow-elegant border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-800">Write Your Review</h3>
                    <button
                      onClick={() => setShowReviewForm(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {reviewSuccess ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-8"
                    >
                      <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                      <h4 className="text-xl font-bold text-gray-800 mb-2">Thank You!</h4>
                      <p className="text-gray-600">Your review has been submitted successfully. We appreciate your feedback!</p>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleReviewSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-gray-700 text-sm font-medium mb-2">Your Name *</label>
                          <input
                            type="text"
                            name="name"
                            value={reviewForm.name}
                            onChange={handleReviewInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-elegant"
                            placeholder="Enter your name"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-medium mb-2">Your Role</label>
                          <input
                            type="text"
                            name="role"
                            value={reviewForm.role}
                            onChange={handleReviewInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-elegant"
                            placeholder="e.g., Business Owner, CEO"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">Email (Optional)</label>
                        <input
                          type="email"
                          name="email"
                          value={reviewForm.email}
                          onChange={handleReviewInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-elegant"
                          placeholder="your@email.com"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">Rating</label>
                        <div className="flex space-x-2 justify-center">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() => setReviewForm(prev => ({ ...prev, rating }))}
                              className="p-1"
                            >
                              <Star
                                className={`h-8 w-8 ${rating <= reviewForm.rating
                                  ? 'text-amber-400 fill-current'
                                  : 'text-gray-300'
                                  } transition-colors hover:text-amber-400`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">Your Review *</label>
                        <textarea
                          name="content"
                          value={reviewForm.content}
                          onChange={handleReviewInputChange}
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-elegant resize-none"
                          placeholder="Tell us about your experience with Vyapaal..."
                          required
                        />
                      </div>

                      <motion.button
                        type="submit"
                        disabled={isReviewLoading}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white py-4 rounded-xl font-semibold text-lg transition-elegant disabled:opacity-50 shadow-warm flex items-center justify-center space-x-3"
                        whileHover={{ scale: isReviewLoading ? 1 : 1.02, y: isReviewLoading ? 0 : -2 }}
                      >
                        {isReviewLoading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Submitting...</span>
                          </>
                        ) : (
                          <>
                            <Send className="h-5 w-5" />
                            <span>Submit Review</span>
                          </>
                        )}
                      </motion.button>
                    </form>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="space-y-6">
                <h2 className="text-5xl lg:text-6xl font-display font-bold gradient-text-elegant">
                  About Vyapaal
                </h2>
                <p className="text-xl text-gray-600 leading-relaxed">
                  We're a passionate team dedicated to empowering businesses with cutting-edge technology.
                  Our mission is to make business management simple, efficient, and accessible to everyone.
                </p>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Founded with the vision of transforming how businesses operate, Vyapaal combines
                  powerful analytics, intuitive design, and robust security to deliver an unparalleled experience.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="text-center">
                  <div className="text-4xl font-bold gradient-text-warm mb-2">2024</div>
                  <div className="text-gray-600">Founded</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold gradient-text-warm mb-2">50+</div>
                  <div className="text-gray-600">Early Users</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative">
                <motion.div
                  className="w-full h-96 bg-gradient-to-br from-amber-100 to-orange-100 rounded-3xl flex items-center justify-center"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="text-center space-y-6">
                    <motion.div
                      animate={{
                        rotateY: [0, 360],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="w-32 h-32 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl"
                    >
                      <Rocket className="h-16 w-16 text-white" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-gray-800">Innovation First</h3>
                    <p className="text-gray-600 max-w-sm">
                      We believe in pushing boundaries and creating solutions that make a real difference.
                    </p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="py-32 bg-gradient-to-br from-indigo-50 to-purple-50 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl lg:text-6xl font-display font-bold mb-6 gradient-text-elegant">
              Powered by Modern Technology
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Built with cutting-edge technologies to ensure reliability, scalability, and performance
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: 'React', icon: '⚛️', description: 'Modern UI Framework', color: 'from-blue-500 to-cyan-400' },
              { name: 'Node.js', icon: '🟢', description: 'Server Runtime', color: 'from-green-500 to-emerald-400' },
              { name: 'MongoDB', icon: '🍃', description: 'Database Solution', color: 'from-green-600 to-teal-500' },
              { name: 'AWS', icon: '☁️', description: 'Cloud Infrastructure', color: 'from-orange-500 to-amber-400' },
              { name: 'TypeScript', icon: '📘', description: 'Type Safety', color: 'from-blue-600 to-indigo-500' },
              { name: 'Docker', icon: '🐳', description: 'Containerization', color: 'from-blue-400 to-cyan-500' },
              { name: 'Redis', icon: '🔴', description: 'Caching Layer', color: 'from-red-500 to-pink-400' },
              { name: 'GraphQL', icon: '💜', description: 'API Layer', color: 'from-purple-500 to-pink-500' }
            ].map((tech, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="relative">
                  <div className={`absolute inset-0 bg-gradient-to-r ${tech.color} rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity`}></div>
                  <div className="relative bg-white rounded-2xl p-6 shadow-elegant group-hover:shadow-warm transition-all duration-300 text-center">
                    <div className="text-4xl mb-4">{tech.icon}</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{tech.name}</h3>
                    <p className="text-gray-600 text-sm">{tech.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories Section */}
      <section className="py-32 bg-gradient-to-br from-emerald-50 to-teal-50 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl lg:text-6xl font-display font-bold mb-6 gradient-text-elegant">
              Success Stories
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              See how businesses are transforming with Vyapaal
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12">
            {[
              {
                company: 'TechStart Solutions',
                industry: 'Technology',
                growth: '+150%',
                metric: 'Revenue Growth',
                quote: 'Vyapaal helped us streamline our operations and scale efficiently. The analytics insights were game-changing.',
                avatar: '🚀',
                results: ['50% faster processing', '30% cost reduction', '2x team productivity']
              },
              {
                company: 'Green Earth Retail',
                industry: 'E-commerce',
                growth: '+200%',
                metric: 'Customer Base',
                quote: 'The automation features saved us countless hours. We can now focus on what matters most - our customers.',
                avatar: '🌱',
                results: ['40% time savings', '60% error reduction', '3x order processing']
              }
            ].map((story, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                  <div className="relative bg-white rounded-3xl p-8 shadow-elegant group-hover:shadow-warm transition-all duration-300">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="text-4xl">{story.avatar}</div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800">{story.company}</h3>
                        <p className="text-gray-600">{story.industry}</p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="text-4xl font-bold gradient-text-warm mb-2">{story.growth}</div>
                      <p className="text-gray-600 font-medium">{story.metric}</p>
                    </div>

                    <blockquote className="text-gray-700 italic mb-6 text-lg leading-relaxed">
                      "{story.quote}"
                    </blockquote>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800">Key Results:</h4>
                      {story.results.map((result, idx) => (
                        <div key={idx} className="flex items-center space-x-3">
                          <CheckCircle className="h-5 w-5 text-emerald-500" />
                          <span className="text-gray-600">{result}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>



      {/* Security & Compliance Section */}
      <section className="py-32 bg-gradient-to-br from-gray-900 to-slate-800 text-white relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl lg:text-6xl font-display font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Enterprise-Grade Security
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Your data is protected with industry-leading security measures
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {[
              {
                icon: Shield,
                title: 'SSL Encryption',
                description: 'End-to-end encryption for all data transmission',
                color: 'from-emerald-500 to-teal-400'
              },
              {
                icon: Database,
                title: 'Secure Storage',
                description: 'Data stored in encrypted, compliant databases',
                color: 'from-blue-500 to-cyan-400'
              },
              {
                icon: Users,
                title: 'Access Control',
                description: 'Role-based permissions and authentication',
                color: 'from-purple-500 to-pink-400'
              },
              {
                icon: Clock,
                title: '24/7 Monitoring',
                description: 'Continuous security monitoring and alerts',
                color: 'from-amber-500 to-orange-400'
              }
            ].map((security, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="relative">
                  <div className={`absolute inset-0 bg-gradient-to-r ${security.color} rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity`}></div>
                  <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 group-hover:border-white/30 transition-all duration-300 text-center">
                    <div className={`w-16 h-16 bg-gradient-to-br ${security.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                      <security.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{security.title}</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{security.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="flex flex-wrap justify-center items-center gap-8 mb-8">
              {['SOC 2', 'GDPR', 'ISO 27001', 'HIPAA Ready'].map((compliance, index) => (
                <div key={index} className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                  <span className="text-white font-medium">{compliance}</span>
                </div>
              ))}
            </div>
            <p className="text-gray-300 text-lg">
              Trusted by businesses worldwide for secure, compliant operations
            </p>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-32 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl lg:text-6xl font-display font-bold mb-6 gradient-text-elegant">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Get started with Vyapaal in just three simple steps
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: '01',
                title: 'Sign Up',
                description: 'Create your account in seconds and get instant access to all features',
                icon: Users,
                color: 'from-blue-500 to-cyan-400'
              },
              {
                step: '02',
                title: 'Setup',
                description: 'Configure your business settings and import your existing data',
                icon: Layers,
                color: 'from-purple-500 to-pink-400'
              },
              {
                step: '03',
                title: 'Grow',
                description: 'Start managing your business efficiently and watch it grow',
                icon: TrendingUp,
                color: 'from-emerald-500 to-teal-400'
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center group"
              >
                <div className="relative mb-8">
                  <div className="text-8xl font-bold text-gray-100 absolute -top-4 left-1/2 transform -translate-x-1/2">
                    {step.step}
                  </div>
                  <div className={`relative w-20 h-20 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mx-auto shadow-elegant group-hover:shadow-warm transition-elegant group-hover:scale-110`}>
                    <step.icon className="h-10 w-10 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-display font-bold text-gray-800 mb-4">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section - Completely Redesigned */}
      <section id="contact" className="py-32 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-amber-500/20 to-orange-600/20 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-full filter blur-3xl animate-pulse animation-delay-2000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl lg:text-6xl font-display font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Let's Connect
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Ready to transform your business? We're here to help you get started on your journey.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Cards */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              {[
                {
                  icon: Mail,
                  title: 'Email Us',
                  content: 'infovyapaal@gmail.com',
                  subtitle: 'We reply within 24 hours',
                  link: 'mailto:infovyapaal@gmail.com'
                },
                {
                  icon: Phone,
                  title: 'Call Us',
                  content: '+91-9608722125',
                  subtitle: 'Mon-Fri, 9AM-6PM IST',
                  link: 'tel:+919608722125'
                },
                {
                  icon: MapPin,
                  title: 'Visit Us',
                  content: 'Buxar, Bihar 802101',
                  subtitle: 'India',
                  link: '#'
                }
              ].map((contact, index) => (
                <motion.a
                  key={index}
                  href={contact.link}
                  className="flex items-start space-x-4 p-6 bg-white/5 rounded-2xl backdrop-blur-sm hover:bg-white/10 transition-elegant"
                  whileHover={{ scale: 1.02, x: 5 }}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <contact.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">{contact.title}</h4>
                    <p className="text-gray-300 font-medium">{contact.content}</p>
                    <p className="text-gray-400 text-sm">{contact.subtitle}</p>
                  </div>
                </motion.a>
              ))}

              {/* Social Media Links */}
              <div className="pt-8">
                <h4 className="text-lg font-semibold text-white mb-6">Follow Us</h4>
                <div className="flex space-x-4">
                  {[
                    { icon: Instagram, link: 'https://instagram.com/shivamkr27', label: 'Instagram' },
                    { icon: Youtube, link: 'https://www.youtube.com/@Vyapaal', label: 'YouTube' },
                    { icon: TwitterIcon, link: 'https://x.com/vyapaal?s=11', label: 'Twitter' },
                    { icon: Facebook, link: '#', label: 'Facebook' }
                  ].map((social, index) => (
                    <motion.a
                      key={index}
                      href={social.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-elegant group"
                      whileHover={{ scale: 1.1, y: -2 }}
                      title={social.label}
                    >
                      <social.icon className="h-6 w-6 text-gray-300 group-hover:text-white transition-colors" />
                    </motion.a>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
                <h3 className="text-2xl font-display font-bold text-white mb-6">Send us a Message</h3>
                <form onSubmit={handleContactSubmit} className="space-y-6">
                  <div>
                    <label className="text-gray-300 text-sm font-medium">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={contactForm.name}
                      onChange={handleContactInputChange}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300"
                      placeholder="Enter your full name"
                    />
                    {contactErrors.name && <p className="text-red-400 text-sm mt-1">{contactErrors.name}</p>}
                  </div>

                  <div>
                    <label className="text-gray-300 text-sm font-medium">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={contactForm.email}
                      onChange={handleContactInputChange}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300"
                      placeholder="Enter your email address"
                    />
                    {contactErrors.email && <p className="text-red-400 text-sm mt-1">{contactErrors.email}</p>}
                  </div>

                  <div>
                    <label className="text-gray-300 text-sm font-medium">Message</label>
                    <textarea
                      name="message"
                      value={contactForm.message}
                      onChange={handleContactInputChange}
                      rows={5}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300 resize-none"
                      placeholder="Tell us about your project, questions, or how we can help you..."
                    />
                    {contactErrors.message && <p className="text-red-400 text-sm mt-1">{contactErrors.message}</p>}
                  </div>

                  {contactErrors.submit && (
                    <p className="text-red-400 text-sm text-center">{contactErrors.submit}</p>
                  )}

                  <motion.button
                    type="submit"
                    disabled={isContactLoading}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white py-4 rounded-xl font-semibold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center space-x-3"
                    whileHover={{ scale: isContactLoading ? 1 : 1.02, y: isContactLoading ? 0 : -2 }}
                  >
                    {isContactLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        <span>Send Message</span>
                      </>
                    )}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-4 gap-12">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <Building2 className="h-7 w-7 text-white" />
                </div>
                <span className="text-3xl font-display font-bold">Vyapaal</span>
              </div>
              <p className="text-gray-300 leading-relaxed max-w-md">
                Empowering businesses with intelligent automation, powerful analytics,
                and elegant design. Join our growing community of successful entrepreneurs.
              </p>
              <div className="text-gray-400 text-sm">
                <p>📍 Buxar, Bihar 802101, India</p>
                <p>📧 infovyapaal@gmail.com</p>
                <p>📞 +91-9608722125</p>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-white">Product</h4>
              <div className="space-y-3">
                {['Features', 'API', 'Support', 'Documentation'].map((item) => (
                  <a key={item} href="#" className="block text-gray-300 hover:text-white transition-colors">
                    {item}
                  </a>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-white">Company</h4>
              <div className="space-y-3">
                {['About', 'Blog', 'Careers', 'Contact'].map((item) => (
                  <a key={item} href="#" className="block text-gray-300 hover:text-white transition-colors">
                    {item}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col lg:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm">
              © 2024 Vyapaal. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm mt-4 lg:mt-0">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
                <a key={item} href="#" className="text-gray-400 hover:text-white transition-colors">
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 w-full max-w-md relative shadow-elegant"
          >
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-8">
              <h3 className="text-3xl font-display font-bold text-gray-800 mb-2">
                {isLoginMode ? 'Welcome Back' : 'Join Vyapaal'}
              </h3>
              <p className="text-gray-600">
                {isLoginMode
                  ? 'Sign in to access your dashboard'
                  : 'Create your account and start your journey'
                }
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLoginMode && (
                <div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-elegant"
                    placeholder="Full Name"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>
              )}

              <div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-elegant"
                  placeholder="Email Address"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-elegant"
                  placeholder="Password"
                />
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>

              {!isLoginMode && (
                <div>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-elegant"
                    placeholder="Confirm Password"
                  />
                  {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>
              )}

              {errors.submit && <p className="text-red-500 text-sm text-center">{errors.submit}</p>}

              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white py-4 rounded-xl font-semibold transition-elegant disabled:opacity-50 shadow-warm"
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
              >
                {isLoading ? 'Processing...' : (isLoginMode ? 'Sign In' : 'Create Account')}
              </motion.button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={toggleMode}
                className="text-gray-600 hover:text-amber-600 transition-colors font-medium"
              >
                {isLoginMode
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"
                }
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Floating Feedback Button */}
      <motion.button
        onClick={() => setShowFeedbackModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-40 group"
        whileHover={{ scale: 1.1, y: -2 }}
        whileTap={{ scale: 0.95 }}
      >
        <Heart className="h-6 w-6 group-hover:scale-110 transition-transform" />
      </motion.button>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 w-full max-w-md relative shadow-elegant"
          >
            <button
              onClick={() => setShowFeedbackModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-display font-bold text-gray-800 mb-2">Share Your Feedback</h3>
              <p className="text-gray-600">Help us improve Vyapaal with your valuable feedback</p>
            </div>

            {feedbackSuccess ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                <h4 className="text-xl font-bold text-gray-800 mb-2">Thank You!</h4>
                <p className="text-gray-600">Your feedback has been sent successfully.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-6">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Rating</label>
                  <div className="flex space-x-2 justify-center">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setFeedbackForm(prev => ({ ...prev, rating }))}
                        className="p-1"
                      >
                        <Star
                          className={`h-8 w-8 ${rating <= feedbackForm.rating
                            ? 'text-amber-400 fill-current'
                            : 'text-gray-300'
                            } transition-colors`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Email (Optional)</label>
                  <input
                    type="email"
                    name="email"
                    value={feedbackForm.email}
                    onChange={handleFeedbackInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-elegant"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Message</label>
                  <textarea
                    name="message"
                    value={feedbackForm.message}
                    onChange={handleFeedbackInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-elegant resize-none"
                    placeholder="Tell us what you think about Vyapaal..."
                    required
                  />
                </div>

                <motion.button
                  type="submit"
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white py-4 rounded-xl font-semibold transition-elegant shadow-warm"
                  whileHover={{ scale: 1.02, y: -2 }}
                >
                  Send Feedback
                </motion.button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* Feature Modal */}
      {showFeatureModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 w-full max-w-4xl relative shadow-elegant max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => setShowFeatureModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-8">
              <h3 className="text-3xl font-display font-bold text-gray-800 mb-4">All Features</h3>
              <p className="text-gray-600">Discover everything Vyapaal has to offer</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 group"
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-800 mb-3">{feature.title}</h4>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Support Modal */}
      {showSupportModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 w-full max-w-2xl relative shadow-elegant max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => setShowSupportModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-3xl font-display font-bold text-gray-800 mb-4">Support Center</h3>
              <p className="text-gray-600">Get help and find answers to common questions</p>
            </div>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <a
                  href="mailto:infovyapaal@gmail.com"
                  className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">Email Support</h4>
                    <p className="text-gray-600 text-sm">Get help via email</p>
                  </div>
                </a>

                <a
                  href="https://www.youtube.com/@Vyapaal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <Youtube className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">Video Tutorials</h4>
                    <p className="text-gray-600 text-sm">Watch how-to videos</p>
                  </div>
                </a>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6">
                <h4 className="text-xl font-bold text-gray-800 mb-4">Frequently Asked Questions</h4>
                <div className="space-y-4">
                  {[
                    {
                      question: "How do I get started with Vyapaal?",
                      answer: "Simply click 'Get Started' to create your account and begin your free trial."
                    },
                    {
                      question: "Is my data secure?",
                      answer: "Yes, we use bank-level encryption and follow industry best practices for data security."
                    },
                    {
                      question: "Can I integrate with other tools?",
                      answer: "Vyapaal supports integrations with popular business tools and APIs."
                    },
                    {
                      question: "Do you offer customer support?",
                      answer: "Yes, we provide 24/7 customer support via email and our help center."
                    }
                  ].map((faq, index) => (
                    <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <h5 className="font-semibold text-gray-800 mb-2">{faq.question}</h5>
                      <p className="text-gray-600 text-sm">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default LandingPage;