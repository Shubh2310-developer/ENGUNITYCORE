Engunity AI Research Section: Complete Implementation Blueprint
EXECUTIVE OVERVIEW
Based on your architecture and research framework, the Research section must be the strategic differentiator of Engunity AI. This is not a PDF reader or summarization tool—it's a complete research environment that transforms how users collect, analyze, synthesize, and document knowledge.

1. CORE PHILOSOPHY & VALUE PROPOSITION
What Sets This Apart
Current landscape problems:

ChatGPT: Good for chat, terrible for structured research
Notion/Evernote: Organization tools without intelligence
Mendeley/Zotero: Citation managers without AI comprehension
Google Scholar: Discovery only, no analysis

Your Research section solves:

Scattered → Structured: Turn 20 PDFs into coherent insights
Reading → Understanding: AI explains complex papers at your level
Notes → Synthesis: Automated cross-document analysis
Claims → Citations: Every statement traceable to source
Chaos → Audit trail: Full version history and reasoning logs

Target Users & Use Cases
Academic Researchers:

Literature reviews for theses/dissertations
Conference paper preparation
Grant proposal research
Systematic reviews

Graduate Students:

GATE/GRE exam preparation with paper reading
Project background research
Seminar presentations
Concept clarification across papers

Industry Researchers:

Market analysis reports
Technology trend analysis
Competitive intelligence
Patent research

Content Creators:

Technical article research
Video script preparation
Course material development


2. ARCHITECTURAL INTEGRATION WITH YOUR PROJECT
Frontend Architecture
frontend/src/app/(dashboard)/research/
├── workspace/
│   ├── [workspaceId]/
│   │   ├── page.tsx                 # Main workspace view
│   │   ├── sources/                 # Library management
│   │   ├── reader/                  # Document viewer
│   │   ├── editor/                  # Synthesis editor
│   │   ├── analysis/                # Comparison tools
│   │   ├── citations/               # Reference manager
│   │   └── agents/                  # Agent dashboard
├── components/
│   ├── DocumentViewer/              # PDF/DOCX renderer
│   ├── AnnotationLayer/             # Highlighting & notes
│   ├── ComparisonTable/             # Multi-paper analysis
│   ├── CitationInserter/            # Inline citation UI
│   ├── ResearchEditor/              # Structured writing
│   ├── AgentPanel/                  # Agent outputs
│   └── VersionTimeline/             # History viewer
└── library/
    └── page.tsx                     # Global sources library
Backend Services
backend/app/services/research/
├── document_processor.py            # Parse PDFs, extract metadata
├── annotation_service.py            # Store/retrieve annotations
├── synthesis_engine.py              # Cross-doc analysis
├── citation_manager.py              # APA/IEEE/BibTeX generation
├── vector_search.py                 # Semantic document search
└── export_service.py                # PDF/DOCX/LaTeX export

