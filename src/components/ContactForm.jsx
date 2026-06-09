'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Send, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/lib/customSupabaseClient';

const ContactForm = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [properties, setProperties] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    propertyInterest: '',
    message: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    let isMounted = true;

    const loadProperties = async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id, name, location')
        .order('created_at', { ascending: false });

      if (!error && isMounted) {
        setProperties(data || []);
      }
    };

    loadProperties();
    return () => { isMounted = false; };
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (formData.phone.trim() && !/^\+?[\d\s-]{8,}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Validation Error ❌',
        description: 'Please fill in all required fields correctly.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result?.error || 'Unable to send message.');
      }

      toast({
        title: 'Message Sent Successfully! ✅',
        description: "Thank you for contacting us. We'll get back to you soon.",
      });

      setFormData({
        name: '',
        email: '',
        phone: '',
        propertyInterest: '',
        message: ''
      });
      setErrors({});
    } catch (error) {
      toast({
        title: 'Message Not Sent',
        description: error.message || 'Please try again or contact us directly by email.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-300">
          Full Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          disabled={isSubmitting}
          className={`w-full px-4 py-3 bg-[#0f0f0f] border-2 rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors ${
            errors.name ? 'border-red-500' : 'border-[#d4af37]/30 focus:border-[#d4af37]'
          }`}
          placeholder="John Doe"
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-300">
          Email Address *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          disabled={isSubmitting}
          className={`w-full px-4 py-3 bg-[#0f0f0f] border-2 rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors ${
            errors.email ? 'border-red-500' : 'border-[#d4af37]/30 focus:border-[#d4af37]'
          }`}
          placeholder="john@example.com"
        />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium mb-2 text-gray-300">
          Phone Number (Optional)
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          disabled={isSubmitting}
          className={`w-full px-4 py-3 bg-[#0f0f0f] border-2 rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors ${
            errors.phone ? 'border-red-500' : 'border-[#d4af37]/30 focus:border-[#d4af37]'
          }`}
          placeholder="+57 320 9937784"
        />
        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
      </div>

      <div>
        <label htmlFor="propertyInterest" className="block text-sm font-medium mb-2 text-gray-300">
          Property of Interest
        </label>
        <select
          id="propertyInterest"
          name="propertyInterest"
          value={formData.propertyInterest}
          onChange={handleChange}
          disabled={isSubmitting}
          className="w-full px-4 py-3 bg-[#0f0f0f] border-2 border-[#d4af37]/30 rounded-lg text-white focus:outline-none focus:border-[#d4af37] transition-colors"
        >
          <option value="">Select a property (optional)</option>
          {properties.map(property => (
            <option key={property.id} value={property.name}>
              {property.name}{property.location ? ` — ${property.location}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium mb-2 text-gray-300">
          Message *
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          disabled={isSubmitting}
          rows={5}
          className={`w-full px-4 py-3 bg-[#0f0f0f] border-2 rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors resize-none ${
            errors.message ? 'border-red-500' : 'border-[#d4af37]/30 focus:border-[#d4af37]'
          }`}
          placeholder="Tell us about your investment goals..."
        />
        {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message}</p>}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#d4af37] hover:bg-[#c9a961] text-[#0f0f0f] font-semibold py-6 text-lg rounded-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send size={20} className="mr-2" />
            {t.contact.sendMessage || 'Send Message'}
          </>
        )}
      </Button>
    </form>
  );
};

export default ContactForm;
