const mongoose = require('mongoose');

const matchScoreSchema = new mongoose.Schema({
  // References
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
    index: true
  },
  
  // Core Match Metrics
  overallScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Detailed Breakdown
  skillMatch: {
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    matchedSkills: [{
      name: String,
      relevance: Number,
      required: Boolean
    }],
    missingSkills: [{
      name: String,
      importance: Number
    }]
  },
  
  experienceMatch: {
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    yearsRequired: Number,
    yearsMatched: Number,
    levelMatch: {
      type: String,
      enum: ['junior', 'mid', 'senior', 'lead', 'executive']
    }
  },
  
  educationMatch: {
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    requiredDegree: String,
    hasRequiredDegree: Boolean,
    degreeMatch: String
  },
  
  // Additional Matching Factors
  locationMatch: {
    score: Number,
    isRemote: Boolean,
    isRelocation: Boolean,
    distance: Number, // in kilometers
    locationType: {
      type: String,
      enum: ['onsite', 'hybrid', 'remote']
    }
  },
  
  salaryMatch: {
    score: Number,
    expectedMin: Number,
    expectedMax: Number,
    offeredMin: Number,
    offeredMax: Number,
    currency: String
  },
  
  // AI/ML Features
  featureVector: [Number], // For ML model features
  modelVersion: String,    // Version of the matching algorithm
  
  // Status and Metadata
  lastCalculated: {
    type: Date,
    default: Date.now
  },
  
  // User Interaction
  userFeedback: {
    isRelevant: Boolean,
    feedbackScore: {
      type: Number,
      min: 1,
      max: 5
    },
    feedbackComment: String,
    feedbackDate: Date
  },
  
  // System Fields
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for faster lookups
matchScoreSchema.index({ userId: 1, jobId: 1 }, { unique: true });
matchScoreSchema.index({ overallScore: -1 });
matchScoreSchema.index({ 'skillMatch.score': -1 });
matchScoreSchema.index({ 'experienceMatch.score': -1 });

// Virtual for job details
matchScoreSchema.virtual('job', {
  ref: 'Job',
  localField: 'jobId',
  foreignField: '_id',
  justOne: true
});

// Virtual for user details
matchScoreSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Pre-save hook to update timestamps
matchScoreSchema.pre('save', function(next) {
  this.lastCalculated = new Date();
  next();
});

// Method to get match explanation
matchScoreSchema.methods.getExplanation = function() {
  const explanations = [];
  
  // Skill match explanation
  if (this.skillMatch) {
    const matchedCount = this.skillMatch.matchedSkills?.length || 0;
    const missingCount = this.skillMatch.missingSkills?.length || 0;
    
    if (matchedCount > 0) {
      explanations.push(`✓ Matched ${matchedCount} required skill${matchedCount > 1 ? 's' : ''}`);
    }
    
    if (missingCount > 0) {
      const topMissing = this.skillMatch.missingSkills
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 3)
        .map(skill => skill.name);
      
      explanations.push(`⚠ Missing ${missingCount} skill${missingCount > 1 ? 's' : ''} including: ${topMissing.join(', ')}`);
    }
  }
  
  // Experience explanation
  if (this.experienceMatch) {
    const { yearsRequired, yearsMatched, levelMatch } = this.experienceMatch;
    
    if (yearsMatched >= yearsRequired) {
      explanations.push(`✓ ${yearsMatched} years of experience (${yearsRequired} required)`);
    } else {
      explanations.push(`⚠ ${yearsMatched} years of experience (${yearsRequired} required)`);
    }
    
    if (levelMatch) {
      explanations.push(`✓ ${levelMatch.charAt(0).toUpperCase() + levelMatch.slice(1)} level position`);
    }
  }
  
  // Location explanation
  if (this.locationMatch) {
    const { isRemote, distance, locationType } = this.locationMatch;
    
    if (isRemote) {
      explanations.push('✓ Remote work available');
    } else if (locationType === 'hybrid') {
      explanations.push('✓ Hybrid work arrangement');
    } else if (distance !== undefined) {
      explanations.push(`✓ ${Math.round(distance)} km from your location`);
    }
  }
  
  // Salary explanation
  if (this.salaryMatch && this.salaryMatch.score > 70) {
    const { expectedMin, expectedMax, offeredMin, offeredMax, currency } = this.salaryMatch;
    
    if (offeredMin >= expectedMin) {
      explanations.push(`✓ Salary meets your expectations (${currency} ${offeredMin.toLocaleString()}-${offeredMax.toLocaleString()})`);
    } else {
      explanations.push(`⚠ Salary below expectations (${currency} ${offeredMin.toLocaleString()}-${offeredMax.toLocaleString()})`);
    }
  }
  
  return explanations;
};

// Static method to get top matches for a user
matchScoreSchema.statics.getTopMatchesForUser = async function(userId, limit = 10, filters = {}) {
  const pipeline = [
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    { $sort: { overallScore: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'jobs',
        localField: 'jobId',
        foreignField: '_id',
        as: 'job'
      }
    },
    { $unwind: '$job' },
    {
      $project: {
        _id: 1,
        overallScore: 1,
        skillMatch: 1,
        experienceMatch: 1,
        locationMatch: 1,
        salaryMatch: 1,
        'job.title': 1,
        'job.company': 1,
        'job.location': 1,
        'job.salary': 1,
        'job.jobType': 1,
        'job.remote': 1
      }
    }
  ];
  
  // Apply additional filters if provided
  if (filters.minScore) {
    pipeline.unshift({ $match: { overallScore: { $gte: parseFloat(filters.minScore) } } });
  }
  
  if (filters.location) {
    pipeline.splice(1, 0, {
      $match: {
        $or: [
          { 'job.location.city': new RegExp(filters.location, 'i') },
          { 'job.location.country': new RegExp(filters.location, 'i') },
          { 'job.remote': true }
        ]
      }
    });
  }
  
  if (filters.jobType) {
    pipeline.splice(1, 0, {
      $match: { 'job.jobType': filters.jobType }
    });
  }
  
  return this.aggregate(pipeline);
};

module.exports = mongoose.model('MatchScore', matchScoreSchema);
