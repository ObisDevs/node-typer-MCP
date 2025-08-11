export interface CognitiveTask {
  id: string;
  description: string;
  steps: TaskStep[];
  context: Record<string, any>;
  status: 'planning' | 'executing' | 'completed' | 'failed' | 'rethinking' | 'self_improving';
  results: Record<string, any>;
  errors: string[];
  retryCount: number;
  maxRetries: number;
  improvementAttempts: number;
}

export interface TaskStep {
  id: string;
  tool: string;
  params: Record<string, any>;
  dependencies: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  reasoning: string;
}

export interface CognitiveResponse {
  taskId: string;
  status: string;
  currentStep?: string;
  progress: number;
  results: Record<string, any>;
  nextActions: string[];
  reasoning: string;
}

import { SelfImprovementEngine, ImprovementAnalysis } from './self-improvement';
import { ToolRegistry } from '../library/tool-registry';
import { CognitiveMethods, SelfImprovementResult, RethinkResult } from './cognitive-core-methods';

export class CognitiveBrain {
  private tasks = new Map<string, CognitiveTask>();
  private availableTools = new Set<string>();
  private autonomousMode = true;
  private contextMemory = new Map<string, any>();
  private improvementEngine = new SelfImprovementEngine();
  private selfImprovementEnabled = true;
  private toolRegistry = new ToolRegistry();

  constructor() {
    this.availableTools = new Set([
      'typewrite', 'infer_type', 'cast_type', 'log_message',
      'generate_n8n_workflow', 'transform_data', 'validate_data',
      'evaluate_expression', 'manage_secrets', 'web_intelligence', 'cognitive_search', 'analytics_brain', 'vision_intelligence', 'orchestrator_brain', 'system_intelligence', 'memory_brain', 'database_intelligence'
    ]);
    
    // Load dynamic tools from registry
    this.loadDynamicTools();
  }

  async planTask(description: string, context: Record<string, any> = {}): Promise<CognitiveResponse> {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const steps = this.decomposeTask(description, context);
    
    const task: CognitiveTask = {
      id: taskId,
      description,
      steps,
      context,
      status: 'planning',
      results: {},
      errors: [],
      retryCount: 0,
      maxRetries: 3,
      improvementAttempts: 0
    };
    
    this.tasks.set(taskId, task);
    
    return {
      taskId,
      status: 'planned',
      progress: 0,
      results: {},
      nextActions: steps.map(s => s.reasoning),
      reasoning: `Decomposed task into ${steps.length} steps based on cognitive analysis`
    };
  }

