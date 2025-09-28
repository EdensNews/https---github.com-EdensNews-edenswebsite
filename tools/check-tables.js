#!/usr/bin/env node
/*
  Script to check existing table structure in Supabase
*/
/* eslint-env node */

// Load environment variables
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import path from 'path'
import { fileURLToPath } from 'url'

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') })

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkTableStructure() {
  console.log('Checking existing table structure...\n')
  
  // Check categories table structure
  try {
    console.log('Checking categories table structure...')
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log('Error accessing categories table:', error.message, '\n')
    } else {
      if (data && data.length > 0) {
        console.log('Categories table structure:')
        const columns = Object.keys(data[0])
        columns.forEach(col => console.log('  -', col))
        console.log('')
      } else {
        console.log('Categories table is empty\n')
      }
    }
  } catch (err) {
    console.log('Error checking categories table:', err.message, '\n')
  }
  
  // Try to insert a test category to see what columns are required
  try {
    console.log('Testing category insertion...')
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name_en: 'Test Category',
        name_kn: 'ಪರೀಕ್ಷಾ ವರ್ಗ',
        slug: 'test-category',
        description_en: 'Test category description',
        description_kn: 'ಪರೀಕ್ಷಾ ವರ್ಗ ವಿವರಣೆ',
        is_active: true,
        sort_order: 0
      })
      .select()
    
    if (error) {
      console.log('Error inserting test category:', error.message)
      console.log('This indicates the table structure is different from expected\n')
    } else {
      console.log('Successfully inserted test category')
      console.log('Test category data:', data[0])
      
      // Clean up the test category
      if (data && data[0] && data[0].id) {
        await supabase.from('categories').delete().eq('id', data[0].id)
        console.log('Cleaned up test category\n')
      }
    }
  } catch (err) {
    console.log('Error testing category insertion:', err.message, '\n')
  }
  
  console.log('Check completed.')
}

checkTableStructure()