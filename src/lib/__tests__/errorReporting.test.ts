import { describe, it, expect, vi } from 'vitest';
import { reportError } from '../errorReporting';

describe('Error Reporting', () => {
  it('should log error message to console.info', () => {
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const error = new Error('Test error');
    
    reportError(error);
    
    expect(consoleSpy).toHaveBeenCalledWith('[ErrorReporting] Reported to stub:', 'Test error');
    consoleSpy.mockRestore();
  });

  it('should log component stack to console.debug if provided', () => {
    const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const error = new Error('Stack error');
    const errorInfo = { componentStack: 'Component -> App -> div' } as any;
    
    reportError(error, errorInfo);
    
    expect(consoleSpy).toHaveBeenCalledWith('[ErrorReporting] Component Stack:', 'Component -> App -> div');
    consoleSpy.mockRestore();
  });
});
