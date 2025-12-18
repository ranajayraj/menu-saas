// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sqiyhgnrtopjvsiizsqy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxaXloZ25ydG9wanZzaWl6c3F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNDA4MDQsImV4cCI6MjA4MTYxNjgwNH0.s99f6CARC65e0c-SQBcQ34I6i5JHFZErF6mIGzrK0mY'

export const supabase = createClient(supabaseUrl, supabaseKey)