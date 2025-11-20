import os
import tempfile
import fitz  # PyMuPDF
import spacy
import numpy as np
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import requests
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

BACKEND_API_URL = os.getenv('BACKEND_API_URL', 'http://localhost:5000/api')

app = Flask(__name__)
CORS(app)

# Load spaCy model (en_core_web_sm or en_core_web_md)
nlp = spacy.load('en_core_web_sm')

# Common technical skills dictionary
TECHNICAL_SKILLS = {
    'programming_languages': [
        'python', 'javascript', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift',
        'kotlin', 'scala', 'r', 'matlab', 'perl', 'bash', 'powershell', 'sql', 'html', 'css'
    ],
    'frameworks': [
        'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring', 'laravel',
        'asp.net', 'rails', 'fastapi', 'gin', 'echo', 'gin', 'spring boot', 'dotnet', 'asp.net core'
    ],
    'databases': [
        'mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'oracle', 'sql server', 'dynamodb',
        'cassandra', 'elasticsearch', 'neo4j', 'firebase', 'supabase'
    ],
    'cloud_platforms': [
        'aws', 'azure', 'gcp', 'google cloud', 'amazon web services', 'microsoft azure',
        'heroku', 'digitalocean', 'linode', 'vultr', 'netlify', 'vercel'
    ],
    'tools': [
        'git', 'docker', 'kubernetes', 'jenkins', 'ci/cd', 'terraform', 'ansible', 'chef',
        'puppet', 'jira', 'confluence', 'slack', 'teams', 'zoom', 'figma', 'sketch'
    ],
    'methodologies': [
        'agile', 'scrum', 'kanban', 'waterfall', 'devops', 'lean', 'six sigma', 'tqm'
    ]
}

# Common soft skills
SOFT_SKILLS = [
    'leadership', 'communication', 'teamwork', 'problem solving', 'critical thinking',
    'time management', 'organization', 'adaptability', 'creativity', 'analytical',
    'collaboration', 'mentoring', 'presentation', 'negotiation', 'project management'
]

# Helper: Extract text from PDF using PyMuPDF
def extract_text_from_pdf(file_path):
    text = ""
    try:
        doc = fitz.open(file_path)
        for page in doc:
            text += page.get_text()  # type: ignore
        doc.close()
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return ""
    return text

# Helper: Extract text from other file formats
def extract_text_from_file(file_path, file_type):
    if file_type.lower() in ['pdf']:
        return extract_text_from_pdf(file_path)
    # For other formats, you might want to add more extractors
    return ""

# Helper: Extract skills from text using multiple methods
def extract_skills_from_text(text):
    doc = nlp(text.lower())
    skills = set()
    
    # Method 1: Extract from technical skills dictionary
    text_lower = text.lower()
    for category, skill_list in TECHNICAL_SKILLS.items():
        for skill in skill_list:
            if skill in text_lower:
                skills.add(skill)
    
    # Method 2: Extract from noun chunks and entities
    for chunk in doc.noun_chunks:
        chunk_text = chunk.text.lower().strip()
        if len(chunk_text) > 2 and len(chunk_text) < 50:
            # Filter out common words that aren't skills
            if not any(word in chunk_text for word in ['the', 'and', 'or', 'with', 'for', 'in', 'on', 'at']):
                skills.add(chunk_text)
    
    # Method 3: Extract from named entities
    for ent in doc.ents:
        if ent.label_ in ['ORG', 'PRODUCT', 'WORK_OF_ART']:
            skills.add(ent.text.lower())
    
    # Method 4: Look for skill patterns (e.g., "experience with X", "proficient in Y")
    skill_patterns = [
        r'experience with (\w+)',
        r'proficient in (\w+)',
        r'skilled in (\w+)',
        r'expertise in (\w+)',
        r'knowledge of (\w+)',
        r'familiar with (\w+)',
        r'worked with (\w+)',
        r'developed using (\w+)',
        r'built with (\w+)',
        r'created using (\w+)',
        r'project.*(\w+)',  # Skills mentioned in projects
        r'developed.*(\w+)',  # Skills used in development
        r'built.*(\w+)',      # Skills used in building
        r'created.*(\w+)'     # Skills used in creation
    ]
    
    for pattern in skill_patterns:
        matches = re.findall(pattern, text_lower)
        for match in matches:
            if len(match) > 2:
                skills.add(match)
    
    return list(skills)

