const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  // Basic Job Information
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [200, 'Job title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    minlength: [50, 'Job description must be at least 50 characters long']
  },
  summary: {
    type: String,
    maxlength: [500, 'Job summary cannot exceed 500 characters']
  },
  
  // Company Information
  company: {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [200, 'Company name cannot exceed 200 characters']
    },
    logo: {
      type: String,
      trim: true
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
  
  // Location and Type
  location: {
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true
    },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  workType: {
    type: String,
    enum: ['remote', 'hybrid', 'onsite'],
    required: [true, 'Work type is required'],
    default: 'onsite'
  },
  
  // Salary and Benefits
  salary: {
    min: {
      type: Number,
      required: [true, 'Minimum salary is required'],
      min: [0, 'Minimum salary cannot be negative']
    },
    max: {
      type: Number,
      required: [true, 'Maximum salary is required'],
      min: [0, 'Maximum salary cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR']
    },
    period: {
      type: String,
      enum: ['hourly', 'monthly', 'yearly'],
      default: 'yearly'
    }
  },
  benefits: [{
    type: String,
    trim: true
  }],
  
  // Requirements and Skills
  requirements: {
    experience: {
      min: {
        type: Number,
        min: [0, 'Minimum experience cannot be negative'],
        max: [50, 'Minimum experience cannot exceed 50 years']
      },
      max: {
        type: Number,
        min: [0, 'Maximum experience cannot be negative'],
        max: [50, 'Maximum experience cannot exceed 50 years']
      }
    },
    education: {
      type: String,
      enum: ['high-school', 'associate', 'bachelor', 'master', 'phd', 'none'],
      default: 'bachelor'
    },
    skills: [{
      type: String,
      required: true,
      trim: true,
      lowercase: true
    }],
    certifications: [{
      type: String,
      trim: true
    }]
  },
  
  // Job Details
  jobType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship', 'freelance'],
    required: [true, 'Job type is required'],
    default: 'full-time'
  },
  level: {
    type: String,
    enum: ['entry', 'mid', 'senior', 'lead', 'executive'],
    required: [true, 'Job level is required'],
    default: 'mid'
  },
  
  // Application and Status
  status: {
    type: String,
    enum: ['active', 'paused', 'closed', 'draft'],
    default: 'active'
  },
  applicationDeadline: {
    type: Date,
    required: [true, 'Application deadline is required']
  },
  maxApplications: {
    type: Number,
    min: [1, 'Maximum applications must be at least 1'],
    default: 100
  },
  
  // Additional Information
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  keywords: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Contact Information
  contact: {
    email: {
      type: String,
      required: [true, 'Contact email is required'],
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
      type: String,
      trim: true
    }
  },
  
  // Created by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Job creator is required']
  },
  
  // Statistics
  stats: {
    views: {
      type: Number,
      default: 0
    },
    applications: {
      type: Number,
      default: 0
    },
    saves: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full location
jobSchema.virtual('locationString').get(function() {
  return [this.location.city, this.location.state, this.location.country]
    .filter(Boolean)
    .join(', ');
});

// Virtual for salary range
jobSchema.virtual('salaryRange').get(function() {
  if (this.salary.min === this.salary.max) {
    return `${this.salary.currency} ${this.salary.min.toLocaleString()}`;
  }
  return `${this.salary.currency} ${this.salary.min.toLocaleString()} - ${this.salary.max.toLocaleString()}`;
});

// Virtual for days until deadline
jobSchema.virtual('daysUntilDeadline').get(function() {
  const now = new Date();
  const deadline = new Date(this.applicationDeadline);
  const diffTime = deadline - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for is urgent (less than 7 days)
jobSchema.virtual('isUrgent').get(function() {
  return this.daysUntilDeadline <= 7 && this.daysUntilDeadline > 0;
});

// Index for search functionality
jobSchema.index({
  title: 'text',
  description: 'text',
  summary: 'text',
  'company.name': 'text',
  'company.industry': 'text',
  'location.city': 'text',
  'location.state': 'text',
  'location.country': 'text',
  'requirements.skills': 'text',
  tags: 'text',
  keywords: 'text'
});

// Compound index for filtering
jobSchema.index({ 
  status: 1, 
  'location.country': 1, 
  'location.city': 1,
  workType: 1,
  jobType: 1,
  level: 1,
  'salary.min': 1,
  'salary.max': 1,
  createdAt: -1
});

// Pre-save middleware to validate salary range
jobSchema.pre('save', function(next) {
  if (this.salary.min > this.salary.max) {
    return next(new Error('Minimum salary cannot be greater than maximum salary'));
  }
  if (this.requirements.experience.min > this.requirements.experience.max) {
    return next(new Error('Minimum experience cannot be greater than maximum experience'));
  }
  next();
});

// Static method to find active jobs
jobSchema.statics.findActive = function() {
  return this.find({ 
    status: 'active',
    applicationDeadline: { $gt: new Date() }
  });
};

// Static method to find jobs by location
jobSchema.statics.findByLocation = function(city, state, country) {
  const query = {};
  if (city) query['location.city'] = new RegExp(city, 'i');
  if (state) query['location.state'] = new RegExp(state, 'i');
  if (country) query['location.country'] = new RegExp(country, 'i');
  
  return this.find(query);
};

// Static method to find jobs by salary range
jobSchema.statics.findBySalaryRange = function(minSalary, maxSalary) {
  return this.find({
    'salary.min': { $gte: minSalary },
    'salary.max': { $lte: maxSalary }
  });
};

// Method to increment views
jobSchema.methods.incrementViews = function() {
  this.stats.views += 1;
  return this.save();
};

// Method to increment applications
jobSchema.methods.incrementApplications = function() {
  this.stats.applications += 1;
  return this.save();
};

// Method to check if job is still accepting applications
jobSchema.methods.isAcceptingApplications = function() {
  return this.status === 'active' && 
         new Date() < this.applicationDeadline &&
         this.stats.applications < this.maxApplications;
};

module.exports = mongoose.model('Job', jobSchema); 