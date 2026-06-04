import React from 'react';

const OfferDetailsFormFields = ({
  formData,
  handleChange,
  durationMode,
  setDurationMode,
  calculatedDuration,
  hidePersonalFields = false,
  prefix = '', // For field names like 'newValidUntil'
  hideFields = [] // List of fields to completely hide
}) => {
  const getFieldName = (name) => prefix ? `${prefix}${name.charAt(0).toUpperCase()}${name.slice(1)}` : name;
  const isHidden = (name) => hideFields.includes(name);

  return (
    <>
      {!hidePersonalFields && !isHidden('candidateName') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
          <div>
            <label htmlFor={getFieldName('candidateName')} className="block text-sm font-medium text-gray-300 mb-2">
              Candidate Name *
            </label>
            <input
              type="text"
              id={getFieldName('candidateName')}
              name={getFieldName('candidateName')}
              value={formData[getFieldName('candidateName')]}
              onChange={handleChange}
              required
              placeholder="Enter candidate name"
              className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor={getFieldName('email')} className="block text-sm font-medium text-gray-300 mb-2">
              Email *
            </label>
            <input
              type="email"
              id={getFieldName('email')}
              name={getFieldName('email')}
              value={formData[getFieldName('email')]}
              onChange={handleChange}
              required
              placeholder="Enter candidate email"
              className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {!isHidden('position') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
          <div>
            <label htmlFor={getFieldName('position')} className="block text-sm font-medium text-gray-300 mb-2">
              Position *
            </label>
            <input
              type="text"
              id={getFieldName('position')}
              name={getFieldName('position')}
              value={formData[getFieldName('position')]}
              onChange={handleChange}
              required
              placeholder="Enter job position"
              className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor={getFieldName('department')} className="block text-sm font-medium text-gray-300 mb-2">
              Department *
            </label>
            <input
              type="text"
              id={getFieldName('department')}
              name={getFieldName('department')}
              value={formData[getFieldName('department')]}
              onChange={handleChange}
              required
              placeholder="Enter department"
              className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {!isHidden('offerType') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
          <div>
            <label htmlFor={getFieldName('offerType')} className="block text-sm font-medium text-gray-300 mb-2">
              Offer Type *
            </label>
            <select
              id={getFieldName('offerType')}
              name={getFieldName('offerType')}
              value={formData[getFieldName('offerType')]}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
            >
              <option value="Job">Full-time Job</option>
              <option value="Internship">Internship</option>
            </select>
          </div>
          {formData[getFieldName('offerType')] === 'Internship' && (
            <div>
              <label htmlFor={getFieldName('payoutFrequency')} className="block text-sm font-medium text-gray-300 mb-2">
                Stipend Payout Frequency *
              </label>
              <select
                id={getFieldName('payoutFrequency')}
                name={getFieldName('payoutFrequency')}
                value={formData[getFieldName('payoutFrequency')]}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
              >
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Lumpsum">Lumpsum</option>
                <option value="On Completion">On Completion</option>
                <option value="Performance Based">Performance Based</option>
              </select>
            </div>
          )}
        </div>
      )}

      {!isHidden('companyName') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
          <div>
            <label htmlFor={getFieldName('companyName')} className="block text-sm font-medium text-gray-300 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              id={getFieldName('companyName')}
              name={getFieldName('companyName')}
              value={formData[getFieldName('companyName')]}
              onChange={handleChange}
              required
              placeholder="Enter company name"
              className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor={getFieldName('salary')} className="block text-sm font-medium text-gray-300 mb-2">
              {formData[getFieldName('offerType')] === 'Internship' ? 'Monthly Stipend (₹)' : 'Annual Salary (₹)'} *
            </label>
            <input
              type="text"
              id={getFieldName('salary')}
              name={getFieldName('salary')}
              value={formData[getFieldName('salary')]}
              onChange={handleChange}
              required
              placeholder={formData[getFieldName('offerType')] === 'Internship' ? "Enter monthly stipend" : "Enter annual salary"}
              className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
        {!isHidden('startDate') && (
          <div>
            <label htmlFor={getFieldName('startDate')} className="block text-sm font-medium text-gray-300 mb-2">
              Start Date *
            </label>
            <input
              type="date"
              id={getFieldName('startDate')}
              name={getFieldName('startDate')}
              value={formData[getFieldName('startDate')]}
              onChange={handleChange}
              required={!isHidden('startDate')}
              className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
            />
          </div>
        )}
        <div className="mb-5">
          <div className="flex items-center space-x-4 mb-3">
            <span className="text-sm font-medium text-gray-300">Contract Length Mode:</span>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name={getFieldName('durationMode')}
                value="calculate"
                checked={durationMode === 'calculate'}
                onChange={() => setDurationMode('calculate')}
                className="text-lime-400 focus:ring-lime-400 bg-gray-800 border-gray-600"
              />
              <span className="text-sm text-gray-400">By End Date</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name={getFieldName('durationMode')}
                value="manual"
                checked={durationMode === 'manual'}
                onChange={() => setDurationMode('manual')}
                className="text-lime-400 focus:ring-lime-400 bg-gray-800 border-gray-600"
              />
              <span className="text-sm text-gray-400">Manual Duration</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {durationMode === 'calculate' ? (
              <div>
                <label htmlFor={getFieldName('endDate')} className="block text-sm font-medium text-gray-300 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  id={getFieldName('endDate')}
                  name={getFieldName('endDate')}
                  value={formData[getFieldName('endDate')]}
                  onChange={handleChange}
                  required={durationMode === 'calculate'}
                  className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
                />
                {calculatedDuration && (
                  <p className="mt-1 text-xs text-lime-400">Calculated Duration: {calculatedDuration}</p>
                )}
              </div>
            ) : (
              <div>
                <label htmlFor={getFieldName('duration')} className="block text-sm font-medium text-gray-300 mb-2">
                  Duration (e.g. 6 months) *
                </label>
                <input
                  type="text"
                  id={getFieldName('duration')}
                  name={getFieldName('duration')}
                  value={formData[getFieldName('duration')]}
                  onChange={handleChange}
                  required={durationMode === 'manual'}
                  placeholder="Enter duration"
                  className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
        {!isHidden('workType') && (
          <div>
            <label htmlFor={getFieldName('workType')} className="block text-sm font-medium text-gray-300 mb-2">
              Work Type
            </label>
            <select
              id={getFieldName('workType')}
              name={getFieldName('workType')}
              value={formData[getFieldName('workType')]}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
            >
              <option value="On-site">On-site</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>
        )}

        {!isHidden('joiningLocation') && formData[getFieldName('workType')] !== 'Remote' && (
          <div>
            <label htmlFor={getFieldName('joiningLocation')} className="block text-sm font-medium text-gray-300 mb-2">
              Joining Location *
            </label>
            <input
              type="text"
              id={getFieldName('joiningLocation')}
              name={getFieldName('joiningLocation')}
              value={formData[getFieldName('joiningLocation')]}
              onChange={handleChange}
              required
              placeholder="Enter office location"
              className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
        {!isHidden('reportingManager') && (
          <div>
            <label htmlFor={getFieldName('reportingManager')} className="block text-sm font-medium text-gray-300 mb-2">
              Reporting Manager
            </label>
            <input
              type="text"
              id={getFieldName('reportingManager')}
              name={getFieldName('reportingManager')}
              value={formData[getFieldName('reportingManager')]}
              onChange={handleChange}
              placeholder="Enter reporting manager name"
              className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
            />
          </div>
        )}
        {!isHidden('validUntil') && (
          <div>
            <label htmlFor={getFieldName('validUntil')} className="block text-sm font-medium text-gray-300 mb-2">
              Offer Acceptance Deadline *
            </label>
            <input
              type="date"
              id={getFieldName('validUntil')}
              name={getFieldName('validUntil')}
              value={formData[getFieldName('validUntil')]}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
            />
          </div>
        )}
      </div>

      {!isHidden('benefits') && (
        <div className="mb-5">
          <label htmlFor={getFieldName('benefits')} className="block text-sm font-medium text-gray-300 mb-2">
            Benefits (comma-separated)
          </label>
          <input
            type="text"
            id={getFieldName('benefits')}
            name={getFieldName('benefits')}
            value={formData[getFieldName('benefits')]}
            onChange={handleChange}
            placeholder="e.g. Health Insurance, 401k, Flexible PTO"
            className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
          />
        </div>
      )}

      {!isHidden('hrContact') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-5">
          <div>
            <label htmlFor={getFieldName('hrContactName')} className="block text-sm font-medium text-gray-300 mb-2">
              HR Contact Name
            </label>
            <input
              type="text"
              id={getFieldName('hrContactName')}
              name={getFieldName('hrContactName')}
              value={formData[getFieldName('hrContactName')]}
              onChange={handleChange}
              placeholder="Enter HR contact name"
              className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor={getFieldName('hrContactEmail')} className="block text-sm font-medium text-gray-300 mb-2">
              HR Contact Email
            </label>
            <input
              type="email"
              id={getFieldName('hrContactEmail')}
              name={getFieldName('hrContactEmail')}
              value={formData[getFieldName('hrContactEmail')]}
              onChange={handleChange}
              placeholder="Enter HR email"
              className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor={getFieldName('hrContactPhone')} className="block text-sm font-medium text-gray-300 mb-2">
              HR Contact Phone
            </label>
            <input
              type="tel"
              id={getFieldName('hrContactPhone')}
              name={getFieldName('hrContactPhone')}
              value={formData[getFieldName('hrContactPhone')]}
              onChange={handleChange}
              placeholder="Enter HR phone"
              className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {!isHidden('additionalNotes') && (
        <div className="mb-5">
          <label htmlFor={getFieldName('additionalNotes')} className="block text-sm font-medium text-gray-300 mb-2">
            Additional Notes
          </label>
          <textarea
            id={getFieldName('additionalNotes')}
            name={getFieldName('additionalNotes')}
            value={formData[getFieldName('additionalNotes')]}
            onChange={handleChange}
            rows="3"
            placeholder="Any additional terms or notes"
            className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
          ></textarea>
        </div>
      )}
    </>
  );
};

export default OfferDetailsFormFields;
