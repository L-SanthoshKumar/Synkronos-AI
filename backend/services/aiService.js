const natural = require('natural');
const { WordTokenizer, PorterStemmer } = natural;
const tf = require('@tensorflow/tfjs-node');
const use = require('@tensorflow-models/universal-sentence-encoder');
const { Parser } = require('@json2csv/plainjs');
const pdfParse = require('pdf-parse');
const docx = require('docx-parser');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

// Initialize tokenizer and stemmer
const tokenizer = new WordTokenizer();

// Skill dictionary (can be extended or loaded from a database)
const SKILLS_DICTIONARY = [
  // Programming Languages
  'javascript', 'python', 'java', 'c#', 'c++', 'php', 'ruby', 'go', 'swift', 'kotlin',
  'typescript', 'rust', 'scala', 'r', 'dart', 'perl', 'haskell', 'elixir', 'clojure',
  'erlang', 'ocaml', 'f#', 'lua', 'matlab', 'groovy', 'julia', 'cobol', 'fortran',
  'assembly', 'bash', 'powershell', 'sql', 'pl/sql', 't-sql', 'nosql', 'graphql',
  
  // Web Development
  'html', 'css', 'sass', 'less', 'bootstrap', 'tailwind', 'material ui', 'chakra ui',
  'react', 'angular', 'vue', 'svelte', 'next.js', 'nuxt.js', 'gatsby', 'remix',
  'node.js', 'express', 'nestjs', 'fastify', 'koa', 'hapi', 'sails.js', 'meteor',
  'django', 'flask', 'fastapi', 'ruby on rails', 'laravel', 'symfony', 'spring',
  'asp.net', 'asp.net core', 'play framework', 'phoenix', 'gin', 'echo', 'fiber',
  
  // Mobile Development
  'react native', 'flutter', 'ionic', 'xamarin', 'swiftui', 'jetpack compose',
  'android sdk', 'ios sdk', 'objective-c', 'xcode', 'android studio',
  
  // Database
  'mongodb', 'mysql', 'postgresql', 'sqlite', 'microsoft sql server', 'oracle',
  'redis', 'cassandra', 'couchbase', 'dynamodb', 'firebase', 'firestore',
  'elasticsearch', 'solr', 'splunk', 'neo4j', 'arango db', 'couchdb', 'realm',
  
  // DevOps & Cloud
  'docker', 'kubernetes', 'terraform', 'ansible', 'puppet', 'chef', 'jenkins',
  'github actions', 'gitlab ci', 'circleci', 'travis ci', 'argo cd', 'flux',
  'aws', 'amazon web services', 'azure', 'google cloud', 'gcp', 'ibm cloud',
  'oracle cloud', 'digitalocean', 'heroku', 'vercel', 'netlify', 'cloudflare',
  
  // AI/ML
  'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'opencv', 'nltk', 'spacy',
  'hugging face', 'transformers', 'langchain', 'llama', 'gpt', 'bert', 'gpt-3',
  'gpt-4', 'dall-e', 'stable diffusion', 'midjourney', 'computer vision',
  'natural language processing', 'nlp', 'neural networks', 'deep learning',
  'reinforcement learning', 'supervised learning', 'unsupervised learning',
  
  // Other Technologies
  'git', 'github', 'gitlab', 'bitbucket', 'jira', 'confluence', 'trello', 'asana',
  'slack', 'microsoft teams', 'zoom', 'agile', 'scrum', 'kanban', 'devops',
  'ci/cd', 'tdd', 'bdd', 'rest', 'graphql', 'grpc', 'soap', 'oauth', 'jwt',
  'oauth2', 'openid connect', 'saml', 'ldap', 'oauth2.0', 'jwt tokens',
  'microservices', 'serverless', 'lambda', 'api gateway', 'apache kafka',
  'rabbitmq', 'apache spark', 'hadoop', 'hive', 'hbase', 'apache flink',
  'apache beam', 'apache airflow', 'apache nifi', 'apache camel', 'apache camel',
  'apache camel', 'apache camel', 'apache camel', 'apache camel', 'apache camel'
];

