const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  // Job and Applicant Information
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: [true, 'Job reference is required']
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Applicant reference is required']
  },
  
  // Application Status
  status: {
    type: String,
    enum: ['applied', 'pending', 'reviewing', 'interviewing', 'shortlisted', 'offered', 'hired', 'rejected', 'withdrawn'],
    default: 'applied'
  },
  
  // Pending flag - true when recruiter has taken action
  pending: {
    type: Boolean,
    default: false
  },
  
  // History of status changes and actions
  history: [{
    action: {
      type: String,
      required: true
    },
    status: {
      type: String
    },
    description: {
      type: String,
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    }
  }],
  
  // Application Details
  coverLetter: {
    type: String,
    trim: true,
    maxlength: [2000, 'Cover letter cannot exceed 2000 characters']
  },
  
  // Additional Applicant Information
  applicantInfo: {
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
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      maxlength: [20, 'Phone number cannot exceed 20 characters']
    },
    qualifications: {
      degree: {
        type: String,
        required: [true, 'Degree is required'],
        trim: true,
        maxlength: [50, 'Degree cannot exceed 50 characters']
      },
      major: {
        type: String,
        required: [true, 'Major is required'],
        trim: true,
        maxlength: [100, 'Major cannot exceed 100 characters']
      },
      college: {
        type: String,
        required: [true, 'College/University is required'],
        trim: true,
        maxlength: [100, 'College/University cannot exceed 100 characters']
      },
      cgpa: {
        type: Number,
        min: [0, 'CGPA cannot be negative'],
        max: [4, 'CGPA cannot exceed 4']
      },
      graduationYear: {
        type: Number,
        required: [true, 'Graduation year is required'],
        min: [1990, 'Graduation year must be 1990 or later'],
        max: [2030, 'Graduation year must be 2030 or earlier']
      }
    },
    experience: {
      type: String,
      trim: true,
      maxlength: [2000, 'Experience details cannot exceed 2000 characters']
    },
    skills: {
      type: String,
      required: [true, 'Skills are required'],
      trim: true,
      maxlength: [500, 'Skills cannot exceed 500 characters']
    }
  },
  
  resume: {
    filename: {
      type: String,
      required: [true, 'Resume filename is required']
    },
    path: {
      type: String,
      required: [true, 'Resume path is required']
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  
  // Additional Documents
  additionalDocuments: [{
    filename: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    description: {
      type: String,
      trim: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Application Questions (if any)
  questions: [{
    question: {
      type: String,
      required: true
    },
    answer: {
      type: String,
      required: true,
      trim: true
    }
  }],
  
  // Skills Assessment
  skillsMatch: {
    matchedSkills: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    missingSkills: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    matchPercentage: {
      type: Number,
      min: [0, 'Match percentage cannot be negative'],
      max: [100, 'Match percentage cannot exceed 100'],
      default: 0
    }
  },
  
  // AI/ML Analysis Results
  aiAnalysis: {
    skillsExtracted: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    experienceLevel: {
      type: String,
      enum: ['entry', 'mid', 'senior', 'lead', 'executive']
    },
    recommendedSalary: {
      min: Number,
      max: Number,
      currency: {
        type: String,
        default: 'USD'
      }
    },
    confidence: {
      type: Number,
      min: [0, 'Confidence cannot be negative'],
      max: [1, 'Confidence cannot exceed 1'],
      default: 0
    }
  },
  
  // Communication History
  communications: [{
    type: {
      type: String,
      enum: ['email', 'phone', 'interview', 'note'],
      required: true
    },
    subject: {
      type: String,
      trim: true
    },
    message: {
      type: String,
      required: true
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    isRead: {
      type: Boolean,
      default: false
    }
  }],
  
  // Interview Information
  interviews: [{
    type: {
      type: String,
      enum: ['phone', 'video', 'onsite', 'technical', 'behavioral'],
      required: true
    },
    scheduledAt: {
      type: Date,
      required: true
    },
    duration: {
      type: Number, // in minutes
      required: true
    },
    location: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
      default: 'scheduled'
    },
    feedback: {
      type: String,
      trim: true
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    }
  }],
  
  // Notes and Comments
  notes: [{
    content: {
      type: String,
      required: true,
      trim: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    isPrivate: {
      type: Boolean,
      default: false
    }
  }],
  
  // Timeline (kept for backward compatibility, but history is preferred)
  timeline: [{
    action: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Recruiter contact information (for interview emails)
  recruiterContact: {
    name: String,
    email: String,
    phone: String
  },
  
  // Flags and Preferences
  flags: {
    isUrgent: {
      type: Boolean,
      default: false
    },
    isFavorite: {
      type: Boolean,
      default: false
    },
    isRejected: {
      type: Boolean,
      default: false
    }
  },
  
  // Metadata
  appliedAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for application age
applicationSchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const applied = new Date(this.appliedAt);
  const diffTime = now - applied;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for is recent (less than 7 days)
applicationSchema.virtual('isRecent').get(function() {
  return this.ageInDays <= 7;
});

// Virtual for status color (for UI)
applicationSchema.virtual('statusColor').get(function() {
  const statusColors = {
    pending: 'yellow',
    reviewing: 'blue',
    shortlisted: 'green',
    interviewed: 'purple',
    offered: 'green',
    hired: 'green',
    rejected: 'red',
    withdrawn: 'gray'
  };
  return statusColors[this.status] || 'gray';
});

// Index for efficient queries
applicationSchema.index({ 
  job: 1, 
  applicant: 1 
}, { unique: true });

applicationSchema.index({ 
  status: 1, 
  appliedAt: -1 
});

applicationSchema.index({ 
  applicant: 1, 
  appliedAt: -1 
});

applicationSchema.index({ 
  job: 1, 
  status: 1 
});

// Pre-save middleware to update lastUpdated
applicationSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Static method to find applications by job
applicationSchema.statics.findByJob = function(jobId) {
  return this.find({ job: jobId })
    .populate('applicant', 'firstName lastName email phone location')
    .populate('job', 'title company.name location');
};

// Static method to find applications by applicant
applicationSchema.statics.findByApplicant = function(applicantId) {
  return this.find({ applicant: applicantId })
    .populate({
      path: 'job',
      select: 'title company location workType jobType salary requirements summary description status createdAt',
      populate: {
        path: 'company',
        select: 'name'
      }
    })
    .sort({ appliedAt: -1, createdAt: -1 });
};

// Static method to find applications by status
applicationSchema.statics.findByStatus = function(status) {
  return this.find({ status })
    .populate('applicant', 'firstName lastName email')
    .populate('job', 'title company.name');
};

// Method to update status
applicationSchema.methods.updateStatus = function(newStatus, userId) {
  this.status = newStatus;
  this.timeline.push({
    action: 'status_update',
    description: `Status changed to ${newStatus}`,
    user: userId
  });
  return this.save();
};

// Method to add communication
applicationSchema.methods.addCommunication = function(communication) {
  this.communications.push(communication);
  this.timeline.push({
    action: 'communication',
    description: `New ${communication.type} communication`,
    user: communication.from
  });
  return this.save();
};

// Method to add note
applicationSchema.methods.addNote = function(note) {
  this.notes.push(note);
  this.timeline.push({
    action: 'note',
    description: 'Note added',
    user: note.author
  });
  return this.save();
};

// Method to schedule interview
applicationSchema.methods.scheduleInterview = function(interview) {
  this.interviews.push(interview);
  this.timeline.push({
    action: 'interview_scheduled',
    description: `${interview.type} interview scheduled`,
    user: interview.scheduledBy
  });
  return this.save();
};

// Method to check if application is active
applicationSchema.methods.isActive = function() {
  return !['rejected', 'withdrawn', 'hired'].includes(this.status);
};

module.exports = mongoose.model('Application', applicationSchema); 