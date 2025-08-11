// Additional methods for cognitive-core.ts to avoid file size issues

export interface SelfImprovementResult {
  improved: boolean;
  reasoning: string;
  newTool?: string;
  toolModified?: string;
}

export interface RethinkResult {
  shouldRetry: boolean;
  shouldSkip: boolean;
  newParams: Record<string, any>;
  newReasoning: string;
  skipReason?: string;
}

export class CognitiveMethods {
  static async attemptSelfImprovement(
    task: any, 
    step: any, 
    error: any, 
    improvementEngine: any,
    availableTools: Set<string>
  ): Promise<SelfImprovementResult> {
    try {
      const failureReason = error instanceof Error ? error.message : String(error);
      
      // Analyze what capability is missing
      const analysis = await improvementEngine.analyzeTaskFailure(
        task.description,
        failureReason,
        Array.from(availableTools)
      );
      
      if (!analysis) {
        return { improved: false, reasoning: 'No improvement opportunity identified' };
      }
      
      // Try to create new tool if missing capability identified
      if (analysis.confidence > 0.7) {
        const toolCreated = await improvementEngine.createNewTool(analysis.suggestedTool);
        
        if (toolCreated) {
          availableTools.add(analysis.suggestedTool.name);
          step.tool = analysis.suggestedTool.name;
          
          return {
            improved: true,
            reasoning: `Created new tool '${analysis.suggestedTool.name}' to handle ${analysis.missingCapability}`,
            newTool: analysis.suggestedTool.name
          };
        }
      }
      
      // Try to improve existing tool
      if (availableTools.has(step.tool)) {
        const improvement = this.identifyToolImprovement(failureReason);
        if (improvement) {
          const toolImproved = await improvementEngine.improveTool(step.tool, improvement);
          
          if (toolImproved) {
            return {
              improved: true,
              reasoning: `Improved existing tool '${step.tool}' with ${improvement}`,
              toolModified: step.tool
            };
          }
        }
      }
      
      return { improved: false, reasoning: 'Self-improvement attempt unsuccessful' };
      
    } catch (error) {
      return { 
        improved: false, 
        reasoning: `Self-improvement failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  static identifyToolImprovement(failureReason: string): string | null {
    const lower = failureReason.toLowerCase();
    
    if (lower.includes('timeout') || lower.includes('slow')) {
      return 'optimize_performance';
    }
    
    if (lower.includes('error') || lower.includes('exception')) {
      return 'add_error_handling';
    }
    
    if (lower.includes('debug') || lower.includes('trace')) {
      return 'add_logging';
    }
    
    return null;
  }

  static async autonomousRethink(
    task: any, 
    step: any, 
    error: any, 
    continuousFailures: number
  ): Promise<RethinkResult> {
    const failureReason = error instanceof Error ? error.message : String(error);
    const lower = failureReason.toLowerCase();
    
    // Parameter adjustment strategies
    if (lower.includes('timeout')) {
      return {
        shouldRetry: true,
        shouldSkip: false,
        newParams: { ...step.params, timeout: (step.params.timeout || 5000) * 2 },
        newReasoning: 'Increased timeout due to timeout error'
      };
    }
    
    if (lower.includes('rate limit') || lower.includes('too many requests')) {
      return {
        shouldRetry: true,
        shouldSkip: false,
        newParams: { ...step.params, delay: (step.params.delay || 1000) * 2 },
        newReasoning: 'Added delay due to rate limiting'
      };
    }
    
    if (lower.includes('permission') || lower.includes('unauthorized')) {
      return {
        shouldSkip: true,
        shouldRetry: false,
        newParams: step.params,
        newReasoning: 'Skipped due to permission issues',
        skipReason: 'Insufficient permissions'
      };
    }
    
    if (lower.includes('not found') || lower.includes('404')) {
      return {
        shouldSkip: true,
        shouldRetry: false,
        newParams: step.params,
        newReasoning: 'Skipped due to resource not found',
        skipReason: 'Resource not available'
      };
    }
    
    // Generic retry with modified parameters
    if (continuousFailures < 3) {
      return {
        shouldRetry: true,
        shouldSkip: false,
        newParams: { ...step.params, retry_count: (step.params.retry_count || 0) + 1 },
        newReasoning: `Retry attempt ${continuousFailures + 1} with modified parameters`
      };
    }
    
    return {
      shouldRetry: false,
      shouldSkip: false,
      newParams: step.params,
      newReasoning: 'Maximum retries exceeded, marking as failed'
    };
  }

  static async autoGenerateNextSteps(task: any, completedStep: any): Promise<void> {
    const result = completedStep.result;
    
    // Auto-generate follow-up steps based on results
    if (result && typeof result === 'object') {
      if (result.requires_analysis && !task.steps.some((s: any) => s.tool === 'analytics_brain')) {
        task.steps.push({
          id: `auto_analysis_${Date.now()}`,
          tool: 'analytics_brain',
          params: { action: 'analyze', data: result },
          dependencies: [completedStep.id],
          status: 'pending',
          reasoning: 'Auto-generated analysis step based on previous result'
        });
      }
      
      if (result.needs_verification && !task.steps.some((s: any) => s.tool === 'cognitive_search')) {
        task.steps.push({
          id: `auto_verify_${Date.now()}`,
          tool: 'cognitive_search',
          params: { action: 'fact_check', query: result.content || result.data },
          dependencies: [completedStep.id],
          status: 'pending',
          reasoning: 'Auto-generated verification step for fact-checking'
        });
      }
    }
  }

  static hasIncompleteTasks(task: any): boolean {
    return task.steps.some((step: any) => step.status !== 'completed' && step.status !== 'failed');
  }

  static enrichParams(params: Record<string, any>, task: any): Record<string, any> {
    const enriched = { ...params };
    
    // Replace template variables
    for (const [key, value] of Object.entries(enriched)) {
      if (typeof value === 'string' && value.includes('${')) {
        enriched[key] = this.resolveTemplate(value, task);
      }
    }
    
    return enriched;
  }

  static resolveTemplate(template: string, task: any): string {
    return template.replace(/\$\{([^}]+)\}/g, (match, path) => {
      const parts = path.split('.');
      let value = task;
      
      for (const part of parts) {
        if (part === 'previous') {
          const completedSteps = task.steps.filter((s: any) => s.status === 'completed');
          value = completedSteps[completedSteps.length - 1]?.result;
        } else {
          value = value?.[part];
        }
      }
      
      return value || match;
    });
  }

  static generateNextActions(task: any): string[] {
    const pendingSteps = task.steps.filter((s: any) => s.status === 'pending');
    const failedSteps = task.steps.filter((s: any) => s.status === 'failed');
    
    const actions = [];
    
    if (pendingSteps.length > 0) {
      actions.push(`Execute ${pendingSteps.length} pending steps`);
    }
    
    if (failedSteps.length > 0) {
      actions.push(`Retry or skip ${failedSteps.length} failed steps`);
    }
    
    if (task.status === 'completed') {
      actions.push('Task completed successfully');
    }
    
    return actions;
  }

  static generateReasoning(task: any): string {
    const completed = task.steps.filter((s: any) => s.status === 'completed').length;
    const total = task.steps.length;
    const failed = task.steps.filter((s: any) => s.status === 'failed').length;
    
    let reasoning = `Executed ${completed}/${total} steps`;
    
    if (failed > 0) {
      reasoning += `, ${failed} failed`;
    }
    
    if (task.improvementAttempts > 0) {
      reasoning += `, ${task.improvementAttempts} self-improvements made`;
    }
    
    return reasoning;
  }
}