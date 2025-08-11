export interface N8NWorkflowParams {
  description: string;
  trigger?: 'webhook' | 'cron' | 'manual';
  nodes?: string[];
}

export interface N8NNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, any>;
}

export interface N8NWorkflow {
  name: string;
  nodes: N8NNode[];
  connections: Record<string, any>;
  active: boolean;
  settings: Record<string, any>;
}

const nodeTemplates: Record<string, Partial<N8NNode>> = {
  webhook: {
    type: 'n8n-nodes-base.webhook',
    typeVersion: 1,
    parameters: { httpMethod: 'POST', path: 'webhook' }
  },
  cron: {
    type: 'n8n-nodes-base.cron',
    typeVersion: 1,
    parameters: { triggerTimes: { hour: 9, minute: 0 } }
  },
  manual: {
    type: 'n8n-nodes-base.manualTrigger',
    typeVersion: 1,
    parameters: {}
  },
  http: {
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 3,
    parameters: { method: 'GET', url: '' }
  },
  code: {
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    parameters: { mode: 'runOnceForAllItems', jsCode: 'return items;' }
  },
  set: {
    type: 'n8n-nodes-base.set',
    typeVersion: 3,
    parameters: { assignments: { assignments: [] } }
  },
  if: {
    type: 'n8n-nodes-base.if',
    typeVersion: 2,
    parameters: { conditions: { options: { caseSensitive: true, leftValue: '', operation: 'equal' } } }
  }
};

export function generateN8NWorkflow(params: N8NWorkflowParams): N8NWorkflow {
  const { description, trigger = 'manual', nodes = [] } = params;
  
  const workflowNodes: N8NNode[] = [];
  const connections: Record<string, any> = {};
  
  // Add trigger node
  const triggerNode: N8NNode = {
    id: 'trigger',
    name: `${trigger.charAt(0).toUpperCase() + trigger.slice(1)} Trigger`,
    ...nodeTemplates[trigger],
    position: [100, 200]
  } as N8NNode;
  
  workflowNodes.push(triggerNode);
  
  // Add requested nodes
  nodes.forEach((nodeType, index) => {
    const template = nodeTemplates[nodeType.toLowerCase()];
    if (template) {
      const node: N8NNode = {
        id: `node_${index}`,
        name: `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} ${index + 1}`,
        ...template,
        position: [300 + (index * 200), 200]
      } as N8NNode;
      
      workflowNodes.push(node);
      
      // Connect to previous node
      const prevNodeId = index === 0 ? 'trigger' : `node_${index - 1}`;
      connections[prevNodeId] = { main: [[{ node: node.id, type: 'main', index: 0 }]] };
    }
  });
  
  // Auto-detect nodes from description
  const autoNodes = detectNodesFromDescription(description);
  autoNodes.forEach((nodeType, index) => {
    if (!nodes.includes(nodeType)) {
      const template = nodeTemplates[nodeType];
      if (template) {
        const nodeIndex = workflowNodes.length - 1;
        const node: N8NNode = {
          id: `auto_${index}`,
          name: `Auto ${nodeType}`,
          ...template,
          position: [300 + (nodeIndex * 200), 200]
        } as N8NNode;
        
        workflowNodes.push(node);
        
        const prevNodeId = workflowNodes[workflowNodes.length - 2]?.id || 'trigger';
        connections[prevNodeId] = { main: [[{ node: node.id, type: 'main', index: 0 }]] };
      }
    }
  });
  
  return {
    name: `Generated: ${description.slice(0, 50)}...`,
    nodes: workflowNodes,
    connections,
    active: false,
    settings: {
      executionOrder: 'v1'
    }
  };
}

function detectNodesFromDescription(description: string): string[] {
  const detected: string[] = [];
  const lower = description.toLowerCase();
  
  if (lower.includes('api') || lower.includes('request') || lower.includes('fetch')) {
    detected.push('http');
  }
  if (lower.includes('code') || lower.includes('javascript') || lower.includes('transform')) {
    detected.push('code');
  }
  if (lower.includes('set') || lower.includes('assign') || lower.includes('variable')) {
    detected.push('set');
  }
  if (lower.includes('if') || lower.includes('condition') || lower.includes('check')) {
    detected.push('if');
  }
  
  return detected;
}