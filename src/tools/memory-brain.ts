export interface MemoryBrainParams {
  action: 'store' | 'recall' | 'learn' | 'forget' | 'associate' | 'search_memory';
  key?: string;
  value?: any;
  context?: Record<string, any>;
  query?: string;
  associations?: string[];
  learning_data?: {
    pattern: string;
    outcome: string;
    confidence: number;
  };
  retention_policy?: {
    ttl_hours?: number;
    importance_threshold?: number;
    auto_cleanup?: boolean;
  };
}

export interface MemoryResult {
  action: string;
  success: boolean;
  data?: any;
  associations?: MemoryAssociation[];
  learning_insights?: LearningInsight[];
  memory_stats: MemoryStats;
  recommendations: string[];
  timestamp: string;
}

export interface MemoryAssociation {
  source: string;
  target: string;
  strength: number;
  type: 'semantic' | 'temporal' | 'causal' | 'contextual';
  created_at: string;
}

export interface LearningInsight {
  pattern: string;
  frequency: number;
  success_rate: number;
  confidence: number;
  applications: string[];
}

export interface MemoryStats {
  total_memories: number;
  active_associations: number;
  learned_patterns: number;
  memory_usage_mb: number;
  retrieval_speed_ms: number;
}

// In-memory storage (in production, use persistent database)
class MemoryStore {
  private memories = new Map<string, any>();
  private associations = new Map<string, MemoryAssociation[]>();
  private patterns = new Map<string, LearningInsight>();
  private accessLog = new Map<string, { count: number; lastAccess: Date }>();

  store(key: string, value: any, context: Record<string, any> = {}): void {
    const memory = {
      value,
      context,
      created_at: new Date().toISOString(),
      accessed_count: 0,
      importance: this.calculateImportance(value, context)
    };
    
    this.memories.set(key, memory);
    this.updateAccessLog(key);
    this.createContextualAssociations(key, context);
  }

  recall(key: string): any {
    const memory = this.memories.get(key);
    if (memory) {
      memory.accessed_count++;
      memory.last_accessed = new Date().toISOString();
      this.updateAccessLog(key);
      return memory;
    }
    return null;
  }

  searchMemories(query: string): Array<{ key: string; value: any; relevance: number }> {
    const results: Array<{ key: string; value: any; relevance: number }> = [];
    
    for (const [key, memory] of this.memories.entries()) {
      const relevance = this.calculateRelevance(query, memory);
      if (relevance > 0.3) {
        results.push({ key, value: memory, relevance });
      }
    }
    
    return results.sort((a, b) => b.relevance - a.relevance);
  }

  createAssociation(source: string, target: string, type: string, strength: number): void {
    const association: MemoryAssociation = {
      source,
      target,
      strength,
      type: type as any,
      created_at: new Date().toISOString()
    };
    
    if (!this.associations.has(source)) {
      this.associations.set(source, []);
    }
    this.associations.get(source)!.push(association);
  }

  getAssociations(key: string): MemoryAssociation[] {
    return this.associations.get(key) || [];
  }

  learnPattern(pattern: string, outcome: string, confidence: number): void {
    const existing = this.patterns.get(pattern);
    
    if (existing) {
      existing.frequency++;
      existing.confidence = (existing.confidence + confidence) / 2;
      if (outcome === 'success') {
        existing.success_rate = (existing.success_rate * (existing.frequency - 1) + 1) / existing.frequency;
      } else {
        existing.success_rate = (existing.success_rate * (existing.frequency - 1)) / existing.frequency;
      }
    } else {
      this.patterns.set(pattern, {
        pattern,
        frequency: 1,
        success_rate: outcome === 'success' ? 1 : 0,
        confidence,
        applications: []
      });
    }
  }

  getPatterns(): LearningInsight[] {
    return Array.from(this.patterns.values());
  }

  forget(key: string): boolean {
    const deleted = this.memories.delete(key);
    this.associations.delete(key);
    this.accessLog.delete(key);
    return deleted;
  }

  cleanup(retentionPolicy: any): number {
    let cleaned = 0;
    const now = new Date();
    
    for (const [key, memory] of this.memories.entries()) {
      const age = now.getTime() - new Date(memory.created_at).getTime();
      const ageHours = age / (1000 * 60 * 60);
      
      if (retentionPolicy.ttl_hours && ageHours > retentionPolicy.ttl_hours) {
        if (memory.importance < (retentionPolicy.importance_threshold || 0.5)) {
          this.forget(key);
          cleaned++;
        }
      }
    }
    
    return cleaned;
  }

  getStats(): MemoryStats {
    return {
      total_memories: this.memories.size,
      active_associations: Array.from(this.associations.values()).reduce((sum, arr) => sum + arr.length, 0),
      learned_patterns: this.patterns.size,
      memory_usage_mb: this.estimateMemoryUsage(),
      retrieval_speed_ms: Math.random() * 10 + 5
    };
  }