# Helper: Extract projects from resume
def extract_projects_from_text(text):
    projects = []
    text_lower = text.lower()
    
    # Look for project patterns
    project_patterns = [
        r'project.*?(\w+.*?)(?=\n|\.|$)',
        r'developed.*?(\w+.*?)(?=\n|\.|$)',
        r'built.*?(\w+.*?)(?=\n|\.|$)',
        r'created.*?(\w+.*?)(?=\n|\.|$)',
        r'designed.*?(\w+.*?)(?=\n|\.|$)',
        r'implemented.*?(\w+.*?)(?=\n|\.|$)'
    ]
    
    for pattern in project_patterns:
        matches = re.findall(pattern, text_lower)
        for match in matches:
            if len(match) > 10:  # Filter out very short matches
                projects.append(match.strip())
    
    return list(set(projects))

# Helper: Extract experience information with better detection
def extract_experience_info(text):
    doc = nlp(text)
    experience_years = 0
    experience_level = 'entry'
    
    # Look for years of experience with more patterns
    year_patterns = [
        r'(\d+)\+?\s*years?\s*of?\s*experience',
        r'experience\s*of?\s*(\d+)\+?\s*years?',
        r'(\d+)\+?\s*years?\s*in',
        r'(\d+)\+?\s*years?\s*working',
        r'(\d+)\+?\s*years?\s*as',
        r'(\d+)\+?\s*years?\s*developing',
        r'(\d+)\+?\s*years?\s*programming',
        r'(\d+)\+?\s*years?\s*software',
        r'(\d+)\+?\s*years?\s*web',
        r'(\d+)\+?\s*years?\s*data'
    ]
    
    for pattern in year_patterns:
        matches = re.findall(pattern, text.lower())
        for match in matches:
            try:
                years = int(match)
                experience_years = max(experience_years, years)
            except ValueError:
                continue
    
    # If no years found, look for experience indicators
    if experience_years == 0:
        experience_indicators = {
            'entry': ['intern', 'internship', 'student', 'graduate', 'entry level', 'junior'],
            'mid': ['mid level', 'intermediate', '2-3 years', '3-4 years'],
            'senior': ['senior', 'lead', '5+ years', '6+ years', '7+ years'],
            'lead': ['lead', 'team lead', 'technical lead', '8+ years', '9+ years'],
            'executive': ['executive', 'director', 'manager', '10+ years', '15+ years']
        }
        
        for level, indicators in experience_indicators.items():
            if any(indicator in text.lower() for indicator in indicators):
                experience_level = level
                break
    
    # Determine experience level based on years
    if experience_years >= 10:
        experience_level = 'executive'
    elif experience_years >= 7:
        experience_level = 'lead'
    elif experience_years >= 4:
        experience_level = 'senior'
    elif experience_years >= 2:
        experience_level = 'mid'
    else:
        experience_level = 'entry'
    
    return experience_years, experience_level

# Helper: Extract education information
def extract_education_info(text):
    education = []
    text_lower = text.lower()
    
    # Look for degree patterns
    degree_patterns = [
        r'bachelor[\'s]?\s*of\s*(\w+)',
        r'master[\'s]?\s*of\s*(\w+)',
        r'phd\s*in\s*(\w+)',
        r'doctorate\s*in\s*(\w+)',
        r'associate[\'s]?\s*degree\s*in\s*(\w+)',
        r'(\w+)\s*degree',
        r'(\w+)\s*diploma'
    ]
    
    for pattern in degree_patterns:
        matches = re.findall(pattern, text_lower)
        for match in matches:
            if match not in ['the', 'a', 'an']:
                education.append(match)
    
    return list(set(education))

# Helper: Extract key achievements and projects
def extract_achievements(text):
    achievements = []
    
    # Look for achievement patterns
    achievement_patterns = [
        r'increased\s+(\w+)\s+by\s+(\d+)%',
        r'reduced\s+(\w+)\s+by\s+(\d+)%',
        r'improved\s+(\w+)\s+by\s+(\d+)%',
        r'led\s+(\w+)\s+team\s+of\s+(\d+)',
        r'managed\s+(\w+)\s+budget\s+of\s+\$?(\d+)',
        r'developed\s+(\w+)\s+application',
        r'built\s+(\w+)\s+system',
        r'created\s+(\w+)\s+platform'
    ]
    
    for pattern in achievement_patterns:
        matches = re.findall(pattern, text.lower())
        for match in matches:
            if isinstance(match, tuple):
                achievements.append(' '.join(match))
            else:
                achievements.append(match)
    
    return achievements

# Helper: Fetch jobs from backend
def fetch_jobs():
    try:
        resp = requests.get(f"{BACKEND_API_URL}/jobs")
        if resp.status_code == 200:
            return resp.json().get('data', [])
        return []
    except Exception as e:
        print('Error fetching jobs:', e)
        return []

