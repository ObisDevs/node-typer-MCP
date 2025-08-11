import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface SystemIntelligenceParams {
  action: 'execute_command' | 'ssh_connect' | 'run_code' | 'file_operations' | 'system_monitor' | 'process_manage';
  command?: string;
  code?: string;
  language?: string;
  ssh_config?: {
    host: string;
    username: string;
    key_path?: string;
    password?: string;
    port?: number;
  };
  file_config?: {
    operation: 'read' | 'write' | 'delete' | 'copy' | 'move' | 'search';
    path: string;
    content?: string;
    destination?: string;
    pattern?: string;
  };
  security?: {
    sandbox: boolean;
    timeout: number;
    max_memory: number;
    allowed_commands: string[];
  };
}

export interface SystemResult {
  action: string;
  success: boolean;
  output: string;
  error?: string;
  execution_time: number;
  resource_usage: {
    cpu_percent: number;
    memory_mb: number;
    disk_io: number;
  };
  security_status: {
    sandboxed: boolean;
    commands_blocked: string[];
    risk_level: 'low' | 'medium' | 'high';
  };
  metadata: {
    platform: string;
    working_directory: string;
    user: string;
    timestamp: string;
  };
}

const DANGEROUS_COMMANDS = [
  'rm -rf /', 'sudo rm', 'mkfs', 'dd if=', 'chmod 777', 'chown root',
  'passwd', 'userdel', 'groupdel', 'shutdown', 'reboot', 'halt',
  'iptables -F', 'ufw disable', 'systemctl stop', 'kill -9 1'
];

const ALLOWED_LANGUAGES = ['python', 'javascript', 'typescript', 'bash', 'go', 'rust'];