// Initialize Universal Sentence Encoder (cached)
let useModel = null;

/**
 * Initialize the AI models
 */
async function initializeModels() {
  if (!useModel) {
    console.log('Loading Universal Sentence Encoder model...');
    useModel = await use.load();
    console.log('Universal Sentence Encoder model loaded');
  }
}

/**
 * Parse a resume file (PDF or DOCX) and extract structured data
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} fileType - The file type (pdf or docx)
 * @returns {Promise<Object>} Parsed resume data
 */
async function parseResume(fileBuffer, fileType) {
  let text = '';
  
  try {
    // Extract text from file based on type
    if (fileType === 'application/pdf') {
      const pdfData = await pdfParse(fileBuffer);
      text = pdfData.text;
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      text = await new Promise((resolve, reject) => {
        docx.parse(fileBuffer, (err, data) => {
          if (err) reject(err);
          else resolve(data);
        });
      });
    } else {
      throw new Error('Unsupported file type');
    }
    
    // Initialize models if not already loaded
    await initializeModels();
    
    // Tokenize and clean text
    const tokens = tokenizer.tokenize(text.toLowerCase()) || [];
    const cleanedText = tokens.join(' ');
    
    // Extract sections using regex patterns
    const sections = extractSections(cleanedText);
    
    // Extract skills using dictionary matching and NLP
    const skills = extractSkills(cleanedText);
    
    // Extract experience
    const experience = extractExperience(sections.experience || '');
    
    // Extract education
    const education = extractEducation(sections.education || '');
    
    // Extract contact information
    const contactInfo = extractContactInfo(cleanedText);
    
    // Generate embeddings for semantic search
    const embeddings = await generateEmbeddings(cleanedText);
    
    return {
      ...contactInfo,
      skills,
      experience,
      education,
      rawText: cleanedText,
      embeddings,
      metadata: {
        source: 'ai-parser',
        parsedAt: new Date(),
        confidence: calculateConfidence(skills, experience, education)
      }
    };
    
  } catch (error) {
    console.error('Error parsing resume:', error);
    throw new Error(`Failed to parse resume: ${error.message}`);
  }
}

/**
 * Extract sections from resume text using regex patterns
 * @param {string} text - The resume text
 * @returns {Object} Extracted sections
 */
function extractSections(text) {
  const sections = {};
  const sectionPatterns = {
    experience: /(experience|work\s+history|employment\s+history|professional\s+experience)[\s\S]*?(?=(education|skills|projects|$))/i,
    education: /(education|academic\s+background|qualifications)[\s\S]*?(?=(experience|skills|projects|$))/i,
    skills: /(skills?|technical\s+skills?|technologies)[\s\S]*?(?=(experience|education|projects|$))/i,
    projects: /(projects?|portfolio|personal\s+projects?)[\s\S]*?(?=(experience|education|skills|$))/i
  };
  
  for (const [section, pattern] of Object.entries(sectionPatterns)) {
    const match = text.match(pattern);
    if (match) {
      sections[section] = match[0].trim();
    }
  }
  
  return sections;
}

/**
 * Extract skills from text using dictionary matching and NLP
 * @param {string} text - The text to extract skills from
 * @returns {Array} Extracted skills
 */
function extractSkills(text) {
  const tokens = tokenizer.tokenize(text.toLowerCase()) || [];
  const stemmedTokens = tokens.map(token => PorterStemmer.stem(token));
  
  // Find exact matches
  const exactMatches = SKILLS_DICTIONARY.filter(skill => {
    const skillTokens = skill.toLowerCase().split(/[^\w]/);
    return skillTokens.every(token => tokens.includes(token));
  });
  
  // Find fuzzy matches using Levenshtein distance
  const fuzzyMatches = [];
  const threshold = 0.8; // Similarity threshold
  
  for (const skill of SKILLS_DICTIONARY) {
    const skillTokens = skill.toLowerCase().split(/[^\w]/);
    
    for (let i = 0; i <= tokens.length - skillTokens.length; i++) {
      const window = tokens.slice(i, i + skillTokens.length).join(' ');
      const distance = natural.LevenshteinDistance(
        skill.toLowerCase(),
        window,
        { normalized: true }
      );
      
      if (distance >= threshold && !fuzzyMatches.includes(skill)) {
        fuzzyMatches.push(skill);
      }
    }
  }
  
  // Combine and deduplicate matches
  const allSkills = [...new Set([...exactMatches, ...fuzzyMatches])];
  
  return allSkills.map(skill => ({
    name: skill,
    category: getSkillCategory(skill),
    confidence: exactMatches.includes(skill) ? 1.0 : 0.8
  }));
}

