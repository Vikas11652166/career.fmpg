import React, { useState, useEffect } from 'react';
import OfferDetailsFormFields from './OfferDetailsFormFields';

const getDefaultOfferFormData = () => ({
  candidateName: '',
  email: '',
  position: '',
  department: '',
  companyName: '',
  salary: '',
  startDate: '',
  joiningLocation: '',
  workType: 'On-site',
  benefits: '',
  reportingManager: '',
  hrContactName: '',
  hrContactEmail: '',
  hrContactPhone: '',
  validUntil: '',
  additionalNotes: '',
  offerType: 'Job',
  payoutFrequency: 'Monthly',
  endDate: '',
  duration: ''
});

const OfferLetterForm = ({ onSubmit, loading, editData = null }) => {
  const [formData, setFormData] = useState(getDefaultOfferFormData());
  const [showForm, setShowForm] = useState(false);
  const [calculatedDuration, setCalculatedDuration] = useState('');
  const [durationMode, setDurationMode] = useState('calculate'); // 'calculate' or 'manual'

  // Set default dates for new forms
  useEffect(() => {
    if (!editData && showForm && !formData.startDate) {
      const today = new Date();
      const startDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      const validUntil = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days from now

      setFormData(prev => ({
        ...prev,
        startDate: startDate.toISOString().split('T')[0],
        validUntil: validUntil.toISOString().split('T')[0]
      }));
    }
  }, [showForm, editData]);

  // Logic to calculate duration preview
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);

      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start) {
        const diffMs = end.getTime() - start.getTime();
        const totalDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const months = Math.floor(totalDays / 30);
        const days = totalDays % 30;

        let text = '';
        if (months > 0 && days > 0) {
          text = `${months} month${months > 1 ? 's' : ''} ${days} day${days > 1 ? 's' : ''}`;
        } else if (months > 0) {
          text = `${months} month${months > 1 ? 's' : ''}`;
        } else {
          text = `${totalDays} day${totalDays > 1 ? 's' : ''}`;
        }
        setCalculatedDuration(text);
      } else {
        setCalculatedDuration('');
      }
    } else {
      setCalculatedDuration('');
    }
  }, [formData.startDate, formData.endDate]);

  // Effect to populate form data when editing
  useEffect(() => {
    if (editData) {
      setFormData({
        candidateName: editData.candidateName || '',
        email: editData.email || '',
        position: editData.position || '',
        department: editData.department || '',
        companyName: editData.companyName || '',
        salary: editData.salary || '',
        startDate: editData.startDate ? editData.startDate.split('T')[0] : '',
        joiningLocation: editData.joiningLocation || '',
        workType: editData.workType || 'On-site',
        benefits: Array.isArray(editData.benefits) ? editData.benefits.join(', ') : (editData.benefits || ''),
        reportingManager: editData.reportingManager || '',
        hrContactName: editData.hrContactName || '',
        hrContactEmail: editData.hrContactEmail || '',
        hrContactPhone: editData.hrContactPhone || '',
        validUntil: editData.validUntil ? editData.validUntil.split('T')[0] : '',
        additionalNotes: editData.additionalNotes || '',
        offerType: editData.offerType || 'Job',
        payoutFrequency: editData.payoutFrequency || 'Monthly',
        endDate: editData.endDate ? editData.endDate.split('T')[0] : '',
        duration: editData.duration || ''
      });
      setShowForm(true);
    }
  }, [editData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Convert benefits string to array
    const processedData = {
      ...formData,
      benefits: formData.benefits ? formData.benefits.split(',').map(b => b.trim()).filter(b => b) : [],
      salary: formData.salary
    };

    // Clean up data based on duration mode
    if (durationMode === 'calculate') {
      processedData.duration = ''; // Rely on backend to calculate from dates
    } else {
      processedData.endDate = ''; // Rely on manual duration string
    }

    await onSubmit(processedData);
    setFormData(getDefaultOfferFormData());
    setShowForm(false);
  };

  return (
    <div className="bg-secondary-black rounded-lg shadow-md border border-dark-gray">
      <div className="p-6">
        <h3 className="text-xl font-semibold text-white mb-5">Issue Offer Letter</h3>

        {!showForm ? (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-6">Create a new offer letter for a candidate</p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="px-5 py-2 bg-lime-400 hover:bg-lime-600 text-black font-medium rounded-md transition-colors"
            >
              New Offer Letter
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <OfferDetailsFormFields 
              formData={formData}
              handleChange={handleChange}
              durationMode={durationMode}
              setDurationMode={setDurationMode}
              calculatedDuration={calculatedDuration}
            />

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-5 py-2 bg-lime-400 hover:bg-lime-600 text-black font-medium rounded-md transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Generating Offer Letter...' : 'Generate Offer Letter'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default OfferLetterForm;