# Helper: Prepare job corpus for matching
def prepare_job_corpus(jobs):
    corpus = []
    for job in jobs:
        # Combine all relevant job information
        text = f"{job.get('title', '')} {job.get('description', '')} {job.get('summary', '')} "
        
        # Add skills from requirements
        if 'requirements' in job and 'skills' in job['requirements']:
            text += f"{' '.join(job['requirements']['skills'])} "
        
        # Add company and location info
        text += f"{job.get('company', {}).get('name', '')} {job.get('location', {}).get('city', '')} "
        
        # Add job type and level
        text += f"{job.get('jobType', '')} {job.get('level', '')} "
        
        # Add work type
        text += f"{job.get('workType', '')}"
        
        corpus.append(text.lower())
    return corpus

# Helper: Calculate skill match score with detailed breakdown
def calculate_skill_match(resume_skills, job_skills, resume_projects=None):
    if not job_skills:
        return {
            'matching_skills': [],
            'missing_skills': [],
            'match_percentage': 0,
            'skill_breakdown': {}
        }
    
    resume_skills_set = set(resume_skills)
    job_skills_set = set(job_skills)
    
    # Calculate intersection
    matching_skills = resume_skills_set.intersection(job_skills_set)
    missing_skills = job_skills_set - resume_skills_set
    
    # Calculate match percentage
    match_percentage = len(matching_skills) / len(job_skills_set) * 100
    
    # Check if any missing skills are mentioned in projects
    project_skill_matches = []
    if resume_projects:
        project_text = ' '.join(resume_projects).lower()
        for missing_skill in missing_skills:
            if missing_skill in project_text:
                project_skill_matches.append(missing_skill)
    
    # Create detailed breakdown
    skill_breakdown = {
        'exact_matches': list(matching_skills),
        'project_matches': project_skill_matches,
        'missing_skills': list(missing_skills - set(project_skill_matches)),
        'total_required': len(job_skills_set),
        'total_matched': len(matching_skills) + len(project_skill_matches)
    }
    
    # Adjust match percentage to include project matches
    adjusted_match_percentage = (len(matching_skills) + len(project_skill_matches)) / len(job_skills_set) * 100
    
    return {
        'matching_skills': list(matching_skills),
        'project_matching_skills': project_skill_matches,
        'missing_skills': list(missing_skills - set(project_skill_matches)),
        'match_percentage': adjusted_match_percentage,
        'skill_breakdown': skill_breakdown
    }

# Helper: Recommend jobs using multiple criteria with enhanced logic
def recommend_jobs(resume_text, resume_skills, resume_projects, experience_years, experience_level, jobs, top_n=5):
    corpus = prepare_job_corpus(jobs)
    if not corpus:
        return []
    
    # TF-IDF similarity
    vectorizer = TfidfVectorizer(stop_words='english', max_features=1000)
    X = vectorizer.fit_transform(corpus + [resume_text.lower()])
    similarities = cosine_similarity(X[-1], X[:-1]).flatten()
    
    recommendations = []
    for idx, job in enumerate(jobs):
        # Calculate skill match with detailed breakdown
        job_skills = job.get('requirements', {}).get('skills', [])
        skill_match = calculate_skill_match(resume_skills, job_skills, resume_projects)
        
        # Calculate experience match with fallback to entry level
        job_level = job.get('level', 'mid')
        experience_match = 0
        experience_reason = ""
        
        if job_level == experience_level:
            experience_match = 1.0
            experience_reason = f"Perfect match: {job_level} level"
        elif (job_level == 'senior' and experience_level in ['senior', 'lead', 'executive']) or \
             (job_level == 'mid' and experience_level in ['mid', 'senior', 'lead', 'executive']) or \
             (job_level == 'entry' and experience_level in ['entry', 'mid', 'senior', 'lead', 'executive']):
            experience_match = 0.8
            experience_reason = f"Good match: {experience_level} applying for {job_level}"
        elif job_level == 'entry' and experience_level == 'entry':
            experience_match = 1.0
            experience_reason = "Entry level match"
        elif experience_level == 'entry':
            # If no experience detected, recommend entry level jobs
            experience_match = 0.9 if job_level == 'entry' else 0.3
            experience_reason = f"Entry level recommended: {job_level} job"
        else:
            experience_match = 0.5
            experience_reason = f"Partial match: {experience_level} for {job_level}"
        
        # Calculate project-based bonus
        project_bonus = 0
        if resume_projects and job_skills:
            project_text = ' '.join(resume_projects).lower()
            project_skill_matches = sum(1 for skill in job_skills if skill in project_text)
            if project_skill_matches > 0:
                project_bonus = min(0.2, project_skill_matches * 0.05)  # Max 20% bonus
        
        # Combined score (weighted average)
        tfidf_score = float(similarities[idx])
        skill_score = skill_match['match_percentage'] / 100
        combined_score = (tfidf_score * 0.3 + skill_score * 0.4 + experience_match * 0.2 + project_bonus * 0.1) * 100
        
        recommendations.append({
            'job': job,
            'similarity': combined_score,
            'skill_match': skill_match,
            'experience_match': {
                'score': experience_match,
                'reason': experience_reason,
                'job_level': job_level,
                'resume_level': experience_level
            },
            'project_bonus': project_bonus,
            'tfidf_score': tfidf_score * 100,
            'detailed_analysis': {
                'text_similarity': tfidf_score * 100,
                'skill_match_percentage': skill_match['match_percentage'],
                'experience_match_percentage': experience_match * 100,
                'project_skill_matches': len(skill_match.get('project_matching_skills', []))
            }
        })
    
    # Sort by combined score and return top N
    recommendations.sort(key=lambda x: x['similarity'], reverse=True)
    return recommendations[:top_n]