/**
 * Categorize a skill based on keywords
 * @param {string} skill - The skill name
 * @returns {string} The skill category
 */
function getSkillCategory(skill) {
  const lowerSkill = skill.toLowerCase();
  
  if (lowerSkill.includes('javascript') || 
      lowerSkill.includes('typescript') ||
      lowerSkill.includes('react') || 
      lowerSkill.includes('angular') ||
      lowerSkill.includes('vue') ||
      lowerSkill.includes('node')) {
    return 'frontend';
  }
  
  if (lowerSkill.includes('python') || 
      lowerSkill.includes('java') || 
      lowerSkill.includes('c#') || 
      lowerSkill.includes('go') ||
      lowerSkill.includes('ruby') ||
      lowerSkill.includes('php')) {
    return 'backend';
  }
  
  if (lowerSkill.includes('sql') || 
      lowerSkill.includes('mysql') || 
      lowerSkill.includes('postgres') || 
      lowerSkill.includes('mongodb') ||
      lowerSkill.includes('redis')) {
    return 'database';
  }
  
  if (lowerSkill.includes('docker') || 
      lowerSkill.includes('kubernetes') || 
      lowerSkill.includes('aws') || 
      lowerSkill.includes('azure') ||
      lowerSkill.includes('gcp')) {
    return 'devops';
  }
  
  if (lowerSkill.includes('machine learning') || 
      lowerSkill.includes('deep learning') || 
      lowerSkill.includes('tensorflow') || 
      lowerSkill.includes('pytorch') ||
      lowerSkill.includes('nlp')) {
    return 'ai_ml';
  }
  
  return 'other';
}

/**
 * Extract work experience from text
 * @param {string} text - The experience section text
 * @returns {Array} Extracted work experience
 */
function extractExperience(text) {
  // This is a simplified version - in production, you'd want a more robust parser
  const experience = [];
  const dateRegex = /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}/gi;
  const lines = text.split('\n');
  
  let currentExp = null;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    // Check for job title and company pattern
    const titleMatch = trimmedLine.match(/^([^\n]+?)\s*[\-\u2013]\s*([^\n]+)$/i);
    const dateMatch = trimmedLine.match(dateRegex);
    
    if (titleMatch) {
      if (currentExp) experience.push(currentExp);
      currentExp = {
        title: titleMatch[1].trim(),
        company: titleMatch[2].trim(),
        startDate: null,
        endDate: null,
        isCurrent: false,
        description: []
      };
    } else if (dateMatch && currentExp) {
      const dates = dateMatch[0].split(/\s+-\s+|\s+to\s+|\s*-\s*/);
      currentExp.startDate = dates[0] ? parseDate(dates[0].trim()) : null;
      
      if (dates[1]) {
        currentExp.endDate = dates[1].toLowerCase().includes('present') ? 
          null : parseDate(dates[1].trim());
        currentExp.isCurrent = dates[1].toLowerCase().includes('present');
      }
    } else if (currentExp) {
      currentExp.description.push(trimmedLine);
    }
  }
  
  if (currentExp) {
    experience.push(currentExp);
  }
  
  return experience;
}

/**
 * Extract education information from text
 * @param {string} text - The education section text
 * @returns {Array} Extracted education entries
 */