  private calculateImportance(value: any, context: Record<string, any>): number {
    let importance = 0.5; // Base importance
    
    // Increase importance based on context
    if (context.task_success) importance += 0.3;
    if (context.user_feedback === 'positive') importance += 0.2;
    if (context.frequency_used > 5) importance += 0.2;
    
    // Increase importance for complex data
    if (typeof value === 'object' && Object.keys(value).length > 5) importance += 0.1;
    
    return Math.min(importance, 1.0);
  }

  private updateAccessLog(key: string): void {
    const log = this.accessLog.get(key) || { count: 0, lastAccess: new Date() };
    log.count++;
    log.lastAccess = new Date();
    this.accessLog.set(key, log);
  }

  private createContextualAssociations(key: string, context: Record<string, any>): void {
    // Create associations based on context
    Object.entries(context).forEach(([contextKey, contextValue]) => {
      if (typeof contextValue === 'string') {
        this.createAssociation(key, contextValue, 'contextual', 0.6);
      }
    });
  }

  private calculateRelevance(query: string, memory: any): number {
    const queryLower = query.toLowerCase();
    let relevance = 0;
    
    // Check value content
    const valueStr = JSON.stringify(memory.value).toLowerCase();
    if (valueStr.includes(queryLower)) relevance += 0.8;
    
    // Check context
    const contextStr = JSON.stringify(memory.context).toLowerCase();
    if (contextStr.includes(queryLower)) relevance += 0.6;
    
    // Boost for frequently accessed memories
    if (memory.accessed_count > 5) relevance += 0.2;
    
    return Math.min(relevance, 1.0);
  }

  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage in MB
    const memorySize = JSON.stringify({
      memories: Array.from(this.memories.entries()),
      associations: Array.from(this.associations.entries()),
      patterns: Array.from(this.patterns.entries())
    }).length;
    
    return memorySize / (1024 * 1024); // Convert to MB
  }
}

const memoryStore = new MemoryStore();

export async function memoryBrain(params: MemoryBrainParams): Promise<MemoryResult> {
  const { action, key, value, context = {}, query, associations = [], learning_data, retention_policy } = params;
  
  try {
    let data: any;
    let memoryAssociations: MemoryAssociation[] = [];
    let learningInsights: LearningInsight[] = [];
    
    switch (action) {
      case 'store':
        if (!key || value === undefined) throw new Error('Key and value required for store action');
        memoryStore.store(key, value, context);
        data = { stored: true, key, importance: memoryStore.recall(key)?.importance };
        break;
        
      case 'recall':
        if (!key) throw new Error('Key required for recall action');
        data = memoryStore.recall(key);
        if (data) {
          memoryAssociations = memoryStore.getAssociations(key);
        }
        break;
        
      case 'search_memory':
        if (!query) throw new Error('Query required for search action');
        const searchResults = memoryStore.searchMemories(query);
        data = searchResults;
        break;
        
      case 'associate':
        if (!key || !associations.length) throw new Error('Key and associations required');
        associations.forEach(target => {
          memoryStore.createAssociation(key, target, 'semantic', 0.8);
        });
        memoryAssociations = memoryStore.getAssociations(key);
        data = { associations_created: associations.length };
        break;
        
      case 'learn':
        if (!learning_data) throw new Error('Learning data required');
        memoryStore.learnPattern(learning_data.pattern, learning_data.outcome, learning_data.confidence);
        learningInsights = memoryStore.getPatterns();
        data = { pattern_learned: learning_data.pattern };
        break;
        
      case 'forget':
        if (!key) throw new Error('Key required for forget action');
        const forgotten = memoryStore.forget(key);
        data = { forgotten, key };
        break;
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    // Auto-cleanup if policy specified
    let cleanedCount = 0;
    if (retention_policy?.auto_cleanup) {
      cleanedCount = memoryStore.cleanup(retention_policy);
    }
    
    const memoryStats = memoryStore.getStats();
    const recommendations = generateMemoryRecommendations(memoryStats, action, cleanedCount);
    
    return {
      action,
      success: true,
      data,
      associations: memoryAssociations,
      learning_insights: learningInsights,
      memory_stats: memoryStats,
      recommendations,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    return {
      action,
      success: false,
      data: null,
      associations: [],
      learning_insights: [],
      memory_stats: memoryStore.getStats(),
      recommendations: ['Memory operation failed - check parameters'],
      timestamp: new Date().toISOString()
    };
  }
}

function generateMemoryRecommendations(stats: MemoryStats, action: string, cleanedCount: number): string[] {
  const recommendations: string[] = [];
  
  if (stats.memory_usage_mb > 100) {
    recommendations.push('Consider implementing memory cleanup policies');
  }
  
  if (stats.retrieval_speed_ms > 50) {
    recommendations.push('Memory retrieval is slow - consider indexing optimization');
  }
  
  if (stats.learned_patterns < 10) {
    recommendations.push('Increase learning data to improve pattern recognition');
  }
  
  if (cleanedCount > 0) {
    recommendations.push(`Cleaned ${cleanedCount} old memories to optimize performance`);
  }
  
  if (action === 'recall' && stats.active_associations > 100) {
    recommendations.push('Rich association network detected - consider association-based retrieval');
  }
  
  recommendations.push(`Memory system healthy: ${stats.total_memories} memories, ${stats.learned_patterns} patterns learned`);
  
  return recommendations;
}