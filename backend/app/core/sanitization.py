import bleach

def sanitize_html(text: str | None) -> str | None:
    """Sanitize rich text / HTML content, keeping a safe subset of tags (standard bleach default)."""
    if text is None:
        return None
    return bleach.clean(text)

def sanitize_plain_text(text: str | None) -> str | None:
    """Sanitize plain text fields by stripping all HTML tags entirely."""
    if text is None:
        return None
    return bleach.clean(text, tags=[], strip=True)

def sanitize_decision_in(decision_in) -> None:
    """Sanitizes all user-controlled text fields inside a decision input model recursively."""
    if hasattr(decision_in, "title") and decision_in.title is not None:
        decision_in.title = sanitize_plain_text(decision_in.title)
    if hasattr(decision_in, "problem_statement") and decision_in.problem_statement is not None:
        decision_in.problem_statement = sanitize_html(decision_in.problem_statement)
    if hasattr(decision_in, "context") and decision_in.context is not None:
        decision_in.context = sanitize_html(decision_in.context)
    if hasattr(decision_in, "final_decision") and decision_in.final_decision is not None:
        decision_in.final_decision = sanitize_html(decision_in.final_decision)
    if hasattr(decision_in, "rationale") and decision_in.rationale is not None:
        decision_in.rationale = sanitize_html(decision_in.rationale)
        
    if hasattr(decision_in, "options") and decision_in.options is not None:
        for option in decision_in.options:
            if hasattr(option, "label") and option.label is not None:
                option.label = sanitize_plain_text(option.label)
            if hasattr(option, "description") and option.description is not None:
                option.description = sanitize_html(option.description)
            if hasattr(option, "pros") and option.pros is not None:
                option.pros = [sanitize_html(p) for p in option.pros]
            if hasattr(option, "cons") and option.cons is not None:
                option.cons = [sanitize_html(c) for c in option.cons]
            if hasattr(option, "dismissed_reason") and option.dismissed_reason is not None:
                option.dismissed_reason = sanitize_html(option.dismissed_reason)
                
    if hasattr(decision_in, "constraints") and decision_in.constraints is not None:
        for constraint in decision_in.constraints:
            if hasattr(constraint, "description") and constraint.description is not None:
                constraint.description = sanitize_html(constraint.description)
            if hasattr(constraint, "current_status") and constraint.current_status is not None:
                constraint.current_status = sanitize_plain_text(constraint.current_status)
            
    if hasattr(decision_in, "evidence") and decision_in.evidence is not None:
        for item in decision_in.evidence:
            if hasattr(item, "excerpt") and item.excerpt is not None:
                item.excerpt = sanitize_html(item.excerpt)
            
    if hasattr(decision_in, "tags") and decision_in.tags is not None:
        decision_in.tags = [sanitize_plain_text(t) for t in decision_in.tags]