function extractEducation(text) {
  const education = [];
  const lines = text.split('\n');
  
  let currentEdu = null;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    // Look for degree and institution pattern
    const degreeMatch = trimmedLine.match(/^([^,]+),\s*([^,]+)(?:,\s*(.+))?$/i);
    
    if (degreeMatch) {
      if (currentEdu) education.push(currentEdu);
      
      currentEdu = {
        degree: degreeMatch[1].trim(),
        fieldOfStudy: degreeMatch[2].trim(),
        institution: degreeMatch[3] ? degreeMatch[3].trim() : '',
        startYear: null,
        endYear: null,
        isCurrent: false
      };
    } else if (currentEdu) {
      // Look for years in the line
      const yearMatch = trimmedLine.match(/(\d{4})\s*(?:-|to)\s*(\d{4}|Present|present)/i);
      if (yearMatch) {
        currentEdu.startYear = parseInt(yearMatch[1], 10);
        if (yearMatch[2].toLowerCase() === 'present') {
          currentEdu.isCurrent = true;
        } else {
          currentEdu.endYear = parseInt(yearMatch[2], 10);
        }
      }
    }
  }
  
  if (currentEdu) {
    education.push(currentEdu);
  }
  
  return education;
}

/**
 * Extract contact information from text
 * @param {string} text - The resume text
 * @returns {Object} Extracted contact information
 */
