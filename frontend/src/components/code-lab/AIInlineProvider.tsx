import * as monaco from 'monaco-editor';

export class AIInlineCompletionProvider implements monaco.languages.InlineCompletionsProvider {
  private debounceMs = 300;
  private abortController: AbortController | null = null;

  async provideInlineCompletions(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    context: monaco.languages.InlineCompletionContext,
    token: monaco.CancellationToken
  ): Promise<monaco.languages.InlineCompletions | undefined> {
    // Cancel previous request
    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();

    // Get context
    const textBeforeCursor = model.getValueInRange({
      startLineNumber: Math.max(1, position.lineNumber - 20),
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column
    });

    const textAfterCursor = model.getValueInRange({
      startLineNumber: position.lineNumber,
      startColumn: position.column,
      endLineNumber: Math.min(model.getLineCount(), position.lineNumber + 5),
      endColumn: 1
    });

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/code/ai-inline-complete`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Add auth token if available in localStorage/cookies
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          before: textBeforeCursor,
          after: textAfterCursor,
          language: model.getLanguageId(),
          position: { line: position.lineNumber, column: position.column }
        }),
        signal: this.abortController.signal
      });

      if (!response.ok) return undefined;

      const data = await response.json();

      if (!data.completions || data.completions.length === 0) {
        return undefined;
      }

      return {
        items: data.completions.map((completion: string) => ({
          insertText: completion,
          range: new monaco.Range(
            position.lineNumber,
            position.column,
            position.lineNumber,
            position.column
          ),
          command: {
            id: 'ai-completion-accepted',
            title: 'AI Completion Accepted'
          }
        })),
        enableForwardStability: true
      };

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('AI completion error:', error);
      }
      return undefined;
    }
  }

  freeInlineCompletions() {}
}
