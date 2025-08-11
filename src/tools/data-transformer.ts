export interface DataTransformParams {
  data: any;
  from_format: 'json' | 'csv' | 'xml' | 'yaml';
  to_format: 'json' | 'csv' | 'xml' | 'yaml';
  mapping?: Record<string, string>;
}

export function transformData(params: DataTransformParams): { transformed: any; format: string } {
  const { data, from_format, to_format, mapping } = params;
  
  // Parse input data
  let parsed = parseData(data, from_format);
  
  // Apply field mapping if provided
  if (mapping) {
    parsed = applyMapping(parsed, mapping);
  }
  
  // Convert to target format
  const transformed = formatData(parsed, to_format);
  
  return { transformed, format: to_format };
}

function parseData(data: any, format: string): any {
  if (typeof data === 'string') {
    switch (format) {
      case 'json':
        return JSON.parse(data);
      case 'csv':
        return parseCSV(data);
      case 'xml':
        return parseXML(data);
      case 'yaml':
        return parseYAML(data);
      default:
        return data;
    }
  }
  return data;
}

function formatData(data: any, format: string): any {
  switch (format) {
    case 'json':
      return JSON.stringify(data, null, 2);
    case 'csv':
      return formatCSV(data);
    case 'xml':
      return formatXML(data);
    case 'yaml':
      return formatYAML(data);
    default:
      return data;
  }
}

function parseCSV(csv: string): any[] {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const obj: Record<string, any> = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    return obj;
  });
}

function formatCSV(data: any): string {
  if (!Array.isArray(data) || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvLines = [headers.join(',')];
  
  data.forEach(row => {
    const values = headers.map(header => String(row[header] || ''));
    csvLines.push(values.join(','));
  });
  
  return csvLines.join('\n');
}

function parseXML(xml: string): any {
  // Simple XML parser - converts to object structure
  const result: Record<string, any> = {};
  const tagRegex = /<(\w+)>(.*?)<\/\1>/g;
  let match;
  
  while ((match = tagRegex.exec(xml)) !== null) {
    const [, tag, content] = match;
    if (content.includes('<')) {
      result[tag] = parseXML(content);
    } else {
      result[tag] = content;
    }
  }
  
  return result;
}

function formatXML(data: any, rootTag = 'root'): string {
  if (typeof data !== 'object') return `<${rootTag}>${data}</${rootTag}>`;
  
  let xml = `<${rootTag}>`;
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      value.forEach(item => {
        xml += formatXML(item, key);
      });
    } else if (typeof value === 'object') {
      xml += formatXML(value, key);
    } else {
      xml += `<${key}>${value}</${key}>`;
    }
  }
  xml += `</${rootTag}>`;
  
  return xml;
}

function parseYAML(yaml: string): any {
  // Simple YAML parser
  const result: Record<string, any> = {};
  const lines = yaml.split('\n');
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex > 0) {
        const key = trimmed.substring(0, colonIndex).trim();
        const value = trimmed.substring(colonIndex + 1).trim();
        result[key] = isNaN(Number(value)) ? value : Number(value);
      }
    }
  });
  
  return result;
}

function formatYAML(data: any): string {
  if (typeof data !== 'object') return String(data);
  
  let yaml = '';
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'object' && !Array.isArray(value)) {
      yaml += `${key}:\n`;
      for (const [subKey, subValue] of Object.entries(value)) {
        yaml += `  ${subKey}: ${subValue}\n`;
      }
    } else {
      yaml += `${key}: ${value}\n`;
    }
  }
  
  return yaml;
}

function applyMapping(data: any, mapping: Record<string, string>): any {
  if (Array.isArray(data)) {
    return data.map(item => applyMapping(item, mapping));
  }
  
  if (typeof data === 'object' && data !== null) {
    const mapped: Record<string, any> = {};
    for (const [oldKey, value] of Object.entries(data)) {
      const newKey = mapping[oldKey] || oldKey;
      mapped[newKey] = value;
    }
    return mapped;
  }
  
  return data;
}