function extractContactInfo(text) {
  const emailMatch = text.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/(\+\d{1,3}[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/);
  const linkedinMatch = text.match(/linkedin\.com\/in\/[a-zA-Z0-9-]+/);
  const githubMatch = text.match(/github\.com\/[a-zA-Z0-9-]+/);
  
  // Extract name (simplified - in production, use a more robust NLP approach)
  const nameMatch = text.match(/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/m);
  
  return {
    name: nameMatch ? nameMatch[0].trim() : '',
    email: emailMatch ? emailMatch[0] : '',
    phone: phoneMatch ? phoneMatch[0] : '',
    linkedin: linkedinMatch ? `https://${linkedinMatch[0]}` : '',
    github: githubMatch ? `https://${githubMatch[0]}` : ''
  };
}

/**
 * Generate embeddings for text using Universal Sentence Encoder
 * @param {string} text - The text to generate embeddings for
 * @returns {Promise<Array>} The embedding vector
 */
async function generateEmbeddings(text) {
  try {
    await initializeModels();
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const embeddings = await useModel.embed(sentences);
    const meanEmbedding = embeddings.mean(0);
    return Array.from(meanEmbedding.dataSync());
  } catch (error) {
    console.error('Error generating embeddings:', error);
    return [];
  }
}

/**
 * Calculate confidence score for the parsed resume
 * @param {Array} skills - Extracted skills
 * @param {Array} experience - Extracted experience
 * @param {Array} education - Extracted education
 * @returns {number} Confidence score (0-1)
 */
function calculateConfidence(skills, experience, education) {
  let score = 0;
  
  if (skills.length > 0) score += 0.4;
  if (experience.length > 0) score += 0.3;
  if (education.length > 0) score += 0.2;
  
  // Adjust based on the amount of data
  if (skills.length > 5) score += 0.1;
  if (experience.length > 1) score += 0.1;
  
  return Math.min(1, score);
}

/**
 * Calculate match score between a resume and a job description
 * @param {Object} resume - The parsed resume
 * @param {Object} job - The job posting
 * @returns {Promise<Object>} Match score and details
 */
async function calculateMatchScore(resume, job) {
  try {
    // Initialize models if not already loaded
    await initializeModels();
    
    // Extract skills from job description if not already provided
    const jobSkills = job.skills || extractSkills(job.description || '');
    const resumeSkills = resume.skills || [];
    
    // Calculate skill match score
    const skillMatch = calculateSkillMatch(resumeSkills, jobSkills);
    
    // Calculate experience match
    const experienceMatch = calculateExperienceMatch(resume.experience, job.requirements);
    
    // Calculate education match
    const educationMatch = calculateEducationMatch(resume.education, job.requirements);
    
    // Calculate overall score (weighted average)
    const overallScore = Math.round(
      (skillMatch.score * 0.6) + 
      (experienceMatch.score * 0.3) + 
      (educationMatch.score * 0.1)
    );
    
    // Generate explanation
    const explanation = generateExplanation(skillMatch, experienceMatch, educationMatch);
    
    return {
      score: overallScore,
      skillMatch,
      experienceMatch,
      educationMatch,
      explanation
    };
    
  } catch (error) {
    console.error('Error calculating match score:', error);
    throw new Error(`Failed to calculate match score: ${error.message}`);
  }
}

/**
 * Calculate skill match between resume and job
 * @param {Array} resumeSkills - Skills from resume
 * @param {Array} jobSkills - Required skills from job
 * @returns {Object} Skill match details
 */
function calculateSkillMatch(resumeSkills, jobSkills) {
  if (!jobSkills || jobSkills.length === 0) {
    return { score: 100, matched: [], missing: [] };
  }
  
  const resumeSkillNames = resumeSkills.map(s => s.name.toLowerCase());
  const jobSkillNames = jobSkills.map(s => s.toLowerCase());
  
  const matched = [];
  const missing = [];
  
  for (const skill of jobSkillNames) {
    if (resumeSkillNames.some(rs => rs.includes(skill) || skill.includes(rs))) {
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  }
  
  const score = Math.round((matched.length / jobSkillNames.length) * 100);
  
  return {
    score,
    matched,
    missing
  };
}

/**
 * Calculate experience match
 * @param {Array} experience - Work experience from resume
 * @param {string} requirements - Job requirements text
 * @returns {Object} Experience match details
 */
function calculateExperienceMatch(experience, requirements = '') {
  if (!experience || experience.length === 0) {
    return { score: 0, years: 0, level: 'unknown' };
  }
  
  // Calculate total years of experience
  let totalYears = 0;
  for (const exp of experience) {
    const startYear = exp.startDate ? new Date(exp.startDate).getFullYear() : 0;
    const endYear = exp.endDate ? new Date(exp.endDate).getFullYear() : new Date().getFullYear();
    totalYears += Math.max(0, endYear - startYear);
  }
  
  // Extract years of experience requirement from job description
  const yearMatch = (requirements || '').match(/(\d+)\s*\+?\s*(?:years?|yrs?|y\.?e\.?)/i);
  const requiredYears = yearMatch ? parseInt(yearMatch[1], 10) : 0;
  
  // Calculate experience level
  let level = 'mid';
  if (totalYears < 2) level = 'entry';
  else if (totalYears >= 2 && totalYears < 5) level = 'mid';
  else if (totalYears >= 5 && totalYears < 10) level = 'senior';
  else if (totalYears >= 10) level = 'lead';
  
  // Calculate score (0-100)
  let score = 0;
  if (requiredYears === 0) {
    score = 100; // No experience requirement specified
  } else if (totalYears >= requiredYears) {
    score = 100; // Meets or exceeds requirement
  } else {
    // Partial credit for partial match
    score = Math.round((totalYears / requiredYears) * 100);
  }
  
  return {
    score,
    years: totalYears,
    requiredYears,
    level
  };
}

/**
 * Calculate education match
 * @param {Array} education - Education from resume
 * @param {string} requirements - Job requirements text
 * @returns {Object} Education match details
 */
function calculateEducationMatch(education, requirements = '') {
  if (!education || education.length === 0) {
    return { score: 0, hasDegree: false, degree: null };
  }
  
  // Check for degree requirements in job description
  const hasBachelors = education.some(edu => 
    (edu.degree || '').toLowerCase().includes('bachelor') || 
    (edu.degree || '').toLowerCase().includes('b\.?s\.?') ||
    (edu.degree || '').toLowerCase().includes('b\.?a\.?')
  );
  
  const hasMasters = education.some(edu => 
    (edu.degree || '').toLowerCase().includes('master') || 
    (edu.degree || '').toLowerCase().includes('m\.?s\.?') ||
    (edu.degree || '').toLowerCase().includes('m\.?a\.?')
  );
  
  const hasPhd = education.some(edu => 
    (edu.degree || '').toLowerCase().includes('phd') || 
    (edu.degree || '').toLowerCase().includes('ph\.?d') ||
    (edu.degree || '').toLowerCase().includes('doctorate')
  );
  
  // Check requirements
  const requiresBachelors = (requirements || '').toLowerCase().includes('bachelor');
  const requiresMasters = (requirements || '').toLowerCase().includes('master');
  const requiresPhd = (requirements || '').toLowerCase().match(/phd|ph\.?d|doctorate/i);
  
  // Calculate score
  let score = 0;
  let hasRequiredDegree = false;
  let degree = '';
  
  if (requiresPhd && hasPhd) {
    score = 100;
    hasRequiredDegree = true;
    degree = 'phd';
  } else if (requiresMasters && (hasMasters || hasPhd)) {
    score = 90;
    hasRequiredDegree = true;
    degree = hasPhd ? 'phd' : 'masters';
  } else if (requiresBachelors && (hasBachelors || hasMasters || hasPhd)) {
    score = 80;
    hasRequiredDegree = true;
    if (hasPhd) degree = 'phd';
    else if (hasMasters) degree = 'masters';
    else degree = 'bachelors';
  } else if (!requiresBachelors && !requiresMasters && !requiresPhd) {
    // No specific education requirement
    score = 100;
    hasRequiredDegree = true;
  } else if (education.length > 0) {
    // Some education but doesn't meet requirements
    score = 30;
  }
  
  return {
    score,
    hasDegree: hasRequiredDegree,
    degree
  };
}

/**
 * Generate human-readable explanation of the match
 * @param {Object} skillMatch - Skill match details
 * @param {Object} experienceMatch - Experience match details
 * @param {Object} educationMatch - Education match details
 * @returns {string} Explanation text
 */
function generateExplanation(skillMatch, experienceMatch, educationMatch) {
  const explanations = [];
  
  // Skill explanation
  if (skillMatch.score === 100) {
    explanations.push("All required skills are a perfect match!");
  } else if (skillMatch.score >= 80) {
    explanations.push("Strong skill match with most required skills present.");
  } else if (skillMatch.score >= 50) {
    explanations.push("Partial skill match with some gaps in required skills.");
  } else {
    explanations.push("Limited match with required skills.");
  }
  
  // Experience explanation
  if (experienceMatch.requiredYears > 0) {
    if (experienceMatch.years >= experienceMatch.requiredYears) {
      explanations.push(
        `Meets experience requirement (${experienceMatch.years} years vs ${experienceMatch.requiredYears} required).`
      );
    } else {
      explanations.push(
        `Experience is below requirement (${experienceMatch.years} years vs ${experienceMatch.requiredYears} required).`
      );
    }
  }
  
  // Education explanation
  if (educationMatch.hasDegree) {
    explanations.push(`Education requirement met with ${educationMatch.degree} degree.`);
  } else if (educationMatch.score > 0) {
    explanations.push("Partial match on education requirements.");
  } else if (educationMatch.score === 0 && educationMatch.degree) {
    explanations.push("Education does not meet the specified requirements.");
  }
  
  // Add any missing skills to the explanation
  if (skillMatch.missing.length > 0) {
    const missingSkills = skillMatch.missing.slice(0, 3).join(', ');
    const more = skillMatch.missing.length > 3 ? ` and ${skillMatch.missing.length - 3} more` : '';
    explanations.push(`Missing skills: ${missingSkills}${more}.`);
  }
  
  return explanations.join(' ');
}

/**
 * Helper function to parse date strings
 * @param {string} dateStr - Date string to parse
 * @returns {Date} Parsed date
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  // Try different date formats
  const formats = [
    'MMM yyyy', // Jan 2020
    'MMMM yyyy', // January 2020
    'MM/yyyy',   // 01/2020
    'MM-yyyy',   // 01-2020
    'yyyy',      // 2020
    'MM/yy',     // 01/20
    'MM-yy'      // 01-20
  ];
  
  for (const format of formats) {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  return null;
}

module.exports = {
  parseResume,
  calculateMatchScore,
  extractSkills,
  generateEmbeddings
};
