// We avoid importing monaco-editor directly to prevent SSR issues
// The provider will be instantiated where window/monaco is available

export class AIInlineCompletionProvider {
  private abortController: AbortController | null = null;
  private monaco: any;

  constructor(monaco: any) {
    this.monaco = monaco;
  }

  async provideInlineCompletions(
    model: any,
    position: any,
    context: any,
    token: any
  ): Promise<any | undefined> {
    // Cancel previous request
    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();

    // Get context - surrounding lines
    // Get 20 lines before and 5 lines after
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

    // Combine for context, marking cursor position
    const fullContext = `${textBeforeCursor}<CURSOR>${textAfterCursor}`;

    try {
      // Assuming backend runs on localhost:8000
      const response = await fetch('http://localhost:8000/api/v1/code/ai-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code_context: fullContext,
          language: model.getLanguageId(),
          cursor_line: position.lineNumber,
          cursor_column: position.column
        }),
        signal: this.abortController.signal
      });

      if (!response.ok) return undefined;

      const data = await response.json();

      if (!data.suggestions || data.suggestions.length === 0) {
        return undefined;
      }

      // Map suggestions to Monaco format
      return {
        items: data.suggestions.map((completion: string) => ({
          insertText: completion,
          range: new this.monaco.Range(
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
