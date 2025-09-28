# Database Fix Instructions

## Issues Fixed

This document addresses the following issues found in the error logs:

1. **ReactQuill findDOMNode deprecation warning**
2. **Category creation 400 error in Supabase**
3. **Title translation issue in write article**
4. **Missing article_views table causing 404 errors**

## Solutions Applied

### 1. ReactQuill Warning Fix
- **Issue**: ReactQuill v2.0.0 has compatibility issues with React 18
- **Solution**: Downgraded to ReactQuill v1.3.7 in package.json
- **Action Required**: Run `npm install` to update dependencies

### 2. Database Schema Fixes
- **Issue**: Categories table missing required columns (`name_kn`, `name_en`, etc.)
- **Issue**: Missing `article_views` table for analytics
- **Issue**: Missing proper RLS policies
- **Solution**: Created comprehensive database fix script

### 3. Translation Functions
- **Issue**: Title translation not working properly
- **Solution**: Verified translation functions are correct and working

## Required Actions

### Step 1: Update Dependencies
```bash
npm install
```

### Step 2: Run Database Fix Script
1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `tools/fix-database-issues-simple.sql`
4. Execute the script

**Note**: If you encounter any "relation does not exist" errors, use the simpler script `tools/fix-database-issues-simple.sql` which ensures all required tables exist before creating policies.

### Step 3: Verify Fixes
1. **Test category creation**: Try creating a new category in Admin → Categories
2. **Test article translation**: Try translating an article title and content
3. **Test analytics**: Check if article view tracking works on the home page

## Database Changes Made

The fix script addresses:

1. **Categories Table**:
   - Added `name_en`, `name_kn` columns
   - Added `description`, `description_en`, `description_kn` columns
   - Added `is_active`, `sort_order`, `updated_at` columns
   - Updated existing data to populate new columns
   - Added proper RLS policies

2. **Article Views Table**:
   - Created `article_views` table for analytics
   - Added proper indexes for performance
   - Added RLS policies for public read/admin write

3. **Articles Table**:
   - Ensured all required columns exist
   - Added proper indexes

4. **RSS Feeds Table**:
   - Ensured table exists with correct structure
   - Added proper RLS policies

5. **Media Items Table**:
   - Ensured table exists with correct structure
   - Added proper RLS policies

6. **Article Categories Junction Table**:
   - Ensured table exists with correct structure
   - Added proper RLS policies

## Sample Data Inserted

The script also inserts sample categories:
- Politics (ರಾಜಕೀಯ)
- Sports (ಕ್ರೀಡೆ)
- Technology (ತಂತ್ರಜ್ಞಾನ)
- Entertainment (ಮನರಂಜನೆ)
- World (ಪ್ರಪಂಚ)
- RSS (RSS)

## Verification Steps

After running the fix script, verify:

1. **Categories**: Can create/edit categories without 400 errors
2. **Translation**: Title and content translation works in both directions
3. **Analytics**: Article view tracking works without 404 errors
4. **RSS**: RSS feed import and translation works properly

## Troubleshooting

If you still encounter issues:

1. **Check Supabase logs**: Look for any remaining errors
2. **Verify RLS policies**: Ensure policies are correctly applied
3. **Check user roles**: Ensure admin users have proper role assignments
4. **Test with fresh data**: Try creating new articles/categories

## Notes

- The ReactQuill warning should disappear after running `npm install`
- All database operations should work without errors after running the fix script
- Analytics tracking will start working immediately after the script runs
- Translation functions are already working correctly in the code