backend/app/agents/
├── research_agent.py                # Multi-paper analysis
├── gap_detection_agent.py           # Find research gaps
├── citation_checker.py              # Verify references
├── method_comparator.py             # Compare methodologies
└── hypothesis_challenger.py         # Critical analysis
Database Schema Extensions
PostgreSQL tables needed:
sql-- Research Workspaces
CREATE TABLE research_workspaces (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    research_question TEXT,
    hypothesis TEXT,
    status VARCHAR(50), -- exploring, writing, finalizing
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Sources/Documents
CREATE TABLE research_sources (
    id UUID PRIMARY KEY,
    workspace_id UUID REFERENCES research_workspaces(id),
    title VARCHAR(500),
    authors TEXT[],
    year INTEGER,
    venue VARCHAR(300),
    doi VARCHAR(200),
    arxiv_id VARCHAR(100),
    file_url TEXT,
    file_type VARCHAR(20), -- pdf, docx, url
    relevance_score FLOAT,
    metadata JSONB,
    created_at TIMESTAMP
);

-- Annotations
CREATE TABLE annotations (
    id UUID PRIMARY KEY,
    source_id UUID REFERENCES research_sources(id),
    user_id UUID REFERENCES users(id),
    page_number INTEGER,
    start_offset INTEGER,
    end_offset INTEGER,
    highlighted_text TEXT,
    comment TEXT,
    annotation_type VARCHAR(50), -- highlight, question, explanation
    color VARCHAR(20),
    created_at TIMESTAMP
);

-- Research Drafts
CREATE TABLE research_drafts (
    id UUID PRIMARY KEY,
    workspace_id UUID REFERENCES research_workspaces(id),
    section_type VARCHAR(100), -- intro, related_work, methodology
    content TEXT,
    version INTEGER,
    parent_version UUID,
    created_at TIMESTAMP
);

-- Citations
CREATE TABLE citations (
    id UUID PRIMARY KEY,
    draft_id UUID REFERENCES research_drafts(id),
    source_id UUID REFERENCES research_sources(id),
    position_in_text INTEGER,
    citation_text VARCHAR(500),
    page_reference VARCHAR(50),
    confidence_score FLOAT
);

-- Agent Outputs
CREATE TABLE agent_outputs (
    id UUID PRIMARY KEY,
    workspace_id UUID REFERENCES research_workspaces(id),
    agent_type VARCHAR(100),
    input_params JSONB,
    output_data JSONB,
    reasoning_steps JSONB,
    sources_used UUID[],
    created_at TIMESTAMP
);

-- Cross-Document Analysis
CREATE TABLE document_comparisons (
    id UUID PRIMARY KEY,
    workspace_id UUID REFERENCES research_workspaces(id),
    source_ids UUID[],
    comparison_type VARCHAR(100), -- methodology, results, datasets
    analysis_result JSONB,
    created_at TIMESTAMP
);
Vector Store Integration (FAISS)
Two-level indexing:

Document-level embeddings: Entire paper → single vector
Chunk-level embeddings: Paragraphs → individual vectors

python# backend/app/services/research/vector_search.py
class ResearchVectorStore:
    def __init__(self):
        self.document_index = faiss.IndexFlatL2(768)  # Document level
        self.chunk_index = faiss.IndexFlatL2(768)     # Paragraph level
        self.encoder = SentenceTransformer('all-mpnet-base-v2')
    
    def index_document(self, source_id, full_text, chunks):
        # Index whole document
        doc_embedding = self.encoder.encode(full_text)
        self.document_index.add(doc_embedding)
        
        # Index chunks with metadata
        for chunk in chunks:
            chunk_embedding = self.encoder.encode(chunk['text'])
            self.chunk_index.add(chunk_embedding)
            # Store mapping: chunk_id -> source_id, page, position
    
    def semantic_search(self, query, top_k=10):
        query_embedding = self.encoder.encode(query)
        distances, indices = self.chunk_index.search(query_embedding, top_k)
        return self._retrieve_context(indices)

3. DETAILED FEATURE IMPLEMENTATION
A. RESEARCH WORKSPACE (Project Container)
UI Components:
typescript// frontend/src/app/(dashboard)/research/workspace/[workspaceId]/page.tsx

interface Workspace {
  id: string;
  title: string;
  description: string;
  researchQuestion: string;
  hypothesis?: string;
  status: 'exploring' | 'writing' | 'finalizing';
  tags: string[];
  sources: Source[];
  drafts: Draft[];
  agentOutputs: AgentOutput[];
  createdAt: Date;
  updatedAt: Date;
}

// Main workspace view shows:
// - Research question prominently
// - Quick stats (5 sources, 3 drafts, 2 agent analyses)
// - Navigation to sub-sections
// - Recent activity timeline
Features:

Template-based workspace creation ("Literature Review", "Market Analysis", "Systematic Review")
Smart suggestions for research questions based on uploaded sources
Status automation (auto-advance from exploring → writing when certain criteria met)
Workspace sharing with collaborators (Pro feature)


B. SOURCES & LIBRARY (Knowledge Base)
Upload & Parsing Pipeline:
python# backend/app/services/research/document_processor.py

class DocumentProcessor:
    async def process_upload(self, file, workspace_id):
        # 1. Extract metadata
        metadata = await self.extract_metadata(file)
        
        # 2. Parse content
        if file.type == 'pdf':
            text, figures, tables = await self.parse_pdf(file)
        elif file.type == 'docx':
            text = await self.parse_docx(file)
        
        # 3. Chunk for vector indexing
        chunks = self.smart_chunk(text)
        
        # 4. Generate embeddings
        embeddings = await self.generate_embeddings(chunks)
        
        # 5. Store in FAISS
        await self.vector_store.index_document(source_id, text, chunks)
        
        # 6. Extract key information using LLM
        analysis = await self.analyze_document(text)
        # Returns: main_topic, methodology, key_findings, limitations
        
        # 7. Save to database
        source = await self.db.save_source({
            'workspace_id': workspace_id,
            'metadata': metadata,
            'content': text,
            'analysis': analysis,
            'relevance_score': self.calculate_relevance(text, workspace.research_question)
        })
        
        return source
Metadata Extraction:

From PDFs: PyMuPDF/pdfplumber for text, arXiv API for academic papers
From DOI: Crossref API for paper metadata
From arXiv ID: arXiv API for paper details
From URLs: Web scraping with metadata parsers

Smart Features:

Duplicate detection: Check title + author similarity using fuzzy matching
Version tracking: Detect if paper is revised version (arXiv v1, v2, etc.)
Auto-categorization: Tag papers by topic using zero-shot classification
Relevance scoring: Compare paper abstract to research question

UI Features:
typescript// Library view with:
// - Grid/List toggle
// - Filters: Year, Venue, Tags, Relevance score
// - Sort: Date added, Relevance, Citations
// - Batch operations: Tag multiple, Compare selected
// - Quick preview on hover
// - Drag-and-drop to workspaces

C. READING & ANNOTATION (Critical Intelligence Layer)
Document Viewer Architecture:
typescript// frontend/src/app/(dashboard)/research/workspace/[workspaceId]/reader/page.tsx

interface DocumentReaderProps {
  sourceId: string;
  annotations: Annotation[];
  onAnnotate: (annotation: Annotation) => void;
  onAIExplain: (text: string) => void;
}

// Features:
// - PDF rendering with pdf.js or react-pdf
// - Paragraph-level selection
// - Annotation toolbar (highlight, comment, question, AI explain)
// - Sidebar with all annotations for this document
// - Cross-reference panel showing related sections from other papers
Annotation System:
python# backend/app/services/research/annotation_service.py

class AnnotationService:
    async def create_annotation(self, data):
        annotation = {
            'source_id': data['source_id'],
            'user_id': data['user_id'],
            'highlighted_text': data['text'],
            'page_number': data['page'],
            'comment': data['comment'],
            'annotation_type': data['type'],  # highlight, question, explanation
            'ai_explanation': None
        }
        
        # If user requests AI explanation
        if data['type'] == 'explanation_request':
            context = await self.get_paragraph_context(
                data['source_id'], 
                data['page'], 
                data['text']
            )
            
            explanation = await self.llm_explain(
                text=data['text'],
                context=context,
                complexity_level=data['complexity_level']  # technical, simple
            )
            
            annotation['ai_explanation'] = explanation
        
        return await self.db.save_annotation(annotation)
    
    async def llm_explain(self, text, context, complexity_level):
        prompt = f"""
You are explaining a research paper excerpt to a {complexity_level} audience.

Paper context: {context['paper_title']}
Section: {context['section_name']}

Excerpt to explain:
{text}

Provide:
1. Main idea (1-2 sentences)
2. Key terms explained
3. Why this matters in the paper's context
4. Related concepts
"""
        
        response = await self.groq_api.completion(prompt)
        return response
AI-Assisted Comprehension:
python# On-demand AI actions triggered from reader UI:

class ComprehensionAssistant:
    async def section_summary(self, source_id, section_text):
        # Summarize entire section in 3-4 bullet points
        pass
    
    async def method_explanation(self, source_id, method_text):
        # Break down methodology step-by-step
        # Extract: Algorithm, Dataset, Metrics, Baselines
        pass
    
    async def assumptions_extraction(self, source_id):
        # Find all stated/unstated assumptions in paper
        # Categorize: Data assumptions, Model assumptions, Evaluation assumptions
        pass
    
    async def limitations_detection(self, source_id):
        # Identify limitations mentioned by authors
        # Flag potential unstated limitations
        pass
    
    async def equation_breakdown(self, equation_latex):
        # Step-by-step explanation of equation
        # Define each variable
        # Show example calculation
        pass
    
    async def figure_interpretation(self, figure_image):
        # Use vision model (GPT-4V or similar) to explain chart/graph
        # Identify trends, patterns, outliers
        pass

D. CROSS-DOCUMENT INTELLIGENCE (Game Changer)
This is where you destroy competitors.
python# backend/app/services/research/synthesis_engine.py

class SynthesisEngine:
    async def compare_methodologies(self, source_ids):
        """
        Compare methods used across multiple papers
        Returns structured comparison table
        """
        papers = await self.db.get_sources(source_ids)
        
        # Extract methodology sections
        methods = []
        for paper in papers:
            method_section = await self.extract_section(paper, 'methodology')
            parsed_method = await self.parse_methodology(method_section)
            methods.append({
                'paper': paper['title'],
                'algorithm': parsed_method['algorithm'],
                'dataset': parsed_method['dataset'],
                'metrics': parsed_method['metrics'],
                'baselines': parsed_method['baselines']
            })
        
        # Generate comparison
        comparison = {
            'papers': len(methods),
            'algorithms_used': self.aggregate_unique(methods, 'algorithm'),
            'datasets_used': self.aggregate_unique(methods, 'dataset'),
            'common_metrics': self.find_common(methods, 'metrics'),
            'table': self.build_comparison_table(methods)
        }
        
        return comparison
    
    async def detect_conflicts(self, source_ids):
        """
        Find contradictory conclusions across papers
        """
        papers = await self.db.get_sources(source_ids)
        
        # Extract conclusions
        conclusions = []
        for paper in papers:
            conclusion = await self.extract_section(paper, 'conclusion')
            claims = await self.extract_claims(conclusion)
            conclusions.append({
                'paper': paper['title'],
                'claims': claims
            })
        
        # Semantic similarity + contradiction detection
        conflicts = []
        for i, c1 in enumerate(conclusions):
            for c2 in conclusions[i+1:]:
                for claim1 in c1['claims']:
                    for claim2 in c2['claims']:
                        similarity = self.semantic_similarity(claim1, claim2)
                        if similarity > 0.8:  # Talking about same thing
                            contradiction = await self.detect_contradiction(claim1, claim2)
                            if contradiction:
                                conflicts.append({
                                    'paper1': c1['paper'],
                                    'claim1': claim1,
                                    'paper2': c2['paper'],
                                    'claim2': claim2,
                                    'explanation': contradiction
                                })
        
        return conflicts
    
    async def identify_consensus(self, source_ids, topic):
        """
        Find what most papers agree on
        """
        papers = await self.db.get_sources(source_ids)
        
        # Extract all claims about topic
        claims_by_paper = {}
        for paper in papers:
            relevant_text = await self.extract_topic_mentions(paper, topic)
            claims = await self.extract_claims(relevant_text)
            claims_by_paper[paper['id']] = claims
        
        # Cluster similar claims
        claim_clusters = self.cluster_claims(claims_by_paper)
        
        # Identify consensus (claims appearing in >50% of papers)
        consensus = []
        for cluster in claim_clusters:
            if cluster['support_count'] > len(papers) / 2:
                consensus.append({
                    'claim': cluster['representative_claim'],
                    'supporting_papers': cluster['papers'],
                    'confidence': cluster['support_count'] / len(papers)
                })
        
        return consensus
    
    async def gap_analysis(self, source_ids):
        """
        Identify research gaps across papers
        """
        papers = await self.db.get_sources(source_ids)
        
        # Extract all discussed topics
        all_topics = set()
        topics_by_paper = {}
        for paper in papers:
            topics = await self.extract_topics(paper)
            all_topics.update(topics)
            topics_by_paper[paper['id']] = topics
        
        # Find rarely discussed topics
        topic_frequencies = {topic: 0 for topic in all_topics}
        for topics in topics_by_paper.values():
            for topic in topics:
                topic_frequencies[topic] += 1
        
        # Gaps = topics mentioned in <20% of papers
        gaps = []
        for topic, freq in topic_frequencies.items():
            if freq < len(papers) * 0.2:
                gaps.append({
                    'topic': topic,
                    'mentioned_in': freq,
                    'potential_gap': True
                })
        
        # Use LLM to validate gaps
        validated_gaps = await self.validate_gaps_with_llm(gaps, papers)
        
        return validated_gaps
UI for Comparison Tools:
typescript// frontend/src/app/(dashboard)/research/workspace/[workspaceId]/analysis/page.tsx

interface ComparisonView {
  // Select papers to compare (multi-select from workspace sources)
  // Choose comparison type:
  // - Methodology comparison
  // - Results comparison
  // - Dataset usage
  // - Conflicting conclusions
  // - Gap analysis
  
  // Display results as:
  // - Comparison table (sortable, filterable)
  // - Visual chart (bar chart for metrics, Venn diagram for overlaps)
  // - Summary insights (AI-generated)
  // - Export to CSV/PDF
}

E. SYNTHESIS & WRITING (Structured Editor)
Research Editor Architecture:
typescript// Not a simple text editor—it's a structured research document builder

interface ResearchEditorProps {
  workspaceId: string;
  draftId: string;
  sources: Source[];  // Available for citation
  annotations: Annotation[];  // User's notes
  agentOutputs: AgentOutput[];  // AI analysis results
}

// Editor structure:
// - Section templates (Introduction, Related Work, Methodology, etc.)
// - Inline citation insertion (click to browse sources)
// - AI writing assistant sidebar (non-destructive suggestions)
// - Version comparison view
// - Export options
Section Templates:
typescriptconst RESEARCH_TEMPLATES = {
  literature_review: {
    sections: [
      'Introduction',
      'Search Methodology',
      'Thematic Analysis',
      'Key Findings',
      'Research Gaps',
      'Conclusion'
    ],
    prompts: {
      introduction: 'Introduce the research topic and review scope...',
      thematic_analysis: 'Group papers by theme...'
    }
  },
  technical_paper: {
    sections: [
      'Abstract',
      'Introduction',
      'Related Work',
      'Methodology',
      'Results',
      'Discussion',
      'Conclusion',
      'References'
    ]
  },
  market_analysis: {
    sections: [
      'Executive Summary',
      'Market Overview',
      'Competitive Analysis',
      'Key Trends',
      'Recommendations'
    ]
  }
}
AI Writing Assistant:
python# backend/app/services/research/writing_assistant.py

class WritingAssistant:
    async def suggest_rewrite(self, text, instruction):
        """
        Non-destructive suggestions only
        User must explicitly accept changes
        """
        prompt = f"""
Original text:
{text}

User instruction: {instruction}

Provide 2-3 alternative rewrites that:
1. Maintain factual accuracy
2. Improve clarity
3. {instruction}

Format each suggestion separately.
"""
        suggestions = await self.llm_complete(prompt)
        return suggestions  # User chooses which to apply
    
    async def expand_argument(self, text, direction):
        """
        Suggest ways to expand a point with more detail
        """
        prompt = f"""
Current argument:
{text}

Suggest ways to expand this by:
- Adding supporting evidence
- Providing examples
- Addressing counterarguments
- Connecting to broader context

Direction: {direction}
"""
        expansion = await self.llm_complete(prompt)
        return expansion
    
    async def improve_academic_tone(self, text):
        """
        Make text more academic without losing meaning
        """
        # Suggest formal alternatives to casual phrases
        # Remove first-person unless necessary
        # Add hedging language where appropriate
        pass
    
    async def reduce_redundancy(self, text):
        """
        Identify and suggest removing redundant content
        """
        # Find repeated ideas
        # Suggest consolidation
        pass
Citation Integration:
typescript// Inline citation widget in editor

interface CitationInserter {
  // Triggered by hotkey or button
  // Shows modal with:
  // - List of sources from workspace
  // - Search bar to filter
  // - Preview of source
  // - Page number input
  // - Citation style selector (APA, IEEE, MLA)
  
  // On insert:
  // - Adds citation marker in text [1]
  // - Stores citation data in database
  // - Updates reference list automatically
}

// Example generated citation:
// [1] Smith, J., & Brown, K. (2023). Transformer efficiency. 
//     In Proceedings of NeurIPS (pp. 234-245).

F. RESEARCH AGENTS (Asynchronous Intelligence)
Agent System Architecture:
python# backend/app/agents/research_agent.py

class ResearchAgent:
    """
    Base class for all research agents
    Agents run asynchronously and produce structured outputs
    """
    def __init__(self, workspace_id, agent_type):
        self.workspace_id = workspace_id
        self.agent_type = agent_type
        self.status = 'idle'  # idle, running, completed, failed
        self.progress = 0
        self.output = None
        self.reasoning_log = []
    
    async def run(self, parameters):
        """
        Execute agent task
        Store reasoning steps for transparency
        """
        self.status = 'running'
        
        try:
            result = await self.execute(parameters)
            self.output = result
            self.status = 'completed'
            await self.save_to_db()
        except Exception as e:
            self.status = 'failed'
            self.error = str(e)
            await self.save_to_db()
        
        return self.output
    
    async def execute(self, parameters):
        # Override in subclasses
        raise NotImplementedError
    
    def log_reasoning(self, step, thought):
        """Track agent's reasoning process"""
        self.reasoning_log.append({
            'step': step,
            'thought': thought,
            'timestamp': datetime.now()
        })
Specific Agent Implementations:
1. Literature Review Agent
pythonclass LiteratureReviewAgent(ResearchAgent):
    async def execute(self, parameters):
        """
        Analyzes multiple papers and generates comprehensive review
        """
        source_ids = parameters['source_ids']
        focus_area = parameters['focus_area']
        
        # Step 1: Load all papers
        self.log_reasoning(1, f"Loading {len(source_ids)} papers")
        papers = await self.db.get_sources(source_ids)
        self.progress = 20
        
        # Step 2: Extract key information from each
        self.log_reasoning(2, "Extracting methodologies, findings, limitations")
        paper_summaries = []
        for paper in papers:
            summary = await self.summarize_paper(paper, focus_area)
            paper_summaries.append(summary)
        self.progress = 50
        
        # Step 3: Identify themes
        self.log_reasoning(3, "Clustering papers by theme")
        themes = await self.identify_themes(paper_summaries)
        self.progress = 70
        
        # Step 4: Detect gaps
        self.log_reasoning(4, "Analyzing research gaps")
        gaps = await self.gap_analysis(papers)
        self.progress = 85
        
        # Step 5: Generate review structure
        self.log_reasoning(5, "Synthesizing final review")
        review = {
            'overview': await self.generate_overview(papers, focus_area),
            'themes': themes,
            'key_findings': await self.aggregate_findings(paper_summaries),
            'methodologies_used': await self.summarize_methods(papers),
            'research_gaps': gaps,
            'future_directions': await self.suggest_future_work(gaps),
            'papers_analyzed': len(papers),
            'citations': self.generate_citations(papers)
        }
        self.progress = 100
        
        return review
2. Gap Detection Agent
pythonclass GapDetectionAgent(ResearchAgent):
    async def execute(self, parameters):
        """
        Identifies underexplored areas in research
        """
        source_ids = parameters['source_ids']
        
        # Comprehensive gap analysis
        gaps = {
            'methodological_gaps': [],
            'dataset_gaps': [],
            'application_gaps': [],
            'theoretical_gaps': []
        }
        
        # Methodological gaps
        methods_used = await self.extract_all_methods(source_ids)
        methods_not_used = await self.identify_missing_methods(methods_used)
        gaps['methodological_gaps'] = methods_not_used
        
        # Dataset gaps
        datasets_used = await self.extract_all_datasets(source_ids)
        datasets_underused = await self.identify_underused_datasets(datasets_used)
        gaps['dataset_gaps'] = datasets_underused
        
        # Application gaps
        applications = await self.extract_applications(source_ids)
        missing_applications = await self.identify_missing_applications(applications)
        gaps['application_gaps'] = missing_applications
        
        # Theoretical gaps
        theories = await self.extract_theoretical_foundations(source_ids)
        gaps['theoretical_gaps'] = await self.identify_theoretical_gaps(theories)
        
        # Prioritize gaps by importance
        prioritized_gaps = await self.prioritize_gaps(gaps)
        
        return {
            'gaps': gaps,
            'prioritized': prioritized_gaps,
            'recommendations': await self.generate_recommendations(prioritized_gaps)
        }
3. Method Comparator Agent
pythonclass MethodComparatorAgent(ResearchAgent):
    async def execute(self, parameters):
        """
        Deep comparison of methodologies across papers
        """
        source_ids = parameters['source_ids']
        papers = await self.db.get_sources(source_ids)
        
        # Extract method details
        methods = []
        for paper in papers:
            method_section = await self.extract_section(paper, 'methodology')
            parsed = await self.parse_methodology_details(method_section)
            methods.append({
                'paper': paper['title'],
                'year': paper['year'],
                'algorithm': parsed['algorithm'],
                'architecture': parsed['architecture'],
                'dataset': parsed['dataset'],
                'preprocessing': parsed['preprocessing'],
                'hyperparameters': parsed['hyperparameters'],
                'evaluation_metrics': parsed['metrics'],
                'results': await self.extract_results(paper)
            })
        
        # Generate comparison
        comparison = {
            'comparison_table': self.build_detailed_table(methods),
            'algorithm_evolution': self.track_algorithm_evolution(methods),
            'dataset_trends': self.analyze_dataset_usage(methods),
            'performance_analysis': self.compare_performance(methods),
            'best_practices': await self.extract_best_practices(methods),
            'recommendations': await self.generate_method_recommendations(methods)
        }
        
        return comparison
4. Citation Checker Agent
pythonclass CitationCheckerAgent(ResearchAgent):
    async def execute(self, parameters):
        """
        Verify citations are accurate and complete
        """
        draft_id = parameters['draft_id']
        draft = await self.db.get_draft(draft_id)
        
        checks = {
            'missing_citations': [],
            'incorrect_citations': [],
            'formatting_issues': [],
            'citation_health_score': 0
        }
        
        # Extract all claims from draft
        claims = await self.extract_claims(draft['content'])
        
        # Check each claim for proper citation
        for claim in claims:
            if await self.requires_citation(claim):
                citation = self.find_citation_for_claim(claim, draft['citations'])
                if not citation:
                    checks['missing_citations'].append({
                        'claim': claim,
                        'location': claim['position'],
                        'severity': 'high'
                    })
        
        # Verify cited sources actually support claims
        for citation in draft['citations']:
            source = await self.db.get_source(citation['source_id'])
            claim_text = self.get_text_at_citation(draft['content'], citation['position'])
            
            verification = await self.verify_citation_supports_claim(
                source['content'],
                claim_text
            )
            
            if not verification['supports']:
                checks['incorrect_citations'].append({
                    'citation': citation,
                    'reason': verification['reason']
                })
        
        # Check formatting consistency
        checks['formatting_issues'] = self.check_citation_formatting(draft['citations'])
        
        # Calculate health score
        total_citations = len(draft['citations'])
        issues = len(checks['missing_citations']) + len(checks['incorrect_citations'])
        checks['citation_health_score'] = ((total_citations - issues) / total_citations) * 100
        
        return checks
5. Hypothesis Challenger Agent
pythonclass HypothesisChallengerAgent(ResearchAgent):
    async def execute(self, parameters):
        """
        Critically analyzes research hypothesis against evidence
        """
        workspace_id = parameters['workspace_id']
        workspace = await self.db.get_workspace(workspace_id)
        hypothesis = workspace['hypothesis']
        
        # Gather evidence
        sources = await self.db.get_workspace_sources(workspace_id)
        
        analysis = {
            'supporting_evidence': [],
            'contradicting_evidence': [],
            'assumptions': [],
            'alternative_hypotheses': [],
            'strength_assessment': {}
        }
        
        # Find supporting evidence
        for source in sources:
            support = await self.find_supporting_evidence(source, hypothesis)
            if support['relevance'] > 0.7:
                analysis['supporting_evidence'].append(support)
            elif support['contradicts']:
                analysis['contradicting_evidence'].append(support)
        
        # Extract assumptions
        analysis['assumptions'] = await self.extract_assumptions(hypothesis, sources)
        
        # Suggest alternative hypotheses
        analysis['alternative_hypotheses'] = await self.generate_alternatives(
            hypothesis,
            analysis['contradicting_evidence']
        )
        
        # Assess strength
        analysis['strength_assessment'] = {
            'evidence_strength': len(analysis['supporting_evidence']) / len(sources),
            'contradiction_risk': len(analysis['contradicting_evidence']) / len(sources),
            'assumption_validity': await self.assess_assumptions(analysis['assumptions']),
            'overall_confidence': self.calculate_confidence(analysis)
        }
        
        return analysis
Agent Dashboard UI:
typescript// frontend/src/app/(dashboard)/research/workspace/[workspaceId]/agents/page.tsx

interface AgentDashboard {
  // List of available agents
  availableAgents: [
    { id: 'literature_review', name: 'Literature Review Generator' },
    { id: 'gap_detection', name: 'Research Gap Finder' },
    { id: 'method_compare', name: 'Methodology Comparator' },
    { id: 'citation_check', name: 'Citation Verifier' },
    { id: 'hypothesis_challenge', name: 'Hypothesis Challenger' }
  ];
  
  // Running agents status
  runningAgents: AgentRun[];
  
  // Completed agent outputs
  completedOutputs: AgentOutput[];
  
  // For each agent run, show:
  // - Progress bar
  // - Current step
  // - Reasoning log (expandable)
  // - Estimated time remaining
  
  // On completion:
  // - View full output
  // - Export to PDF/DOCX
  // - Apply insights to draft
  // - Re-run with different parameters
}

G. CITATIONS & REFERENCES (Non-Negotiable Excellence)
Citation Manager Implementation:
python# backend/app/services/research/citation_manager.py

class CitationManager:
    SUPPORTED_STYLES = ['apa', 'ieee', 'mla', 'chicago', 'bibtex']
    
    async def generate_citation(self, source, style='apa', include_page=None):
        """
        Generate formatted citation from source metadata
        """
        if style == 'apa':
            return self.format_apa(source, include_page)
        elif style == 'ieee':
            return self.format_ieee(source, include_page)
        # ... other styles
    
    def format_apa(self, source, page=None):
        """
        APA 7th edition format
        """
        authors = self.format_authors_apa(source['authors'])
        year = source['year']
        title = source['title']
        venue = source['venue']
        
        citation = f"{authors} ({year}). {title}. {venue}"
        
        if page:
            citation += f", {page}"
        
        # Add DOI if available
        if source.get('doi'):
            citation += f". https://doi.org/{source['doi']}"
        
        return citation
    
    def format_ieee(self, source, page=None):
        """
        IEEE citation format
        """
        authors = self.format_authors_ieee(source['authors'])
        title = f'"{source["title"]}"'
        venue = source['venue']
        year = source['year']
        
        citation = f"{authors}, {title}, {venue}, {year}"
        
        if page:
            citation += f", pp. {page}"
        
        if source.get('doi'):
            citation += f", doi: {source['doi']}"
        
        return citation
    
    async def insert_inline_citation(self, draft_id, source_id, position, page=None):
        """
        Insert citation at specific position in draft
        Returns citation marker (e.g., [1] for IEEE, (Author, Year) for APA)
        """
        draft = await self.db.get_draft(draft_id)
        workspace = await self.db.get_workspace(draft['workspace_id'])
        citation_style = workspace['citation_style'] or 'apa'
        
        # Generate citation marker
        if citation_style == 'ieee':
            marker = f"[{len(draft['citations']) + 1}]"
        elif citation_style == 'apa':
            source = await self.db.get_source(source_id)
            author_year = self.get_author_year(source)
            marker = f"({author_year})"
        
        # Store citation data
        citation = await self.db.create_citation({
            'draft_id': draft_id,
            'source_id': source_id,
            'position': position,
            'citation_text': marker,
            'page_reference': page
        })
        
        # Update reference list
        await self.update_reference_list(draft_id)
        
        return citation
    
    async def update_reference_list(self, draft_id):
        """
        Auto-generate reference list from all citations in draft
        """
        citations = await self.db.get_draft_citations(draft_id)
        draft = await self.db.get_draft(draft_id)
        workspace = await self.db.get_workspace(draft['workspace_id'])
        style = workspace['citation_style']
        
        # Get unique sources
        source_ids = list(set([c['source_id'] for c in citations]))
        sources = await self.db.get_sources(source_ids)
        
        # Generate formatted reference list
        references = []
        for i, source in enumerate(sources, 1):
            formatted = await self.generate_citation(source, style)
            references.append(f"{i}. {formatted}")
        
        # Update draft's reference section
        await self.db.update_draft_references(draft_id, references)
        
        return references
    
    async def export_bibtex(self, workspace_id):
        """
        Export all sources as BibTeX file
        """
        sources = await self.db.get_workspace_sources(workspace_id)
        
        bibtex_entries = []
        for source in sources:
            entry = self.generate_bibtex_entry(source)
            bibtex_entries.append(entry)
        
        return "\n\n".join(bibtex_entries)
    
    def generate_bibtex_entry(self, source):
        """
        Generate BibTeX entry from source metadata
        """
        entry_type = source.get('entry_type', 'article')
        cite_key = self.generate_cite_key(source)
        
        bibtex = f"@{entry_type}{{{cite_key},\n"
        
        # Add fields
        if source.get('authors'):
            bibtex += f"  author = {{{self.format_authors_bibtex(source['authors'])}}},\n"
        if source.get('title'):
            bibtex += f"  title = {{{source['title']}}},\n"
        if source.get('year'):
            bibtex += f"  year = {{{source['year']}}},\n"
        if source.get('venue'):
            bibtex += f"  journal = {{{source['venue']}}},\n"
        if source.get('doi'):
            bibtex += f"  doi = {{{source['doi']}}},\n"
        
        bibtex += "}"
        
        return bibtex
    
    async def verify_citations(self, draft_id):
        """
        Check if citations are correct and complete
        """
        citations = await self.db.get_draft_citations(draft_id)
        draft = await self.db.get_draft(draft_id)
        
        issues = []
        
        # Check for orphaned citations (source deleted)
        for citation in citations:
            source = await self.db.get_source(citation['source_id'])
            if not source:
                issues.append({
                    'type': 'orphaned_citation',
                    'citation': citation,
                    'severity': 'high'
                })
        
        # Check for duplicate citations
        citation_positions = [c['position'] for c in citations]
        duplicates = [pos for pos in citation_positions if citation_positions.count(pos) > 1]
        if duplicates:
            issues.append({
                'type': 'duplicate_citations',
                'positions': duplicates,
                'severity': 'medium'
            })
        
        # Check reference list consistency
        ref_list = draft.get('references', [])
        if len(ref_list) != len(set([c['source_id'] for c in citations])):
            issues.append({
                'type': 'reference_mismatch',
                'severity': 'high'
            })
        
        return issues
Citation UI Features:
typescript// Citation insertion modal
interface CitationInserter {
  // Search sources by title/author
  // Filter by relevance/date
  // Preview source details
  // Enter page number (optional)
  // Select citation style (if not workspace-level)
  // Insert at cursor position
}

// Reference list auto-updates
// Click citation → jump to source
// Hover citation → preview source details
// Bulk citation operations (change style, re-format all)

H. HISTORY, VERSIONING & AUDIT (Trust Layer)
Version Control System:
python# backend/app/services/research/version_control.py

class ResearchVersionControl:
    async def save_draft_version(self, draft_id, content, commit_message=None):
        """
        Save new version of draft
        """
        draft = await self.db.get_draft(draft_id)
        current_version = draft['version']
        
        new_version = await self.db.create_draft_version({
            'draft_id': draft_id,
            'version': current_version + 1,
            'parent_version': current_version,
            'content': content,
            'commit_message': commit_message or 'Auto-save',
            'created_at': datetime.now()
        })
        
        return new_version
    
    async def get_version_history(self, draft_id):
        """
        Get all versions of a draft with metadata
        """
        versions = await self.db.get_draft_versions(draft_id)
        
        # Calculate changes between versions
        history = []
        for i, version in enumerate(versions):
            if i > 0:
                diff = self.calculate_diff(versions[i-1]['content'], version['content'])
                version['changes'] = diff
            else:
                version['changes'] = {'added': 0, 'removed': 0, 'modified': 0}
            
            history.append(version)
        
        return history
    
    async def revert_to_version(self, draft_id, version_number):
        """
        Restore draft to previous version
        """
        version = await self.db.get_draft_version(draft_id, version_number)
        
        # Create new version (don't delete history)
        new_version = await self.save_draft_version(
            draft_id,
            version['content'],
            f"Reverted to version {version_number}"
        )
        
        return new_version
    
    async def compare_versions(self, draft_id, version1, version2):
        """
        Side-by-side comparison of two versions
        """
        v1 = await self.db.get_draft_version(draft_id, version1)
        v2 = await self.db.get_draft_version(draft_id, version2)
        
        diff = self.generate_detailed_diff(v1['content'], v2['content'])
        
        return {
            'version1': v1,
            'version2': v2,
            'diff': diff,
            'summary': {
                'lines_added': diff['added'],
                'lines_removed': diff['removed'],
                'lines_modified': diff['modified']
            }
        }
    
    def calculate_diff(self, old_content, new_content):
        """
        Calculate changes between two versions
        """
        import difflib
        
        old_lines = old_content.split('\n')
        new_lines = new_content.split('\n')
        
        diff = difflib.unified_diff(old_lines, new_lines)
        
        added = sum(1 for line in diff if line.startswith('+'))
        removed = sum(1 for line in diff if line.startswith('-'))
        
        return {
            'added': added,
            'removed': removed,
            'modified': min(added, removed)
        }
Annotation History:
pythonclass AnnotationVersionControl:
    async def track_annotation_changes(self, annotation_id):
        """
        Track edits to annotations over time
        """
        annotation = await self.db.get_annotation(annotation_id)
        history = await self.db.get_annotation_history(annotation_id)
        
        return {
            'current': annotation,
            'history': history,
            'edit_count': len(history)
        }
    
    async def annotation_timeline(self, source_id):
        """
        Timeline of all annotations made on a source
        """
        annotations = await self.db.get_source_annotations(source_id)
        
        timeline = sorted(annotations, key=lambda x: x['created_at'])
        
        return timeline
Agent Output History:
pythonclass AgentOutputHistory:
    async def track_agent_runs(self, workspace_id):
        """
        Log all agent executions for workspace
        """
        runs = await self.db.get_agent_runs(workspace_id)
        
        history = []
        for run in runs:
            history.append({
                'agent_type': run['agent_type'],
                'parameters': run['input_params'],
                'result': run['output_data'],
                'reasoning_steps': run['reasoning_steps'],
                'duration': run['duration'],
                'timestamp': run['created_at']
            })
        
        return history
Audit Dashboard:
typescript// frontend/src/app/(dashboard)/research/workspace/[workspaceId]/history/page.tsx

interface HistoryView {
  // Timeline view showing:
  // - Draft edits
  // - Annotations added/modified
  // - Sources uploaded
  // - Agent runs
  // - Citations added
  // - Exports generated
  
  // Filter by:
  // - Date range
  // - Activity type
  // - User (for collaborative workspaces)
  
  // For each activity:
  // - Timestamp
  // - Description
  // - View details (diff for edits, output for agents)
  // - Revert option (where applicable)
}

I. COLLABORATION FEATURES (Team Research)
Workspace Sharing:
python# backend/app/services/research/collaboration.py

class CollaborationService:
    async def share_workspace(self, workspace_id, user_email, role):
        """
        Share workspace with another user
        Roles: viewer, editor, admin
        """
        # Verify user exists
        collaborator = await self.auth.get_user_by_email(user_email)
        if not collaborator:
            raise UserNotFoundError()
        
        # Create collaboration record
        collab = await self.db.create_collaboration({
            'workspace_id': workspace_id,
            'user_id': collaborator['id'],
            'role': role,
            'invited_at': datetime.now()
        })
        
        # Send notification
        await self.notify_user(collaborator['id'], {
            'type': 'workspace_invitation',
            'workspace': workspace_id,
            'role': role
        })
        
        return collab
    
    async def comment_on_annotation(self, annotation_id, user_id, comment):
        """
        Add comment thread to annotation
        """
        comment = await self.db.create_annotation_comment({
            'annotation_id': annotation_id,
            'user_id': user_id,
            'text': comment,
            'created_at': datetime.now()
        })
        
        # Notify annotation creator
        annotation = await self.db.get_annotation(annotation_id)
        await self.notify_user(annotation['user_id'], {
            'type': 'annotation_comment',
            'annotation_id': annotation_id,
            'commenter_id': user_id
        })
        
        return comment
    
    async def suggest_edit(self, draft_id, user_id, position, original_text, suggested_text, reason=None):
        """
        Suggest edit to draft (Google Docs style)
        """
        suggestion = await self.db.create_edit_suggestion({
            'draft_id': draft_id,
            'user_id': user_id,
            'position': position,
            'original': original_text,
            'suggested': suggested_text,
            'reason': reason,
            'status': 'pending'  # pending, accepted, rejected
        })
        
        # Notify draft owner
        draft = await self.db.get_draft(draft_id)
        await self.notify_user(draft['user_id'], {
            'type': 'edit_suggestion',
            'draft_id': draft_id,
            'suggester_id': user_id
        })
        
        return suggestion
    
    async def accept_suggestion(self, suggestion_id):
        """
        Accept suggested edit and apply to draft
        """
        suggestion = await self.db.get_suggestion(suggestion_id)
        draft = await self.db.get_draft(suggestion['draft_id'])
        
        # Apply edit
        updated_content = self.apply_edit(
            draft['content'],
            suggestion['position'],
            suggestion['original'],
            suggestion['suggested']
        )
        
        # Save new version
        await self.version_control.save_draft_version(
            suggestion['draft_id'],
            updated_content,
            f"Applied suggestion from user {suggestion['user_id']}"
        )
        
        # Update suggestion status
        await self.db.update_suggestion(suggestion_id, {'status': 'accepted'})
        
        return updated_content

        RealtimeCollaborationService:
def init(self):
self.active_sessions = {}  # {workspace_id: [user_connections]}
async def handle_connection(self, websocket, workspace_id, user_id):
    """
    Handle WebSocket connection for real-time editing
    """
    # Add to active sessions
    if workspace_id not in self.active_sessions:
        self.active_sessions[workspace_id] = []
    
    self.active_sessions[workspace_id].append({
        'user_id': user_id,
        'socket': websocket
    })
    
    # Broadcast user joined
    await self.broadcast_presence(workspace_id, user_id, 'joined')
    
    try:
        async for message in websocket:
            await self.handle_edit_event(workspace_id, user_id, message)
    finally:
        # Remove on disconnect
        self.active_sessions[workspace_id].remove({
            'user_id': user_id,
            'socket': websocket
        })
        await self.broadcast_presence(workspace_id, user_id, 'left')

async def handle_edit_event(self, workspace_id, user_id, edit_data):
    """
    Broadcast edit to other collaborators
    """
    # Operational Transform for conflict resolution
    transformed_edit = self.operational_transform(edit_data)
    
    # Broadcast to all users in workspace except sender
    for session in self.active_sessions[workspace_id]:
        if session['user_id'] != user_id:
            await session['socket'].send_json({
                'type': 'edit',
                'user_id': user_id,
                'edit': transformed_edit
            })

---

### J. EXPORT & OUTPUT (Essential for Adoption)

**Export Service:**
```python
# backend/app/services/research/export_service.py

class ExportService:
    async def export_to_pdf(self, draft_id, include_annotations=True):
        """
        Generate PDF from draft with proper formatting
        """
        draft = await self.db.get_draft(draft_id)
        workspace = await self.db.get_workspace(draft['workspace_id'])
        
        # Prepare content
        html_content = self.markdown_to_html(draft['content'])
        
        # Add citations
        citations = await self.citation_manager.update_reference_list(draft_id)
        html_content += self.format_references_html(citations)
        
        # Add annotations if requested
        if include_annotations:
            annotations = await self.db.get_draft_annotations(draft_id)
            html_content += self.format_annotations_html(annotations)
        
        # Generate PDF using WeasyPrint or similar
        pdf = await self.html_to_pdf(html_content, {
            'title': draft['title'],
            'author': workspace['user_name'],
            'subject': workspace['research_question']
        })
        
        return pdf
    
    async def export_to_docx(self, draft_id):
        """
        Generate Word document with formatting
        """
        from docx import Document
        from docx.shared import Pt, Inches
        
        draft = await self.db.get_draft(draft_id)
        citations = await self.citation_manager.update_reference_list(draft_id)
        
        doc = Document()
        
        # Add title
        doc.add_heading(draft['title'], level=0)
        
        # Add content sections
        sections = self.parse_sections(draft['content'])
        for section in sections:
            doc.add_heading(section['title'], level=section['level'])
            doc.add_paragraph(section['content'])
        
        # Add references
        doc.add_page_break()
        doc.add_heading('References', level=1)
        for citation in citations:
            doc.add_paragraph(citation)
        
        return doc
    
    async def export_to_latex(self, draft_id, template='ieee'):
        """
        Generate LaTeX document for academic submission
        """
        draft = await self.db.get_draft(draft_id)
        workspace = await self.db.get_workspace(draft['workspace_id'])
        
        # Load template
        if template == 'ieee':
            latex_template = self.load_template('ieee_conference.tex')
        elif template == 'acm':
            latex_template = self.load_template('acm_article.tex')
        
        # Fill in content
        latex_content = latex_template.format(
            title=draft['title'],
            author=workspace['user_name'],
            content=self.markdown_to_latex(draft['content']),
            references=self.generate_latex_bibliography(draft_id)
        )
        
        return latex_content
    
    async def export_to_markdown(self, draft_id):
        """
        Export as clean markdown with links to sources
        """
        draft = await self.db.get_draft(draft_id)
        citations = await self.db.get_draft_citations(draft_id)
        
        # Add citation links
        markdown = draft['content']
        
        # Append references
        markdown += "\n\n## References\n\n"
        for i, citation in enumerate(citations, 1):
            source = await self.db.get_source(citation['source_id'])
            markdown += f"{i}. [{source['title']}]({source.get('url', '#')})\n"
        
        return markdown
    
    async def export_bibtex_bundle(self, workspace_id):
        """
        Export all sources as BibTeX file
        """
        return await self.citation_manager.export_bibtex(workspace_id)
    
    async def generate_literature_review_document(self, workspace_id):
        """
        One-click literature review generation
        Uses agent output + synthesis
        """
        # Run literature review agent if not already done
        agent_output = await self.db.get_latest_agent_output(
            workspace_id,
            'literature_review'
        )
        
        if not agent_output:
            agent = LiteratureReviewAgent(workspace_id, 'literature_review')
            sources = await self.db.get_workspace_sources(workspace_id)
            agent_output = await agent.run({
                'source_ids': [s['id'] for s in sources],
                'focus_area': None
            })
        
        # Format as structured document
        review_doc = {
            'title': f"Literature Review: {workspace['title']}",
            'sections': [
                {
                    'title': 'Overview',
                    'content': agent_output['overview']
                },
                {
                    'title': 'Key Themes',
                    'content': self.format_themes(agent_output['themes'])
                },
                {
                    'title': 'Findings',
                    'content': self.format_findings(agent_output['key_findings'])
                },
                {
                    'title': 'Research Gaps',
                    'content': self.format_gaps(agent_output['research_gaps'])
                },
                {
                    'title': 'References',
                    'content': agent_output['citations']
                }
            ]
        }
        
        # Generate PDF
        pdf = await self.generate_document_pdf(review_doc)
        
        return pdf
    
    async def generate_presentation_summary(self, workspace_id, slide_count=10):
        """
        Generate presentation-ready summary
        """
        workspace = await self.db.get_workspace(workspace_id)
        sources = await self.db.get_workspace_sources(workspace_id)
        
        # Use LLM to extract key points for slides
        slides = []
        
        # Slide 1: Title
        slides.append({
            'title': workspace['research_question'],
            'content': workspace['description']
        })
        
        # Slides 2-3: Background
        background = await self.llm_summarize_for_slides(sources, 'background', 2)
        slides.extend(background)
        
        # Slides 4-7: Key findings
        findings = await self.llm_summarize_for_slides(sources, 'findings', 4)
        slides.extend(findings)
        
        # Slide 8-9: Implications
        implications = await self.llm_summarize_for_slides(sources, 'implications', 2)
        slides.extend(implications)
        
        # Slide 10: Conclusion
        conclusion = await self.llm_summarize_for_slides(sources, 'conclusion', 1)
        slides.extend(conclusion)
        
        # Generate PowerPoint
        pptx = await self.generate_powerpoint(slides)
        
        return pptx
```

---

### K. SECURITY & DATA INTEGRITY (SaaS-Grade)

**Research Data Protection:**
```python
# backend/app/services/research/security.py

class ResearchSecurityService:
    async def isolate_workspace_data(self, workspace_id, user_id):
        """
        Ensure strict data isolation between workspaces
        """
        # Verify user has access to workspace
        access = await self.db.check_workspace_access(workspace_id, user_id)
        if not access:
            raise UnauthorizedError("No access to this workspace")
        
        return access
    
    async def encrypt_sensitive_content(self, content, workspace_id):
        """
        Encrypt research drafts and annotations at rest
        """
        from cryptography.fernet import Fernet
        
        # Get workspace-specific key from key management service
        key = await self.key_management.get_workspace_key(workspace_id)
        cipher = Fernet(key)
        
        encrypted = cipher.encrypt(content.encode())
        return encrypted
    
    async def anonymize_research_data(self, content):
        """
        Remove PII from research content before processing with AI
        """
        # Detect and mask:
        # - Email addresses
        # - Phone numbers
        # - Personal names (if not authors/researchers)
        # - Addresses
        
        anonymized = content
        
        # Email pattern
        anonymized = re.sub(
            r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            '[EMAIL_REDACTED]',
            anonymized
        )
        
        # Phone numbers
        anonymized = re.sub(
            r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
            '[PHONE_REDACTED]',
            anonymized
        )
        
        return anonymized
    
    async def full_workspace_deletion(self, workspace_id, user_id):
        """
        Complete data deletion for GDPR compliance
        """
        # Verify ownership
        workspace = await self.db.get_workspace(workspace_id)
        if workspace['user_id'] != user_id:
            raise UnauthorizedError()
        
        # Delete all related data
        await self.db.delete_workspace_sources(workspace_id)
        await self.db.delete_workspace_annotations(workspace_id)
        await self.db.delete_workspace_drafts(workspace_id)
        await self.db.delete_workspace_citations(workspace_id)
        await self.db.delete_workspace_agent_outputs(workspace_id)
        await self.db.delete_workspace_comparisons(workspace_id)
        await self.db.delete_workspace(workspace_id)
        
        # Remove from vector store
        await self.vector_store.delete_workspace_embeddings(workspace_id)
        
        # Remove from S3/Supabase
        await self.storage.delete_workspace_files(workspace_id)
        
        # Log deletion for audit
        await self.audit_log.log_deletion(workspace_id, user_id)
    
    async def log_access(self, workspace_id, user_id, action):
        """
        Comprehensive access logging
        """
        await self.db.create_access_log({
            'workspace_id': workspace_id,
            'user_id': user_id,
            'action': action,  # view, edit, delete, export, share
            'timestamp': datetime.now(),
            'ip_address': request.remote_addr
        })
    
    async def prevent_training_on_private_data(self):
        """
        Ensure AI models are not trained on user research
        """
        # When calling Groq API, add header to prevent training
        headers = {
            'X-Prevent-Training': 'true',
            'X-Data-Privacy': 'strict'
        }
        # This is a contractual agreement with AI providers
```

**Content Provenance (Blockchain Integration):**
```python
# Optional: Blockchain logging for high-value research

class BlockchainProvenanceService:
    async def register_research_output(self, draft_id, user_id):
        """
        Register research output on blockchain for provenance
        """
        draft = await self.db.get_draft(draft_id)
        
        # Generate content hash
        content_hash = hashlib.sha256(draft['content'].encode()).hexdigest()
        
        # Create blockchain record
        transaction = await self.blockchain_service.create_transaction({
            'type': 'research_output',
            'draft_id': draft_id,
            'user_id': user_id,
            'content_hash': content_hash,
            'timestamp': datetime.now(),
            'metadata': {
                'title': draft['title'],
                'version': draft['version']
            }
        })
        
        # Store transaction hash
        await self.db.update_draft(draft_id, {
            'blockchain_tx': transaction['hash']
        })
        
        return transaction
    
    async def verify_research_integrity(self, draft_id):
        """
        Verify research hasn't been tampered with using blockchain
        """
        draft = await self.db.get_draft(draft_id)
        
        if not draft.get('blockchain_tx'):
            return {'verified': False, 'reason': 'Not registered on blockchain'}
        
        # Compute current hash
        current_hash = hashlib.sha256(draft['content'].encode()).hexdigest()
        
        # Fetch blockchain record
        blockchain_record = await self.blockchain_service.get_transaction(
            draft['blockchain_tx']
        )
        
        original_hash = blockchain_record['content_hash']
        
        return {
            'verified': current_hash == original_hash,
            'original_hash': original_hash,
            'current_hash': current_hash,
            'registered_at': blockchain_record['timestamp']
        }
```

---

## 4. IMPLEMENTATION ROADMAP

### Phase 1: Core Foundation (Weeks 1-3)

**Week 1: Infrastructure**
- Set up PostgreSQL tables for research workspaces, sources, annotations
- Implement FAISS vector store integration
- Create document upload and parsing pipeline
- Build basic workspace CRUD operations

**Week 2: Reading & Annotation**
- Implement PDF viewer component
- Build annotation system (highlight, comment)
- Create annotation storage and retrieval APIs
- Add AI explanation feature for selected text

**Week 3: Basic Synthesis**
- Build research editor with Monaco
- Implement citation insertion
- Create reference list auto-generation
- Add simple export to PDF/DOCX

**Deliverables:**
- Users can create workspaces, upload PDFs, annotate them, and write drafts with citations

---

### Phase 2: AI Intelligence (Weeks 4-6)

**Week 4: Document Intelligence**
- Implement document summarization
- Build method extraction
- Create assumptions detection
- Add limitation analysis

**Week 5: Cross-Document Analysis**
- Implement methodology comparator
- Build conflict detection
- Create consensus identification
- Add gap analysis basic version

**Week 6: First Agent**
- Implement Literature Review Agent
- Build agent execution framework
- Create agent output storage
- Add agent dashboard UI

**Deliverables:**
- AI-powered comprehension features
- Cross-document comparison tools
- Working literature review agent

---

### Phase 3: Advanced Features (Weeks 7-9)

**Week 7: More Agents**
- Implement Gap Detection Agent
- Build Citation Checker Agent
- Create Method Comparator Agent
- Add Hypothesis Challenger Agent

**Week 8: Collaboration**
- Implement workspace sharing
- Build comment threads on annotations
- Create edit suggestions system
- Add notification system

**Week 9: Version Control & Export**
- Implement full version history
- Build diff viewer
- Create all export formats (PDF, DOCX, LaTeX, Markdown)
- Add one-click document generation

**Deliverables:**
- Complete agent suite
- Collaboration features
- Professional export options

---

### Phase 4: Polish & Scale (Weeks 10-12)

**Week 10: Performance Optimization**
- Optimize vector search queries
- Implement caching for LLM responses
- Add lazy loading for large documents
- Optimize database queries

**Week 11: Security & Compliance**
- Implement data encryption
- Build access logging
- Create GDPR compliance tools
- Add blockchain provenance (optional)

**Week 12: Testing & Launch**
- Comprehensive testing
- User acceptance testing
- Documentation
- Beta launch

---

## 5. KEY DIFFERENTIATORS (What Makes This Special)

### vs. ChatGPT
❌ ChatGPT: No structured research workflow, no citation management, no version control
✅ Engunity: Complete research environment with traceability

### vs. Notion AI
❌ Notion: Organization tool with AI chat, no deep document analysis
✅ Engunity: AI agents that actively analyze and compare papers

### vs. Mendeley/Zotero
❌ Mendeley: Citation management only, no AI comprehension
✅ Engunity: AI explains papers, compares methodologies, detects gaps

### vs. Elicit/Semantic Scholar
❌ Elicit: Discovery and summarization, limited synthesis
✅ Engunity: Full research lifecycle from reading to writing

### vs. Perplexity
❌ Perplexity: Search and summarization, no project organization
✅ Engunity: Project-based research with persistent workspaces

---

## 6. SUCCESS METRICS

### Technical Metrics
- **Document Processing**: < 30 seconds for 50-page PDF
- **Vector Search**: < 500ms for semantic queries
- **Agent Execution**: < 2 minutes for literature review of 10 papers
- **Export Generation**: < 10 seconds for 20-page PDF

### User Experience Metrics
- **Time to First Insight**: < 5 minutes from upload to annotation
- **Research Workflow Completion**: < 30 minutes from sources to first draft
- **Citation Accuracy**: > 95% correct formatting
- **Agent Reliability**: > 90% useful outputs

### Business Metrics
- **Adoption**: 60% of users try Research section in first week
- **Retention**: 40% return weekly for research tasks
- **Conversion**: Research features drive 20% of Free → Pro upgrades
- **User Satisfaction**: 4.5/5 rating for Research section

---

## 7. FREEMIUM VS PRO FEATURES

### Free Tier
- 3 active workspaces
- 10 sources per workspace
- Basic annotations
- Standard export (PDF, Markdown)
- 2 agent runs per month
- APA/IEEE citations

### Pro Tier ($20/month)
- Unlimited workspaces
- Unlimited sources
- AI annotations with explanations
- All export formats (including LaTeX)
- Unlimited agent runs
- All citation styles + BibTeX
- Collaboration features
- Version history (unlimited)
- Priority processing

### Edu Tier ($10/month - Students)
- Pro features
- Academic paper templates
- Course-specific research workflows
- Study group collaboration
- Academic integrity tools

---

## 8. CONCLUSION: THE STRATEGIC VISION

The Research section of Engunity AI is not just a feature—**it's the core product differentiator**. While competitors offer fragmented tools (chat here, citations there, notes somewhere else), Engunity provides a **unified research operating system**.

### The Promise to Users

**For Students:**
"Never lose track of your research again. From reading to writing, everything is connected and cited."

**For Researchers:**
"Stop drowning in PDFs. Let AI find patterns, detect gaps, and challenge your hypotheses."

**For Professionals:**
"Turn messy market research into clear, defensible insights with full audit trails."

### Implementation Priority

This is a **Phase 1 feature** because:
1. It directly addresses the core value prop (research assistance)
2. It leverages your existing AI infrastructure (Groq, Phi-2, FAISS)
3. It creates defensible moats (agents, cross-document intelligence)
4. It enables network effects (collaboration, shared workspaces)
5. It drives conversion (Pro features are compelling)

### Next Steps

1. **Week 1**: Build minimum viable workspace + document upload
2. **Week 2**: Implement annotation system
3. **Week 3**: Launch internal beta with 10 users
4. **Week 4-6**: Add AI intelligence layers
5. **Week 7-9**: Deploy agents
6. **Week 10-12**: Polish and public launch

---

**This Research section will be the reason people choose Engunity over every competitor. Build it right, and you'll own the academic/professional research SaaS market.**