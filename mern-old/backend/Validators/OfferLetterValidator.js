const { z } = require('zod');

const issueOfferLetterSchema = z.object({
  candidateName: z.string().min(1, "Candidate name is required"),
  email: z.string().email("Invalid email address"),
  position: z.string().min(1, "Position is required"),
  department: z.string().min(1, "Department is required"),
  salary: z.union([z.string(), z.number()]).transform(v => String(v)),
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), "Invalid start date"),
  endDate: z.string().optional().nullable().refine(val => !val || !isNaN(Date.parse(val)), "Invalid end date"),
  duration: z.string().optional(),
  joiningLocation: z.string().optional(),
  workType: z.enum(['On-site', 'Remote', 'Hybrid']).default('On-site'),
  validUntil: z.string().refine(val => !isNaN(Date.parse(val)), "Invalid acceptance deadline"),
  offerType: z.enum(['Job', 'Internship']).default('Job'),
  payoutFrequency: z.string().optional(),
  reportingManager: z.string().optional(),
  hrContactName: z.string().optional(),
  hrContactEmail: z.string().email().optional().or(z.literal('')),
  hrContactPhone: z.string().optional(),
  additionalNotes: z.string().optional(),
  applicationId: z.string().optional().nullable()
}).superRefine((data, ctx) => {
  if (data.workType !== 'Remote' && (!data.joiningLocation || data.joiningLocation.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Joining location is required for non-remote roles",
      path: ["joiningLocation"],
    });
  }
});

const extendOfferLetterSchema = z.object({
  newValidUntil: z.string().refine(val => !isNaN(Date.parse(val)), "Invalid new valid until date"),
  newStartDate: z.string().optional().nullable().refine(val => !val || !isNaN(Date.parse(val)), "Invalid new start date"),
  newEndDate: z.string().optional().nullable().refine(val => !val || !isNaN(Date.parse(val)), "Invalid new end date"),
  newDuration: z.string().optional(),
  additionalNotes: z.string().optional()
});

module.exports = {
  issueOfferLetterSchema,
  extendOfferLetterSchema
};
