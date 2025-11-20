const mongoose = require('mongoose');

const parsedResumeSchema = new mongoose.Schema({
  // Reference to the user
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Basic Information
  name: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  
  // Extracted Data
  skills: [{
    name: {
      type: String,
      trim: true,
      required: true
    },
    category: {
      type: String,
      enum: ['programming', 'language', 'framework', 'tool', 'soft-skill', 'other'],
      default: 'other'
    },
    yearsOfExperience: {
      type: Number,
      min: 0,
      default: 0
    },
    lastUsed: {
      type: Date
    }
  }],
  
  experience: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    company: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: String,
      trim: true
    },
    startDate: Date,
    endDate: Date,
    isCurrent: {
      type: Boolean,
      default: false
    },
    description: String,
    skills: [{
      type: String,
      trim: true
    }]
  }],
  
  education: [{
    degree: {
      type: String,
      required: true,
      trim: true
    },
    fieldOfStudy: {
      type: String,
      trim: true
    },
    institution: {
      type: String,
      required: true,
      trim: true
    },
    startYear: Number,
    endYear: Number,
    isCurrent: {
      type: Boolean,
      default: false
    },
    description: String
  }],
  
  // Additional Sections
  certifications: [{
    name: String,
    issuer: String,
    dateIssued: Date,
    expirationDate: Date,
    credentialId: String,
    credentialUrl: String
  }],
  
  projects: [{
    name: String,
    description: String,
    startDate: Date,
    endDate: Date,
    isCurrent: Boolean,
    url: String,
    technologies: [String]
  }],
  
  // Raw and Metadata
  rawText: {
    type: String,
    required: true
  },
  
  // Processing Information
  parsingEngine: {
    type: String,
    default: 'ai-parser-v1'
  },
  parsingDate: {
    type: Date,
    default: Date.now
  },
  confidenceScore: {
    type: Number,
    min: 0,
    max: 1
  },
  
  // Versioning
  version: {
    type: Number,
    default: 1
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for faster queries
parsedResumeSchema.index({ userId: 1 });
parsedResumeSchema.index({ 'skills.name': 'text', 'experience.skills': 'text' });

// Virtual for total years of experience
parsedResumeSchema.virtual('totalYearsOfExperience').get(function() {
  if (!this.experience || this.experience.length === 0) return 0;
  
  const experienceInMonths = this.experience.reduce((total, exp) => {
    const start = exp.startDate ? new Date(exp.startDate) : new Date();
    const end = exp.isCurrent || !exp.endDate ? new Date() : new Date(exp.endDate);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    return total + Math.max(0, months); // Ensure positive value
  }, 0);
  
  return Math.round((experienceInMonths / 12) * 10) / 10; // Round to 1 decimal
});

// Method to get all unique skills
parsedResumeSchema.methods.getAllSkills = function() {
  const skills = new Set();
  
  // Add skills from skills section
  if (this.skills && this.skills.length > 0) {
    this.skills.forEach(skill => {
      if (skill.name) skills.add(skill.name.toLowerCase().trim());
    });
  }
  
  // Add skills from experience
  if (this.experience && this.experience.length > 0) {
    this.experience.forEach(exp => {
      if (exp.skills && exp.skills.length > 0) {
        exp.skills.forEach(skill => {
          if (skill) skills.add(skill.toLowerCase().trim());
        });
      }
    });
  }
  
  return Array.from(skills);
};

// Pre-save hook to update timestamps
parsedResumeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('ParsedResume', parsedResumeSchema);
