import { KeyValueItem } from '@/store/useApiStore';

export function resolveVariables(text: string, variables: KeyValueItem[]): string {
  if (!text) return '';
  
  // Convert active variables to map
  const activeVars = variables
    .filter(v => v.enabled && v.key.trim() !== '')
    .reduce((acc, curr) => {
      acc[curr.key.trim()] = curr.value;
      return acc;
    }, {} as Record<string, string>);

  return text.replace(/\{\{(.+?)\}\}/g, (match, key) => {
    const cleanKey = key.trim();
    return activeVars.hasOwnProperty(cleanKey) ? activeVars[cleanKey] : match;
  });
}