const yup = require('yup');

const connectionSchema = yup.object({
  toUserId: yup.string().required(),
  type: yup.string().oneOf(['mentor_request', 'mentee_request']).required()
});

const matchingPreferencesSchema = yup.object({
  preferred_industries: yup.array().of(yup.string()),
  min_experience: yup.number().min(0),
  max_experience: yup.number().min(0),
  preferred_meeting_frequency: yup.string(),
  communication_style: yup.string()
});

const progressUpdateSchema = yup.object({
  goals: yup.array().of(yup.object({
    title: yup.string().required(),
    description: yup.string(),
    deadline: yup.date()
  })),
  notes: yup.string()
});

module.exports = {
  connectionSchema,
  matchingPreferencesSchema,
  progressUpdateSchema
};

