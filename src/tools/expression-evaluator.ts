export interface EvaluateExpressionParams {
  expression: string;
  variables?: Record<string, any>;
  type?: 'math' | 'logic' | 'string' | 'date';
  safe_mode?: boolean;
}

export interface EvaluationResult {
  result: any;
  type: string;
  expression: string;
  variables_used: string[];
  safe: boolean;
}

export function evaluateExpression(params: EvaluateExpressionParams): EvaluationResult {
  const { expression, variables = {}, type = 'math', safe_mode = true } = params;
  
  if (safe_mode && !isSafeExpression(expression)) {
    throw new Error('Unsafe expression detected');
  }
  
  const variablesUsed = extractVariables(expression);
  let result: any;
  
  try {
    switch (type) {
      case 'math':
        result = evaluateMathExpression(expression, variables);
        break;
      case 'logic':
        result = evaluateLogicExpression(expression, variables);
        break;
      case 'string':
        result = evaluateStringExpression(expression, variables);
        break;
      case 'date':
        result = evaluateDateExpression(expression, variables);
        break;
      default:
        result = evaluateMathExpression(expression, variables);
    }
  } catch (error) {
    throw new Error(`Expression evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  return {
    result,
    type: typeof result,
    expression,
    variables_used: variablesUsed,
    safe: safe_mode
  };
}

function isSafeExpression(expression: string): boolean {
  const dangerousPatterns = [
    /require\s*\(/,
    /import\s+/,
    /eval\s*\(/,
    /Function\s*\(/,
    /process\./,
    /global\./,
    /window\./,
    /document\./,
    /__proto__/,
    /constructor/,
    /prototype/,
    /\.\s*\[/,
    /delete\s+/,
    /new\s+/
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(expression));
}

function extractVariables(expression: string): string[] {
  const variablePattern = /\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g;
  const matches = expression.match(variablePattern) || [];
  const keywords = ['true', 'false', 'null', 'undefined', 'Math', 'Date', 'String', 'Number', 'Boolean'];
  return [...new Set(matches.filter(match => !keywords.includes(match)))];
}

function evaluateMathExpression(expression: string, variables: Record<string, any>): number {
  // Replace variables with their values
  let processedExpression = expression;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\b${key}\\b`, 'g');
    processedExpression = processedExpression.replace(regex, String(value));
  });
  
  // Add Math functions support
  processedExpression = processedExpression.replace(/\babs\(/g, 'Math.abs(');
  processedExpression = processedExpression.replace(/\bsin\(/g, 'Math.sin(');
  processedExpression = processedExpression.replace(/\bcos\(/g, 'Math.cos(');
  processedExpression = processedExpression.replace(/\btan\(/g, 'Math.tan(');
  processedExpression = processedExpression.replace(/\bsqrt\(/g, 'Math.sqrt(');
  processedExpression = processedExpression.replace(/\bpow\(/g, 'Math.pow(');
  processedExpression = processedExpression.replace(/\bmax\(/g, 'Math.max(');
  processedExpression = processedExpression.replace(/\bmin\(/g, 'Math.min(');
  processedExpression = processedExpression.replace(/\bround\(/g, 'Math.round(');
  processedExpression = processedExpression.replace(/\bfloor\(/g, 'Math.floor(');
  processedExpression = processedExpression.replace(/\bceil\(/g, 'Math.ceil(');
  
  // Evaluate safely
  try {
    return Function(`"use strict"; return (${processedExpression})`)();
  } catch (error) {
    throw new Error(`Math evaluation failed: ${error instanceof Error ? error.message : 'Invalid expression'}`);
  }
}

function evaluateLogicExpression(expression: string, variables: Record<string, any>): boolean {
  let processedExpression = expression;
  
  // Replace variables
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\b${key}\\b`, 'g');
    const replacement = typeof value === 'string' ? `"${value}"` : String(value);
    processedExpression = processedExpression.replace(regex, replacement);
  });
  
  // Replace logical operators
  processedExpression = processedExpression.replace(/\band\b/g, '&&');
  processedExpression = processedExpression.replace(/\bor\b/g, '||');
  processedExpression = processedExpression.replace(/\bnot\b/g, '!');
  
  try {
    const result = Function(`"use strict"; return (${processedExpression})`)();
    return Boolean(result);
  } catch (error) {
    throw new Error(`Logic evaluation failed: ${error instanceof Error ? error.message : 'Invalid expression'}`);
  }
}

function evaluateStringExpression(expression: string, variables: Record<string, any>): string {
  let result = expression;
  
  // Template string replacement
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
    result = result.replace(regex, String(value));
  });
  
  // String functions
  if (result.includes('upper(')) {
    result = result.replace(/upper\(([^)]+)\)/g, (_, str) => {
      const cleanStr = str.replace(/['"]/g, '');
      return variables[cleanStr] ? String(variables[cleanStr]).toUpperCase() : cleanStr.toUpperCase();
    });
  }
  
  if (result.includes('lower(')) {
    result = result.replace(/lower\(([^)]+)\)/g, (_, str) => {
      const cleanStr = str.replace(/['"]/g, '');
      return variables[cleanStr] ? String(variables[cleanStr]).toLowerCase() : cleanStr.toLowerCase();
    });
  }
  
  if (result.includes('length(')) {
    result = result.replace(/length\(([^)]+)\)/g, (_, str) => {
      const cleanStr = str.replace(/['"]/g, '');
      const value = variables[cleanStr] || cleanStr;
      return String(String(value).length);
    });
  }
  
  if (result.includes('concat(')) {
    result = result.replace(/concat\(([^)]+)\)/g, (_, args) => {
      const argList = args.split(',').map((arg: string) => {
        const cleanArg = arg.trim().replace(/['"]/g, '');
        return variables[cleanArg] || cleanArg;
      });
      return argList.join('');
    });
  }
  
  return result;
}

function evaluateDateExpression(expression: string, variables: Record<string, any>): string {
  let processedExpression = expression;
  
  // Replace variables
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\b${key}\\b`, 'g');
    processedExpression = processedExpression.replace(regex, `"${value}"`);
  });
  
  // Date functions
  if (processedExpression.includes('now()')) {
    return new Date().toISOString();
  }
  
  if (processedExpression.includes('today()')) {
    return new Date().toISOString().split('T')[0];
  }
  
  if (processedExpression.includes('addDays(')) {
    const match = processedExpression.match(/addDays\(([^,]+),\s*(\d+)\)/);
    if (match) {
      const dateStr = match[1].replace(/['"]/g, '');
      const days = parseInt(match[2]);
      const date = new Date(dateStr);
      date.setDate(date.getDate() + days);
      return date.toISOString();
    }
  }
  
  if (processedExpression.includes('format(')) {
    const match = processedExpression.match(/format\(([^,]+),\s*"([^"]+)"\)/);
    if (match) {
      const dateStr = match[1].replace(/['"]/g, '');
      const format = match[2];
      const date = new Date(dateStr);
      
      if (format === 'YYYY-MM-DD') {
        return date.toISOString().split('T')[0];
      } else if (format === 'DD/MM/YYYY') {
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      }
    }
  }
  
  // Try to parse as date
  try {
    const date = new Date(processedExpression.replace(/['"]/g, ''));
    return date.toISOString();
  } catch {
    return processedExpression;
  }
}