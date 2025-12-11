import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'user' | 'admin' | 'moderator';
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface AuditLogEntry {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  expires_at: string;
  ip_address: string | null;
  user_agent: string | null;
  is_active: boolean;
  created_at: string;
}

export const adminService = {
  // User Management
  async getUsers(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getUserById(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) return null;
    return data;
  },

  async updateUserRole(userId: string, role: 'user' | 'admin' | 'moderator'): Promise<void> {
    const { error } = await supabase
      .from('user_profiles')
      .update({ role })
      .eq('id', userId);
    
    if (error) throw error;
  },

  async toggleUserActive(userId: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('user_profiles')
      .update({ is_active: isActive })
      .eq('id', userId);
    
    if (error) throw error;
  },

  // Audit Logs
  async getAuditLogs(limit = 100): Promise<AuditLogEntry[]> {
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  },

  async logAction(action: string, details?: any): Promise<void> {
    const { error } = await supabase
      .from('audit_log')
      .insert([{
        action,
        details,
        user_agent: navigator.userAgent,
        ip_address: await this.getClientIP()
      }]);
    
    if (error) console.error('Failed to log action:', error);
  },

  // Session Management
  async getUserSessions(userId: string): Promise<UserSession[]> {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async revokeSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('id', sessionId);
    
    if (error) throw error;
  },

  // Helper function
  async getClientIP(): Promise<string | null> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return null;
    }
  },

  // Check if user is admin
  async isAdmin(userId: string): Promise<boolean> {
    const user = await this.getUserById(userId);
    return user?.role === 'admin';
  }
};