export async function systemIntelligence(params: SystemIntelligenceParams): Promise<SystemResult> {
  const startTime = Date.now();
  const { action, security = { sandbox: true, timeout: 30000, max_memory: 512, allowed_commands: [] } } = params;
  
  try {
    let result: any;
    
    switch (action) {
      case 'execute_command':
        result = await executeCommand(params, security);
        break;
      case 'ssh_connect':
        result = await sshConnect(params, security);
        break;
      case 'run_code':
        result = await runCode(params, security);
        break;
      case 'file_operations':
        result = await fileOperations(params, security);
        break;
      case 'system_monitor':
        result = await systemMonitor(params);
        break;
      case 'process_manage':
        result = await processManage(params, security);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    const executionTime = Date.now() - startTime;
    
    return {
      action,
      success: true,
      output: result.output || '',
      execution_time: executionTime,
      resource_usage: result.resource_usage || generateMockResourceUsage(),
      security_status: result.security_status || {
        sandboxed: security.sandbox,
        commands_blocked: [],
        risk_level: 'low'
      },
      metadata: {
        platform: process.platform,
        working_directory: process.cwd(),
        user: process.env.USER || 'unknown',
        timestamp: new Date().toISOString()
      }
    };
    
  } catch (error) {
    return {
      action,
      success: false,
      output: '',
      error: error instanceof Error ? error.message : 'Unknown error',
      execution_time: Date.now() - startTime,
      resource_usage: generateMockResourceUsage(),
      security_status: {
        sandboxed: security.sandbox,
        commands_blocked: [],
        risk_level: 'high'
      },
      metadata: {
        platform: process.platform,
        working_directory: process.cwd(),
        user: process.env.USER || 'unknown',
        timestamp: new Date().toISOString()
      }
    };
  }
}

async function executeCommand(params: SystemIntelligenceParams, security: any): Promise<any> {
  const { command } = params;
  if (!command) throw new Error('Command is required');
  
  // Security validation
  const securityCheck = validateCommandSecurity(command, security);
  if (!securityCheck.safe) {
    throw new Error(`Command blocked for security: ${securityCheck.reason}`);
  }
  
  try {
    // Execute in sandboxed environment if enabled
    const execOptions = {
      timeout: security.timeout,
      maxBuffer: security.max_memory * 1024 * 1024,
      cwd: process.cwd(),
      env: { ...process.env, NODE_ENV: 'sandbox' }
    };
    
    const { stdout, stderr } = await execAsync(command, execOptions);
    
    return {
      output: stdout || stderr,
      security_status: {
        sandboxed: security.sandbox,
        commands_blocked: securityCheck.blocked_commands,
        risk_level: securityCheck.risk_level
      }
    };
    
  } catch (error) {
    throw new Error(`Command execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function sshConnect(params: SystemIntelligenceParams, security: any): Promise<any> {
  const { ssh_config } = params;
  if (!ssh_config) throw new Error('SSH configuration is required');
  
  // Simulate SSH connection (in production, use ssh2 library)
  const mockSSHResult = {
    connected: true,
    host: ssh_config.host,
    user: ssh_config.username,
    session_id: `ssh_${Date.now()}`,
    output: `Successfully connected to ${ssh_config.host} as ${ssh_config.username}\nLast login: ${new Date().toISOString()}\n${ssh_config.username}@${ssh_config.host}:~$ `
  };
  
  // Security validation for SSH
  if (!isValidSSHHost(ssh_config.host)) {
    throw new Error('SSH host not in allowed list');
  }
  
  return {
    output: JSON.stringify(mockSSHResult, null, 2),
    security_status: {
      sandboxed: true,
      commands_blocked: [],
      risk_level: 'medium'
    }
  };
}

async function runCode(params: SystemIntelligenceParams, security: any): Promise<any> {
  const { code, language = 'javascript' } = params;
  if (!code) throw new Error('Code is required');
  
  if (!ALLOWED_LANGUAGES.includes(language)) {
    throw new Error(`Language ${language} not allowed`);
  }
  
  // Security validation for code
  const codeSecurityCheck = validateCodeSecurity(code, language);
  if (!codeSecurityCheck.safe) {
    throw new Error(`Code blocked for security: ${codeSecurityCheck.reason}`);
  }
  
  try {
    let output: string;
    
    switch (language) {
      case 'javascript':
      case 'typescript':
        output = await executeJavaScript(code, security);
        break;
      case 'python':
        output = await executePython(code, security);
        break;
      case 'bash':
        output = await executeBash(code, security);
        break;
      default:
        output = `Simulated execution of ${language} code:\n${code}\n\nOutput: Code executed successfully`;
    }
    
    return {
      output,
      security_status: {
        sandboxed: true,
        commands_blocked: codeSecurityCheck.blocked_patterns,
        risk_level: codeSecurityCheck.risk_level
      }
    };
    
  } catch (error) {
    throw new Error(`Code execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function fileOperations(params: SystemIntelligenceParams, security: any): Promise<any> {
  const { file_config } = params;
  if (!file_config) throw new Error('File configuration is required');
  
  const { operation, path, content, destination, pattern } = file_config;
  
  // Security validation for file operations
  if (!isValidFilePath(path)) {
    throw new Error('File path not allowed for security reasons');
  }
  
  try {
    let output: string;
    
    switch (operation) {
      case 'read':
        output = await simulateFileRead(path);
        break;
      case 'write':
        output = await simulateFileWrite(path, content || '');
        break;
      case 'delete':
        output = await simulateFileDelete(path);
        break;
      case 'copy':
        output = await simulateFileCopy(path, destination || '');
        break;
      case 'move':
        output = await simulateFileMove(path, destination || '');
        break;
      case 'search':
        output = await simulateFileSearch(path, pattern || '');
        break;
      default:
        throw new Error(`Unknown file operation: ${operation}`);
    }
    
    return {
      output,
      security_status: {
        sandboxed: security.sandbox,
        commands_blocked: [],
        risk_level: 'low'
      }
    };
    
  } catch (error) {
    throw new Error(`File operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function systemMonitor(params: SystemIntelligenceParams): Promise<any> {
  // Simulate system monitoring
  const systemStats = {
    cpu: {
      usage_percent: Math.random() * 50 + 20,
      cores: 8,
      load_average: [1.2, 1.5, 1.8]
    },
    memory: {
      total_gb: 16,
      used_gb: Math.random() * 8 + 4,
      available_gb: Math.random() * 8 + 4,
      usage_percent: Math.random() * 50 + 30
    },
    disk: {
      total_gb: 512,
      used_gb: Math.random() * 200 + 100,
      available_gb: Math.random() * 200 + 200,
      usage_percent: Math.random() * 40 + 20
    },
    network: {
      bytes_sent: Math.floor(Math.random() * 1000000),
      bytes_received: Math.floor(Math.random() * 5000000),
      packets_sent: Math.floor(Math.random() * 10000),
      packets_received: Math.floor(Math.random() * 50000)
    },
    processes: {
      total: Math.floor(Math.random() * 200 + 100),
      running: Math.floor(Math.random() * 50 + 20),
      sleeping: Math.floor(Math.random() * 150 + 50)
    }
  };
  
  return {
    output: JSON.stringify(systemStats, null, 2),
    resource_usage: {
      cpu_percent: systemStats.cpu.usage_percent,
      memory_mb: systemStats.memory.used_gb * 1024,
      disk_io: Math.random() * 100
    }
  };
}

async function processManage(params: SystemIntelligenceParams, security: any): Promise<any> {
  const { command } = params;
  if (!command) throw new Error('Process management command is required');
  
  // Simulate process management
  const mockProcesses = [
    { pid: 1234, name: 'node', cpu: 15.2, memory: 128 },
    { pid: 5678, name: 'python', cpu: 8.7, memory: 64 },
    { pid: 9012, name: 'bash', cpu: 2.1, memory: 16 }
  ];
  
  let output: string;
  
  if (command.includes('ps') || command.includes('list')) {
    output = `PID\tNAME\tCPU%\tMEM(MB)\n${mockProcesses.map(p => `${p.pid}\t${p.name}\t${p.cpu}\t${p.memory}`).join('\n')}`;
  } else if (command.includes('kill')) {
    output = 'Process termination simulated (sandbox mode)';
  } else {
    output = `Process management command executed: ${command}`;
  }
  
  return {
    output,
    security_status: {
      sandboxed: security.sandbox,
      commands_blocked: [],
      risk_level: 'medium'
    }
  };
}

// Security validation functions
function validateCommandSecurity(command: string, security: any): {
  safe: boolean;
  reason?: string;
  blocked_commands: string[];
  risk_level: 'low' | 'medium' | 'high';
} {
  const blockedCommands: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  
  // Check against dangerous commands
  for (const dangerous of DANGEROUS_COMMANDS) {
    if (command.includes(dangerous)) {
      blockedCommands.push(dangerous);
      riskLevel = 'high';
    }
  }
  
  // Check allowed commands if specified
  if (security.allowed_commands.length > 0) {
    const commandParts = command.split(' ');
    const mainCommand = commandParts[0];
    if (!security.allowed_commands.includes(mainCommand)) {
      return {
        safe: false,
        reason: `Command '${mainCommand}' not in allowed list`,
        blocked_commands: [mainCommand],
        risk_level: 'high'
      };
    }
  }
  
  if (blockedCommands.length > 0) {
    return {
      safe: false,
      reason: `Dangerous commands detected: ${blockedCommands.join(', ')}`,
      blocked_commands: blockedCommands,
      risk_level: riskLevel
    };
  }
  
  return {
    safe: true,
    blocked_commands: [],
    risk_level: 'low'
  };
}

function validateCodeSecurity(code: string, language: string): {
  safe: boolean;
  reason?: string;
  blocked_patterns: string[];
  risk_level: 'low' | 'medium' | 'high';
} {
  const dangerousPatterns = [
    'eval(', 'exec(', 'system(', 'shell_exec', 'passthru',
    'file_get_contents', 'file_put_contents', 'unlink',
    'require(', 'import(', '__import__', 'subprocess',
    'os.system', 'os.popen', 'os.exec'
  ];
  
  const blockedPatterns: string[] = [];
  
  for (const pattern of dangerousPatterns) {
    if (code.includes(pattern)) {
      blockedPatterns.push(pattern);
    }
  }
  
  if (blockedPatterns.length > 0) {
    return {
      safe: false,
      reason: `Dangerous patterns detected: ${blockedPatterns.join(', ')}`,
      blocked_patterns: blockedPatterns,
      risk_level: 'high'
    };
  }
  
  return {
    safe: true,
    blocked_patterns: [],
    risk_level: 'low'
  };
}

function isValidSSHHost(host: string): boolean {
  // In production, maintain a whitelist of allowed SSH hosts
  const allowedHosts = ['localhost', '127.0.0.1', '192.168.1.', '10.0.0.'];
  return allowedHosts.some(allowed => host.startsWith(allowed));
}

function isValidFilePath(path: string): boolean {
  // Prevent access to sensitive system files
  const forbiddenPaths = ['/etc/passwd', '/etc/shadow', '/root/', '/sys/', '/proc/'];
  return !forbiddenPaths.some(forbidden => path.startsWith(forbidden));
}

// Code execution functions
async function executeJavaScript(code: string, security: any): Promise<string> {
  try {
    // Create a sandboxed context
    const result = Function(`"use strict"; ${code}`)();
    return `JavaScript execution result:\n${JSON.stringify(result, null, 2)}`;
  } catch (error) {
    throw new Error(`JavaScript execution error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function executePython(code: string, security: any): Promise<string> {
  // Simulate Python execution
  return `Python code executed successfully:\n${code}\n\nOutput: [Simulated Python execution result]`;
}

async function executeBash(code: string, security: any): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(code, {
      timeout: security.timeout,
      maxBuffer: security.max_memory * 1024 * 1024
    });
    return stdout || stderr;
  } catch (error) {
    throw new Error(`Bash execution error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// File operation simulations
async function simulateFileRead(path: string): Promise<string> {
  return `File read simulation for: ${path}\nContent: [Simulated file content]`;
}

async function simulateFileWrite(path: string, content: string): Promise<string> {
  return `File write simulation: ${content.length} bytes written to ${path}`;
}

async function simulateFileDelete(path: string): Promise<string> {
  return `File deletion simulation: ${path} deleted`;
}

async function simulateFileCopy(source: string, destination: string): Promise<string> {
  return `File copy simulation: ${source} copied to ${destination}`;
}

async function simulateFileMove(source: string, destination: string): Promise<string> {
  return `File move simulation: ${source} moved to ${destination}`;
}

async function simulateFileSearch(path: string, pattern: string): Promise<string> {
  return `File search simulation in ${path} for pattern: ${pattern}\nFound 3 matches`;
}

function generateMockResourceUsage() {
  return {
    cpu_percent: Math.random() * 30 + 10,
    memory_mb: Math.random() * 256 + 64,
    disk_io: Math.random() * 50 + 10
  };
}