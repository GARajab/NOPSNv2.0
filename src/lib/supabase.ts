import { createClient } from '@supabase/supabase-js'

// Type assertion for Vite env variables
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://pwdblrbapkbbnfzxumlz.supabase.co'
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3ZGJscmJhcGtiYm5menh1bWx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NzIyMjQsImV4cCI6MjA4MTA0ODIyNH0.XpKqR4UgiLblo6pHnCjLu3SBa6dIVgESSNKM8NMxJt8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)