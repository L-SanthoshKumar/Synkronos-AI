const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  
  // Role and Status
  role: {
    type: String,
    enum: ['jobseeker', 'recruiter'],
    default: 'jobseeker',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Profile Information
  phone: {
    type: String,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  location: {
    city: {
      type: String,
      trim: true,
      maxlength: [100, 'City name cannot exceed 100 characters']
    },
    state: {
      type: String,
      trim: true,
      maxlength: [100, 'State name cannot exceed 100 characters']
    },
    country: {
      type: String,
      trim: true,
      maxlength: [100, 'Country name cannot exceed 100 characters']
    }
  },
  
  // Skills and Experience (for job seekers)
  skills: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  experience: {
    years: {
      type: Number,
      min: [0, 'Experience years cannot be negative'],
      max: [50, 'Experience years cannot exceed 50']
    },
    level: {
      type: String,
      enum: ['entry', 'mid', 'senior', 'lead', 'executive'],
      default: 'entry'
    }
  },
  
  // Education
  education: [{
    degree: {
      type: String,
      required: true,
      trim: true
    },
    institution: {
      type: String,
      required: true,
      trim: true
    },
    field: {
      type: String,
      required: true,
      trim: true
    },
    graduationYear: {
      type: Number,
      required: true,
      min: [1950, 'Graduation year must be after 1950'],
      max: [new Date().getFullYear() + 5, 'Graduation year cannot be more than 5 years in the future']
    }
  }],
  
  // Company Information (for recruiters)
  company: {
    name: {
      type: String,
      trim: true,
      maxlength: [200, 'Company name cannot exceed 200 characters']
    },
    website: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'Please enter a valid website URL']
    },
    industry: {
      type: String,
      trim: true
    },
    size: {
      type: String,
      enum: ['startup', 'small', 'medium', 'large', 'enterprise']
    }
  },
  
  // Resume and Profile
  resume: {
    filename: String,
    path: String,
    uploadedAt: Date
  },
  
  // Social Links
  socialLinks: {
    linkedin: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?linkedin\.com\/in\/.+/, 'Please enter a valid LinkedIn URL']
    },
    github: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?github\.com\/.+/, 'Please enter a valid GitHub URL']
    },
    portfolio: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'Please enter a valid portfolio URL']
    }
  },
  
  // Preferences
  preferences: {
    jobAlerts: {
      type: Boolean,
      default: true
    },
    emailNotifications: {
      type: Boolean,
      default: true
    },
    salaryRange: {
      min: {
        type: Number,
        min: [0, 'Minimum salary cannot be negative']
      },
      max: {
        type: Number,
        min: [0, 'Maximum salary cannot be negative']
      }
    },
    remotePreference: {
      type: String,
      enum: ['remote', 'hybrid', 'onsite'],
      default: 'hybrid'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for location string
userSchema.virtual('locationString').get(function() {
  if (!this.location.city && !this.location.state && !this.location.country) {
    return null;
  }
  return [this.location.city, this.location.state, this.location.country]
    .filter(Boolean)
    .join(', ');
});

// Index for search functionality
userSchema.index({ 
  firstName: 'text', 
  lastName: 'text', 
  email: 'text',
  'location.city': 'text',
  'location.state': 'text',
  'location.country': 'text',
  skills: 'text'
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Method to get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

// Method to update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

module.exports = mongoose.model('User', userSchema); 