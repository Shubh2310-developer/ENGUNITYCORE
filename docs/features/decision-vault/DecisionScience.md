# Decision Science in Engunity AI: The Adversarial Intelligence Strategy

## 1. Introduction: Beyond Generative AI
Most AI assistants focus on "helpfulness" and "validation." While useful for drafting text, this approach is dangerous for high-stakes decision-making. Cognitive biases—unconscious errors in thinking—often lead users to seek validation for pre-existing conclusions.

The **Decision Vault** implements an **Adversarial Intelligence** layer designed to challenge, rather than confirm, the user's reasoning.

## 2. Targeted Cognitive Biases
Engunity AI's Decision Vault specifically monitors and flags the following biases:

### A. Confirmation Bias & The Missing Option
- **Definition**: The tendency to search for, interpret, and favor information that confirms one's prior beliefs.
- **AI Strategy**: If a user presents only two options (often a "false dilemma"), the AI identifies the binary choice and suggests a third alternative (e.g., "Status Quo" or "Hybrid Approach").
- **Mechanism**: The `missing_option` flag type.

### B. Optimism Bias in Tradeoffs
- **Definition**: The belief that one is at less risk of experiencing a negative event compared to others.
- **AI Strategy**: The system analyzes the "Tradeoff Matrix." If a user scores an option as "High" (5/5) in Performance, Cost, and Complexity simultaneously, the AI flags it as unrealistic.
- **Mechanism**: Backend analysis of the `tradeoffs` JSON object.

### C. Sunk Cost Fallacy
- **Definition**: Continuing an endeavor as a result of previously invested resources (time, money, or effort), even when it is no longer optimal.
- **AI Strategy**: NLP scanning of the "Rationale" and "Context" fields for keywords like "already invested," "spent months," or "cannot waste past effort."
- **Mechanism**: Semantic detection via Groq/Gemini in the `analyze_decision` endpoint.

### D. Confidence Calibration Error
- **Definition**: The mismatch between a person's subjective confidence and their actual objective accuracy.
- **AI Strategy**: The AI compares the "Confidence" slider (Low/Med/High) against the "Evidence" count. High confidence with zero primary sources triggers a critical calibration flag.
- **Mechanism**: Heuristic check in the Decision AI service.

## 3. The Adversarial Prompt Engineering
The backend `DecisionAIService` uses a specialized system prompt to shift the model's persona:

> "You are the Engunity Adversarial AI Reviewer. Your goal is NOT to be helpful, but to be skeptical and challenge the user's reasoning... Be critical. If they only have 2 options, suggest a 3rd."

This ensures that the `analyze_decision` response is focused on friction—the necessary resistance required for sound judgment.

## 4. Evidence Credibility Framework
Decisions in the vault are weighted by their evidence nodes:
1. **Primary**: Raw data, code benchmarks, original research papers.
2. **Secondary**: Summaries, third-party reports, chat sessions.
3. **Anecdotal**: Personal opinions, assumptions.

The goal of the Decision Vault is to move the user's "Evidence Quality" metric (visible in Analytics) toward >70% Primary sources.

## 5. Implementation Summary
The end-to-end loop ensures that every decision logged is pressure-tested:
1. **Input**: User defines a problem and options.
2. **Challenge**: AI returns JSON flags identifying logical gaps.
3. **Refinement**: User addresses flags, increasing the "Stability Score."
4. **Archive**: Decision is locked, creating an immutable history for professional audit (e.g., STAR interviews or ADRs).

---
*Research Paper - Engunity AI Decision Science Team*
