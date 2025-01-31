const yup = require('yup');
const { ValidationError } = require('../utils/errors');

const validateRegistration = (req, res, next) => {
  try {
    console.log('Validating registration data:', JSON.stringify(req.body, null, 2));
    
    const { email, password, role } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      throw new ValidationError('Valid email is required');
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters');
    }

    if (!role || !['mentor', 'mentee', 'both'].includes(role)) {
      throw new ValidationError('Valid role is required (mentor, mentee, or both)');
    }

    next();
  } catch (error) {
    next(error);
  }
};

const validateLogin = (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      throw new ValidationError('Valid email is required');
    }

    if (!password || typeof password !== 'string') {
      throw new ValidationError('Password is required');
    }

    next();
  } catch (error) {
    next(error);
  }
};


const registrationSchema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().min(6).required(),
  role: yup.string().oneOf(['mentor', 'mentee', 'both']).required(),
});

const loginSchema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().required(),
});

const profileSchema = yup.object({
  full_name: yup.string().required('Full name is required'),
  bio: yup.string(),
  industry: yup.string().required('Industry is required'),
  years_experience: yup.number()
    .min(0, 'Years of experience must be positive')
    .required('Years of experience is required'),
  availability: yup.object({
    weekdays: yup.array().of(yup.string()),
    timeSlots: yup.array().of(yup.string())
  }).default({})
});

const userUpdateSchema = yup.object({
  role: yup.string().oneOf(['mentor', 'mentee', 'both']),
});


const validateProfile = async (req, res, next) => {
  try {
    await profileSchema.validate(req.body, { abortEarly: false });
    next();
  } catch (error) {
    res.status(400).json({
      message: 'Validation failed',
      errors: error.errors
    });
  }
};



const validateUserUpdate = async (req, res, next) => {
  try {
    await userUpdateSchema.validate(req.body);
    next();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const matchingPreferencesSchema = yup.object({
  preferred_industries: yup.array().of(yup.string()).default([]),
  min_experience: yup.number().min(0).default(0),
  max_experience: yup.number().min(0).default(999),
  preferred_meeting_frequency: yup.string()
    .oneOf(['weekly', 'biweekly', 'monthly'])
    .default('weekly')
});

const validateMatchingPreferences = async (req, res, next) => {
  try {
    const validatedData = await matchingPreferencesSchema.validate(req.body);
    req.body = validatedData;
    next();
  } catch (error) {
    res.status(400).json({
      message: 'Validation failed',
      errors: error.errors
    });
  }
};

const connectionSchema = yup.object({
  toUserId: yup.string().required('Target user ID is required'),
  type: yup.string()
    .oneOf(['mentor_request', 'mentee_request'], 'Invalid connection type')
    .required('Connection type is required')
});

const progressSchema = yup.object({
  goals: yup.array().of(
    yup.object({
      title: yup.string().required(),
      description: yup.string(),
      deadline: yup.date(),
      status: yup.string().oneOf(['pending', 'in_progress', 'completed'])
    })
  ).default([]),
  notes: yup.string()
});

const validateConnection = async (req, res, next) => {
  try {
    await connectionSchema.validate(req.body);
    next();
  } catch (error) {
    res.status(400).json({
      message: 'Validation failed',
      errors: error.errors
    });
  }
};

const validateProgress = async (req, res, next) => {
  try {
    await progressSchema.validate(req.body);
    next();
  } catch (error) {
    res.status(400).json({
      message: 'Validation failed',
      errors: error.errors
    });
  }
  
  };

  const validateSession = (req, res, next) => {
    const { connection_id, date, duration, topic } = req.body;
  
    if (!connection_id || !date || !duration || !topic) {
      return res.status(400).json({
        error: 'Missing required fields: connection_id, date, duration, and topic are required'
      });
    }
  
    // Validate date is in future
    if (new Date(date) <= new Date()) {
      return res.status(400).json({
        error: 'Session date must be in the future'
      });
    }
  
    // Validate duration (e.g., between 30 and 180 minutes)
    if (duration < 30 || duration > 180) {
      return res.status(400).json({
        error: 'Session duration must be between 30 and 180 minutes'
      });
    }
  
    next();
  };    
  const validateApplication = (req, res, next) => {
    const { mentor_id, message } = req.body;
  
    if (!mentor_id || !message) {
      return res.status(400).json({
        error: 'Missing required fields: mentor_id and message are required'
      });
    }
  
    if (message.length < 10 || message.length > 500) {
      return res.status(400).json({
        error: 'Message must be between 10 and 500 characters'
      });
    }
  
    next();
  };



module.exports = {
  validateRegistration,
  validateLogin,
  validateProfile,
  validateUserUpdate,
  validateConnection,
  validateMatchingPreferences,
  validateProgress,
  validateSession,
  validateApplication
};
