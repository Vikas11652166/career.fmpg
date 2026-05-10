import React from 'react';
import { motion } from 'framer-motion';
import { FaFileAlt, FaTimes, FaDownload, FaCheck } from 'react-icons/fa';
import OfferDetailsFormFields from './OfferDetailsFormFields';

const BulkOfferModal = ({ 
  show, 
  onClose, 
  onSubmit, 
  loading, 
  file, 
  setFile, 
  commonDetails, 
  setCommonDetails,
  onDownloadSample
}) => {
  const [durationMode, setDurationMode] = React.useState('calculate');
  
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#1a1a1a] border border-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gradient-to-r from-purple-900/20 to-transparent">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <FaFileAlt className="text-purple-500" />
              Bulk Issue Offer Letters
            </h3>
            <p className="text-gray-400 text-sm mt-1">Generate multiple offer letters by uploading a CSV file</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <FaTimes />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form id="bulkOfferForm" onSubmit={onSubmit} className="space-y-8">
            {/* Step 1: Upload CSV */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-500/20 text-[10px]">1</span>
                  Upload Candidate Data
                </h4>
                <button 
                  type="button"
                  onClick={onDownloadSample}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  <FaDownload size={10} /> Download Sample CSV
                </button>
              </div>
              
              <div className="p-8 border-2 border-dashed border-gray-800 rounded-xl bg-white/5 hover:bg-white/[0.07] transition-all group relative">
                <input 
                  type="file" 
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FaFileAlt className="text-2xl text-purple-500" />
                  </div>
                  <p className="text-white font-medium mb-1">
                    {file ? file.name : "Click or drag CSV file here"}
                  </p>
                  <p className="text-gray-400 text-xs">Only .csv files are supported</p>
                </div>
              </div>
              
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4">
                <p className="text-indigo-300 text-xs leading-relaxed">
                  <strong>Required CSV Columns:</strong> candidateName, email, position, department, salary, startDate (YYYY-MM-DD)
                </p>
              </div>
            </div>

            {/* Step 2: Common Details */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-500/20 text-[10px]">2</span>
                Common Offer Details
                <span className="text-[10px] text-gray-500 normal-case font-normal">(Shared across all letters)</span>
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400">Joining Location</label>
                  <input 
                    type="text"
                    value={commonDetails.joiningLocation}
                    onChange={(e) => setCommonDetails({...commonDetails, joiningLocation: e.target.value})}
                    placeholder="Indore"
                    className="w-full bg-[#252525] border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400">Offer Acceptance Deadline</label>
                  <input 
                    type="date"
                    value={commonDetails.validUntil}
                    onChange={(e) => setCommonDetails({...commonDetails, validUntil: e.target.value})}
                    className="w-full bg-[#252525] border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
                    required
                  />
                </div>
                <div className="col-span-full space-y-3 pt-2">
                  <div className="flex items-center space-x-4">
                    <span className="text-xs font-medium text-gray-400">Common Contract Length Mode:</span>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="bulkDurationMode"
                        value="calculate"
                        checked={durationMode === 'calculate'}
                        onChange={() => setDurationMode('calculate')}
                        className="text-purple-500 focus:ring-purple-500 bg-gray-800 border-gray-700"
                      />
                      <span className="text-xs text-gray-400">By End Date</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="bulkDurationMode"
                        value="manual"
                        checked={durationMode === 'manual'}
                        onChange={() => setDurationMode('manual')}
                        className="text-purple-500 focus:ring-purple-500 bg-gray-800 border-gray-700"
                      />
                      <span className="text-xs text-gray-400">Manual Duration</span>
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {durationMode === 'calculate' ? (
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-400">End Date (Optional)</label>
                        <input 
                          type="date"
                          value={commonDetails.endDate}
                          onChange={(e) => setCommonDetails({...commonDetails, endDate: e.target.value})}
                          className="w-full bg-[#252525] border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-400">Duration (Optional)</label>
                        <input 
                          type="text"
                          value={commonDetails.duration}
                          onChange={(e) => setCommonDetails({...commonDetails, duration: e.target.value})}
                          placeholder="e.g. 6 months"
                          className="w-full bg-[#252525] border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400">Work Type</label>
                  <select 
                    value={commonDetails.workType}
                    onChange={(e) => setCommonDetails({...commonDetails, workType: e.target.value})}
                    className="w-full bg-[#252525] border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
                  >
                    <option value="On-site">On-site</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                 <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400">Other common Details</label>
                  <div className="flex items-center gap-2 py-2">
                    <input 
                      type="checkbox"
                      id="sendBulkEmail"
                      checked={commonDetails.sendEmail}
                      onChange={(e) => setCommonDetails({...commonDetails, sendEmail: e.target.checked})}
                      className="w-4 h-4 rounded border-gray-800 bg-[#252525] text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor="sendBulkEmail" className="text-sm text-gray-300 cursor-pointer">
                      Send offer letter notification emails automatically
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Signature Info */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-500/20 text-[10px]">3</span>
                HR Contact Information
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400">HR Name</label>
                  <input 
                    type="text"
                    value={commonDetails.hrContactName}
                    onChange={(e) => setCommonDetails({...commonDetails, hrContactName: e.target.value})}
                    className="w-full bg-[#252525] border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400">HR Email</label>
                  <input 
                    type="email"
                    value={commonDetails.hrContactEmail}
                    onChange={(e) => setCommonDetails({...commonDetails, hrContactEmail: e.target.value})}
                    className="w-full bg-[#252525] border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400">HR Phone</label>
                  <input 
                    type="text"
                    value={commonDetails.hrContactPhone}
                    onChange={(e) => setCommonDetails({...commonDetails, hrContactPhone: e.target.value})}
                    className="w-full bg-[#252525] border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 flex justify-end gap-3 bg-[#1a1a1a]">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-700 text-gray-300 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="bulkOfferForm"
            disabled={loading || !file}
            className="px-8 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/20 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <span>Processing...</span>
                Processing...
              </>
            ) : (
              <>
                <FaCheck />
                Generate Offer Letters
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default BulkOfferModal;
