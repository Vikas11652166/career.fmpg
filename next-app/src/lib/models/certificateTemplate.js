import mongoose from 'mongoose';

const templateElementSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, enum: ['text', 'rectangle', 'line', 'image', 'qr'], required: true },
  text: { type: String, default: '' },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  fontSize: { type: Number, default: 18 },
  fontFamily: { type: String, default: 'Arial' },
  fontWeight: { type: String, default: '400' },
  color: { type: String, default: '#111827' },
  align: { type: String, default: 'left' },
  backgroundColor: { type: String, default: 'transparent' },
  borderColor: { type: String, default: 'transparent' },
  borderWidth: { type: Number, default: 0 },
  rotation: { type: Number, default: 0 },
  zIndex: { type: Number, default: 0 },
  src: { type: String, default: '' } // For images
});

const certificateTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  documentType: { type: String, enum: ['certificate', 'offerLetter', 'extendedOfferLetter', 'lor'], required: true, default: 'certificate' },
  canvas: {
    width: { type: Number, default: 1123 }, // A4 Landscape default
    height: { type: Number, default: 794 },
    backgroundColor: { type: String, default: '#0d0d0d' },
    backgroundImage: { type: String, default: '' }
  },
  elements: [templateElementSchema],
  isDefault: { type: Boolean, default: false }
}, {
  timestamps: true
});

const CertificateTemplate = mongoose.models.CertificateTemplate || mongoose.model('CertificateTemplate', certificateTemplateSchema);
export default CertificateTemplate;
