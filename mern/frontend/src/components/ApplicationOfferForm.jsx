import React, { useState } from 'react';
import OfferDetailsFormFields from './certificates/OfferDetailsFormFields';

const ApplicationOfferForm = ({ application, job, onSubmit, loading, onCancel }) => {
  const [calculatedDuration, setCalculatedDuration] = React.useState('');
  const [durationMode, setDurationMode] = useState('calculate');
  const [formData, setFormData] = useState({
    position: job?.title || '',
    department: job?.department || 'General',
    salary: job?.salary || '',
    startDate: '',
    joiningLocation: job?.location || '',
    workType: 'On-site',
    benefits: '',
    reportingManager: '',
    hrContactName: job?.hrContact?.name || 'HR Team',
    hrContactEmail: job?.hrContact?.email || '',
    hrContactPhone: job?.hrContact?.phone || '',
    validUntil: '',
    additionalNotes: '',
    endDate: '',
    duration: ''
  });

  React.useEffect(() => {
    // Set default dates
    const today = new Date();
    const startDate = new Date(today.setDate(today.getDate() + 30)); // 30 days from now
    const validUntil = new Date(today.setDate(today.getDate() + 14)); // 14 days from start date
    
    setFormData(prev => ({
      ...prev,
      startDate: startDate.toISOString().split('T')[0],
      validUntil: validUntil.toISOString().split('T')[0],
      position: job?.title || prev.position,
      department: job?.department || prev.department,
      salary: job?.salary || prev.salary,
      joiningLocation: job?.location || prev.joiningLocation,
      hrContactName: job?.hrContact?.name || 'HR Team',
      hrContactEmail: job?.hrContact?.email || '',
      hrContactPhone: job?.hrContact?.phone || ''
    }));
  }, [job]);

  // Logic to calculate duration preview
  React.useEffect(() => {
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
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

    onSubmit(processedData);
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-700 mt-4">
      <h3 className="text-lg font-medium text-white mb-4">Generate Offer Letter</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <OfferDetailsFormFields 
          formData={formData}
          handleChange={handleChange}
          durationMode={durationMode}
          setDurationMode={setDurationMode}
          calculatedDuration={calculatedDuration}
          hidePersonalFields={true}
        />

        <div className="flex space-x-4 pt-4">
          <button 
            type="submit" 
            disabled={loading}
            className={`px-5 py-2 bg-lime-400 hover:bg-lime-600 text-black font-medium rounded-md transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Generating Offer Letter...' : 'Generate Offer Letter'}
          </button>
          <button 
            type="button" 
            onClick={onCancel}
            className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-md transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplicationOfferForm;