@app.route('/ml/match', methods=['POST'])
def match_resume():
    if 'resume' not in request.files:
        return jsonify({'success': False, 'message': 'No resume file uploaded'}), 400
    
    file = request.files['resume']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No file selected'}), 400
    
    try:
        # Save file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
            file.save(tmp.name)
            file_path = tmp.name
        
        # Extract text from resume
        resume_text = extract_text_from_file(file_path, 'pdf')
        
        if not resume_text.strip():
            return jsonify({'success': False, 'message': 'Could not extract text from resume'}), 400
        
        # Extract information from resume
        skills = extract_skills_from_text(resume_text)
        experience_years, experience_level = extract_experience_info(resume_text)
        education = extract_education_info(resume_text)
        achievements = extract_achievements(resume_text)
        resume_projects = extract_projects_from_text(resume_text)
        
        # Fetch jobs and get recommendations
        jobs = fetch_jobs()
        recommendations = recommend_jobs(resume_text, skills, resume_projects, experience_years, experience_level, jobs, top_n=5)
        
        # Clean up temporary file
        os.unlink(file_path)
        
        return jsonify({
            'success': True,
            'resume_analysis': {
                'skills': skills,
                'experience_years': experience_years,
                'experience_level': experience_level,
                'education': education,
                'achievements': achievements,
                'projects': resume_projects,
                'text_length': len(resume_text)
            },
            'recommendations': recommendations,
            'total_jobs_analyzed': len(jobs),
            'analysis_summary': {
                'skills_detected': len(skills),
                'projects_found': len(resume_projects),
                'experience_detected': experience_years > 0,
                'recommendation_count': len(recommendations)
            }
        })
        
    except Exception as e:
        print(f"Error processing resume: {e}")
        return jsonify({'success': False, 'message': f'Error processing resume: {str(e)}'}), 500

@app.route('/ml/analyze-resume', methods=['POST'])
def analyze_resume_only():
    """Analyze resume without job matching"""
    if 'resume' not in request.files:
        return jsonify({'success': False, 'message': 'No resume file uploaded'}), 400
    
    file = request.files['resume']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No file selected'}), 400
    
    try:
        # Save file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
            file.save(tmp.name)
            file_path = tmp.name
        
        # Extract text from resume
        resume_text = extract_text_from_file(file_path, 'pdf')
        
        if not resume_text.strip():
            return jsonify({'success': False, 'message': 'Could not extract text from resume'}), 400
        
        # Extract information from resume
        skills = extract_skills_from_text(resume_text)
        experience_years, experience_level = extract_experience_info(resume_text)
        education = extract_education_info(resume_text)
        achievements = extract_achievements(resume_text)
        resume_projects = extract_projects_from_text(resume_text)
        
        # Clean up temporary file
        os.unlink(file_path)
        
        return jsonify({
            'success': True,
            'analysis': {
                'skills': skills,
                'experience_years': experience_years,
                'experience_level': experience_level,
                'education': education,
                'achievements': achievements,
                'text_length': len(resume_text),
                'extracted_text': resume_text[:1000] + "..." if len(resume_text) > 1000 else resume_text
            }
        })
        
    except Exception as e:
        print(f"Error analyzing resume: {e}")
        return jsonify({'success': False, 'message': f'Error analyzing resume: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'OK', 
        'message': 'ML Engine running', 
        'timestamp': str(np.datetime64('now')),
        'features': {
            'resume_analysis': True,
            'skill_extraction': True,
            'job_matching': True,
            'experience_analysis': True
        }
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001) 