  async executeTask(taskId: string, toolExecutor: (tool: string, params: any) => Promise<any>): Promise<CognitiveResponse> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);
    
    task.status = 'executing';
    let continuousFailures = 0;
    
    try {
      while (CognitiveMethods.hasIncompleteTasks(task) && continuousFailures < 5) {
        let stepExecuted = false;
        
        for (const step of task.steps) {
          if (step.status === 'completed') continue;
          
          const dependenciesMet = step.dependencies.every(depId => 
            task.steps.find(s => s.id === depId)?.status === 'completed'
          );
          
          if (!dependenciesMet) continue;
          
          step.status = 'running';
          stepExecuted = true;
          
          try {
            const enrichedParams = CognitiveMethods.enrichParams(step.params, task);
            step.result = await toolExecutor(step.tool, enrichedParams);
            step.status = 'completed';
            task.results[step.id] = step.result;
            this.contextMemory.set(`${taskId}_${step.id}`, step.result);
            continuousFailures = 0;
            
            // Auto-generate next steps if needed
            await CognitiveMethods.autoGenerateNextSteps(task, step);
            
          } catch (error) {
            step.error = error instanceof Error ? error.message : 'Unknown error';
            step.status = 'failed';
            continuousFailures++;
            
            // Try self-improvement first
            if (this.selfImprovementEnabled && task.improvementAttempts < 2) {
              const improvementResult = await CognitiveMethods.attemptSelfImprovement(
                task, step, error, this.improvementEngine, this.availableTools
              );
              if (improvementResult.improved) {
                task.improvementAttempts++;
                step.status = 'pending';
                step.reasoning = improvementResult.reasoning;
                continuousFailures = 0;
                continue;
              }
            }
            
            const rethinkResult = await this.autonomousRethink(task, step, error, continuousFailures);
            if (rethinkResult.shouldRetry) {
              step.status = 'pending';
              step.params = rethinkResult.newParams;
              step.reasoning = rethinkResult.newReasoning;
              continuousFailures = Math.max(0, continuousFailures - 1);
            } else if (rethinkResult.shouldSkip) {
              step.status = 'completed';
              step.result = { skipped: true, reason: rethinkResult.skipReason };
              continuousFailures = 0;
            } else {
              task.errors.push(`Step ${step.id} failed: ${step.error}`);
            }
          }
        }
        
        if (!stepExecuted) break;
      }
      
      const completedSteps = task.steps.filter(s => s.status === 'completed').length;
      const progress = (completedSteps / task.steps.length) * 100;
      
      if (completedSteps === task.steps.length) {
        task.status = 'completed';
      } else if (task.errors.length > 0 && task.retryCount >= task.maxRetries) {
        task.status = 'failed';
      }
      
      return {
        taskId,
        status: task.status,
        currentStep: task.steps.find(s => s.status === 'running')?.id,
        progress,
        results: task.results,
        nextActions: CognitiveMethods.generateNextActions(task),
        reasoning: CognitiveMethods.generateReasoning(task)
      };
      
    } catch (error) {
      task.status = 'failed';
      task.errors.push(error instanceof Error ? error.message : 'Task execution failed');
      
      return {
        taskId,
        status: 'failed',
        progress: 0,
        results: task.results,
        nextActions: ['Task failed - consider replanning'],
        reasoning: `Task execution failed: ${task.errors.join(', ')}`
      };
    }
  }

  private decomposeTask(description: string, context: Record<string, any>): TaskStep[] {
    const steps: TaskStep[] = [];
    const lower = description.toLowerCase();
    
    if (lower.includes('web') || lower.includes('fetch') || lower.includes('scrape') || lower.includes('online')) {
      steps.push({
        id: 'web_fetch',
        tool: 'web_intelligence',
        params: { action: 'fetch', query: description, context },
        dependencies: [],
        status: 'pending',
        reasoning: 'Detected need for web data gathering based on keywords'
      });
    }
    
    if (lower.includes('search') || lower.includes('find') || lower.includes('research') || lower.includes('investigate')) {
      steps.push({
        id: 'cognitive_search',
        tool: 'cognitive_search',
        params: { action: 'search', query: description },
        dependencies: [],
        status: 'pending',
        reasoning: 'Detected need for intelligent search and research capabilities'
      });
    }
    
    if (lower.includes('fact') || lower.includes('verify') || lower.includes('truth') || lower.includes('check')) {
      steps.push({
        id: 'fact_check',
        tool: 'cognitive_search',
        params: { action: 'fact_check', query: description },
        dependencies: [],
        status: 'pending',
        reasoning: 'Fact-checking required for information verification'
      });
    }
    
    if (lower.includes('trend') || lower.includes('popular') || lower.includes('trending')) {
      steps.push({
        id: 'trend_analysis',
        tool: 'cognitive_search',
        params: { action: 'trend_analysis', query: description },
        dependencies: [],
        status: 'pending',
        reasoning: 'Trend analysis needed to understand current patterns'
      });
    }
    
    if (lower.includes('analyze') || lower.includes('statistical') || lower.includes('correlation') || lower.includes('data')) {
      steps.push({
        id: 'data_analysis',
        tool: 'analytics_brain',
        params: { action: 'analyze', data: '${previous.result}' },
        dependencies: steps.length > 0 ? [steps[steps.length - 1].id] : [],
        status: 'pending',
        reasoning: 'Statistical analysis required for data insights'
      });
    }
    
    if (lower.includes('forecast') || lower.includes('predict') || lower.includes('future')) {
      steps.push({
        id: 'forecast_analysis',
        tool: 'analytics_brain',
        params: { action: 'forecast', data: '${previous.result}', options: { time_window: '30' } },
        dependencies: steps.length > 0 ? [steps[steps.length - 1].id] : [],
        status: 'pending',
        reasoning: 'Forecasting analysis needed for future predictions'
      });
    }
    
    if (lower.includes('anomaly') || lower.includes('outlier') || lower.includes('unusual')) {
      steps.push({
        id: 'anomaly_detection',
        tool: 'analytics_brain',
        params: { action: 'anomaly_detect', data: '${previous.result}' },
        dependencies: steps.length > 0 ? [steps[steps.length - 1].id] : [],
        status: 'pending',
        reasoning: 'Anomaly detection needed to identify unusual patterns'
      });
    }
    
    if (lower.includes('image') || lower.includes('photo') || lower.includes('picture') || lower.includes('visual')) {
      steps.push({
        id: 'image_analysis',
        tool: 'vision_intelligence',
        params: { action: 'analyze', image_url: '${image_url}', options: { extract_text: true, detect_faces: true } },
        dependencies: [],
        status: 'pending',
        reasoning: 'Image analysis required for visual content understanding'
      });
    }
    
    if (lower.includes('ocr') || lower.includes('text') && (lower.includes('extract') || lower.includes('read'))) {
      steps.push({
        id: 'text_extraction',
        tool: 'vision_intelligence',
        params: { action: 'ocr', image_url: '${image_url}', options: { language: 'en' } },
        dependencies: [],
        status: 'pending',
        reasoning: 'OCR needed to extract text from visual content'
      });
    }
    
    if (lower.includes('chart') || lower.includes('graph') || lower.includes('table')) {
      steps.push({
        id: 'chart_analysis',
        tool: 'vision_intelligence',
        params: { action: 'extract_data', image_url: '${image_url}', options: { analyze_charts: true } },
        dependencies: [],
        status: 'pending',
        reasoning: 'Chart analysis needed to extract structured data from visuals'
      });
    }
    
    if (lower.includes('transform') || lower.includes('convert') || lower.includes('format')) {
      steps.push({
        id: 'data_transform',
        tool: 'transform_data',
        params: { data: '${previous.result}', from_format: 'json', to_format: 'json' },
        dependencies: steps.length > 0 ? [steps[steps.length - 1].id] : [],
        status: 'pending',
        reasoning: 'Data transformation needed for optimal processing'
      });
    }
    
    if (steps.length > 1) {
      steps.push({
        id: 'summary',
        tool: 'log_message',
        params: { message: 'Task completed with cognitive orchestration', level: 'info' },
        dependencies: steps.map(s => s.id),
        status: 'pending',
        reasoning: 'Summary step for cognitive closure and result presentation'
      });
    }
    
    if (steps.length === 0) {
      steps.push({
        id: 'direct_execution',
        tool: 'log_message',
        params: { message: description, level: 'info' },
        dependencies: [],
        status: 'pending',
        reasoning: 'Direct execution as no complex patterns detected'
      });
    }
    
    return steps;
  }

  private enrichParams(params: Record<string, any>, task: CognitiveTask): Record<string, any> {
    const enriched = { ...params };
    
    for (const [key, value] of Object.entries(enriched)) {
      if (typeof value === 'string' && value.includes('${')) {
        const matches = value.match(/\$\{([^}]+)\}/g);
        if (matches) {
          let newValue = value;
          matches.forEach(match => {
            const path = match.slice(2, -1);
            const result = this.getNestedValue(task.results, path);
            newValue = newValue.replace(match, String(result || ''));
          });
          enriched[key] = newValue;
        }
      }
    }
    
    return enriched;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private async autonomousRethink(task: CognitiveTask, step: TaskStep, error: any, failureCount: number): Promise<{
    shouldRetry: boolean;
    shouldSkip: boolean;
    skipReason?: string;
    newParams: Record<string, any>;
    newReasoning: string;
  }> {
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    // Autonomous decision making based on error patterns
    if (failureCount >= 3) {
      // After 3 failures, try alternative approaches
      const alternative = await this.findAlternativeApproach(task, step, errorMsg);
      if (alternative) {
        return {
          shouldRetry: true,
          shouldSkip: false,
          newParams: alternative.params,
          newReasoning: `Autonomous rethink: ${alternative.reasoning}`
        };
      }
      
      // Skip non-critical steps after multiple failures
      if (!this.isCriticalStep(step, task)) {
        return {
          shouldRetry: false,
          shouldSkip: true,
          skipReason: 'Non-critical step skipped after multiple failures',
          newParams: step.params,
          newReasoning: 'Autonomous decision: Skipping to maintain progress'
        };
      }
    }
    
    // Smart parameter adjustment based on error type
    if (errorMsg.includes('parameter required') || errorMsg.includes('missing')) {
      const smartParams = await this.generateSmartParams(step, task, errorMsg);
      return {
        shouldRetry: true,
        shouldSkip: false,
        newParams: smartParams,
        newReasoning: 'Autonomous fix: Generated missing parameters from context'
      };
    }
    
    if (errorMsg.includes('network') || errorMsg.includes('timeout') || errorMsg.includes('fetch')) {
      return {
        shouldRetry: true,
        shouldSkip: false,
        newParams: { ...step.params, timeout: 15000, retries: 3, fallback: true },
        newReasoning: 'Autonomous fix: Enhanced network resilience'
      };
    }
    
    if (errorMsg.includes('format') || errorMsg.includes('parse') || errorMsg.includes('invalid')) {
      return {
        shouldRetry: true,
        shouldSkip: false,
        newParams: { ...step.params, format: 'json', strict: false, fallback: true },
        newReasoning: 'Autonomous fix: Relaxed format constraints'
      };
    }
    
    // Default autonomous retry with progressive simplification
    return {
      shouldRetry: failureCount < 5,
      shouldSkip: false,
      newParams: { ...step.params, simplified: true, autonomous: true },
      newReasoning: `Autonomous retry ${failureCount}/5: Progressive simplification`
    };
  }

  private generateNextActions(task: CognitiveTask): string[] {
    const pendingSteps = task.steps.filter(s => s.status === 'pending');
    const failedSteps = task.steps.filter(s => s.status === 'failed');
    
    const actions: string[] = [];
    
    if (pendingSteps.length > 0) {
      actions.push(`Execute ${pendingSteps.length} pending steps`);
    }
    
    if (failedSteps.length > 0) {
      actions.push(`Rethink ${failedSteps.length} failed steps`);
    }
    
    if (task.status === 'completed') {
      actions.push('Task completed successfully');
    }
    
    return actions;
  }

  private generateReasoning(task: CognitiveTask): string {
    const completed = task.steps.filter(s => s.status === 'completed').length;
    const total = task.steps.length;
    const failed = task.steps.filter(s => s.status === 'failed').length;
    
    let reasoning = `Cognitive analysis: ${completed}/${total} steps completed`;
    
    if (failed > 0) {
      reasoning += `, ${failed} failed (retry count: ${task.retryCount}/${task.maxRetries})`;
    }
    
    if (task.status === 'completed') {
      reasoning += '. Task successfully completed through cognitive orchestration.';
    } else if (task.status === 'failed') {
      reasoning += '. Task failed after cognitive rethinking attempts.';
    } else {
      reasoning += '. Continuing execution with adaptive reasoning.';
    }
    
    return reasoning;
  }

  private hasIncompleteTasks(task: CognitiveTask): boolean {
    return task.steps.some(step => step.status === 'pending' || step.status === 'running');
  }
  
  private async autoGenerateNextSteps(task: CognitiveTask, completedStep: TaskStep): Promise<void> {
    // Auto-generate follow-up steps based on results
    if (completedStep.tool === 'web_intelligence' && completedStep.result?.content) {
      const analysisStep: TaskStep = {
        id: `auto_analysis_${Date.now()}`,
        tool: 'analytics_brain',
        params: { action: 'analyze', data: completedStep.result },
        dependencies: [completedStep.id],
        status: 'pending',
        reasoning: 'Auto-generated: Statistical analysis of web intelligence data'
      };
      task.steps.push(analysisStep);
    }
    
    if (completedStep.tool === 'analytics_brain' && completedStep.result?.results?.descriptive_stats) {
      const correlationStep: TaskStep = {
        id: `auto_correlation_${Date.now()}`,
        tool: 'analytics_brain',
        params: { action: 'correlate', data: completedStep.result.results },
        dependencies: [completedStep.id],
        status: 'pending',
        reasoning: 'Auto-generated: Correlation analysis of statistical results'
      };
      task.steps.push(correlationStep);
    }
    
    if (completedStep.tool === 'vision_intelligence' && completedStep.result?.results?.text) {
      const textAnalysisStep: TaskStep = {
        id: `auto_text_analysis_${Date.now()}`,
        tool: 'analytics_brain',
        params: { action: 'analyze', data: completedStep.result.results.text },
        dependencies: [completedStep.id],
        status: 'pending',
        reasoning: 'Auto-generated: Analysis of extracted text data'
      };
      task.steps.push(textAnalysisStep);
    }
    
    if (completedStep.tool === 'vision_intelligence' && completedStep.result?.results?.charts) {
      const chartDataStep: TaskStep = {
        id: `auto_chart_data_${Date.now()}`,
        tool: 'analytics_brain',
        params: { action: 'analyze', data: completedStep.result.results.charts },
        dependencies: [completedStep.id],
        status: 'pending',
        reasoning: 'Auto-generated: Statistical analysis of chart data'
      };
      task.steps.push(chartDataStep);
    }
    
    if (completedStep.tool === 'cognitive_search' && completedStep.result?.analysis?.fact_check_status === 'disputed') {
      const factCheckStep: TaskStep = {
        id: `auto_factcheck_${Date.now()}`,
        tool: 'cognitive_search',
        params: { action: 'fact_check', query: task.description },
        dependencies: [completedStep.id],
        status: 'pending',
        reasoning: 'Auto-generated: Additional fact-checking due to disputed information'
      };
      task.steps.push(factCheckStep);
    }
  }
  
  private async findAlternativeApproach(task: CognitiveTask, step: TaskStep, errorMsg: string): Promise<{params: any, reasoning: string} | null> {
    // Find alternative tools or approaches
    if (step.tool === 'web_intelligence' && errorMsg.includes('network')) {
      return {
        params: { action: 'search', query: task.description, engines: ['duckduckgo'] },
        reasoning: 'Switched to cognitive_search as alternative to web_intelligence'
      };
    }
    
    if (step.tool === 'cognitive_search' && errorMsg.includes('timeout')) {
      return {
        params: { action: 'fetch', query: task.description, options: { timeout: 5000 } },
        reasoning: 'Switched to web_intelligence with reduced timeout'
      };
    }
    
    return null;
  }
  
  private isCriticalStep(step: TaskStep, task: CognitiveTask): boolean {
    // Determine if step is critical for task completion
    const criticalTools = ['web_intelligence', 'cognitive_search'];
    const dependentSteps = task.steps.filter(s => s.dependencies.includes(step.id));
    
    return criticalTools.includes(step.tool) || dependentSteps.length > 2;
  }
  
  private async generateSmartParams(step: TaskStep, task: CognitiveTask, errorMsg: string): Promise<any> {
    const smartParams = { ...step.params };
    
    // Extract missing parameter from error message
    const paramMatch = errorMsg.match(/([a-zA-Z_]+) parameter required/);
    if (paramMatch) {
      const missingParam = paramMatch[1];
      
      // Generate intelligent defaults based on context
      if (missingParam === 'query' || missingParam === 'description') {
        smartParams[missingParam] = task.description;
      } else if (missingParam === 'action') {
        smartParams[missingParam] = this.inferAction(step.tool, task.description);
      } else if (missingParam === 'data') {
        smartParams[missingParam] = this.findPreviousResult(task, 'data');
      } else {
        smartParams[missingParam] = 'auto-generated';
      }
    }
    
    return smartParams;
  }
  
  private inferAction(tool: string, description: string): string {
    const lower = description.toLowerCase();
    
    if (tool === 'web_intelligence') {
      if (lower.includes('scrape')) return 'scrape';
      if (lower.includes('analyze')) return 'analyze';
      return 'fetch';
    }
    
    if (tool === 'cognitive_search') {
      if (lower.includes('fact')) return 'fact_check';
      if (lower.includes('trend')) return 'trend_analysis';
      return 'search';
    }
    
    return 'default';
  }
  
  private findPreviousResult(task: CognitiveTask, key: string): any {
    for (const [stepId, result] of Object.entries(task.results)) {
      if (result && typeof result === 'object' && result[key]) {
        return result[key];
      }
    }
    return {};
  }
  
  getTask(taskId: string): CognitiveTask | undefined {
    return this.tasks.get(taskId);
  }
  
  setAutonomousMode(enabled: boolean): void {
    this.autonomousMode = enabled;
  }
  
  private loadDynamicTools(): void {
    try {
      const dynamicTools = this.toolRegistry.getAllTools();
      dynamicTools.forEach(tool => {
        this.availableTools.add(tool.name);
      });
    } catch (error) {
      console.warn('Failed to load dynamic tools:', error);
    }
  }
  
  addDynamicTool(toolName: string): void {
    this.availableTools.add(toolName);
  }
}