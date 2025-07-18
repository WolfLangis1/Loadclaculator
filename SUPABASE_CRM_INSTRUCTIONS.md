# Supabase CRM Setup Instructions

This guide walks you through setting up the complete CRM database schema in Supabase for your Load Calculator application.

## Prerequisites

- Supabase project created at [supabase.com](https://supabase.com)
- Supabase URL and anon key configured in your environment variables
- Google OAuth provider enabled in Supabase Auth settings

## Step 1: Access Supabase SQL Editor

1. Go to your Supabase dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **"+ New query"**

## Step 2: Run the Database Setup

1. Open the file `SUPABASE_CRM_SETUP.sql` in this project
2. Copy the entire contents
3. Paste it into the Supabase SQL Editor
4. Click **"RUN"** to execute the script

The script will:
- ✅ Create all CRM tables (customers, stages, projects, activities, tasks)
- ✅ Set up proper indexes for performance
- ✅ Configure Row Level Security (RLS) policies
- ✅ Create helper functions for CRM operations
- ✅ Set up automatic timestamp updating

## Step 3: Verify Installation

After running the script, verify the setup:

1. Go to **Table Editor** in Supabase
2. You should see these new tables:
   - `crm_customers`
   - `crm_stages` 
   - `crm_projects`
   - `crm_activities`
   - `crm_tasks`

## Step 4: Update Your Application

### Switch from Mock to Real CRM Service

Update your API endpoints to use the real CRM service:

1. **Edit each CRM API file** in `/api/`:
   - `crm-customers.js`
   - `crm-stages.js`
   - `crm-projects.js`
   - `crm-activities.js`
   - `crm-tasks.js`
   - `crm-dashboard.js`
   - `crm-pipeline.js`

2. **Replace the import line** in each file:
   ```javascript
   // Change this:
   import { mockCrmService as crmService } from './services/mockCrmService.js';
   
   // To this:
   import { crmService } from './services/crmService.js';
   ```

### Add Service Role Key (Optional)

For enhanced functionality, add your Supabase service role key:

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy the **service_role key** (not the anon key)
3. Add to your environment variables:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

## Step 5: Test the CRM System

1. **Start your application**:
   ```bash
   npm run dev
   ```

2. **Sign in with Google** authentication

3. **Navigate to the CRM tab**

4. **Test functionality**:
   - ✅ Dashboard should load without errors
   - ✅ Default pipeline stages should be created automatically
   - ✅ You can create customers
   - ✅ You can create projects
   - ✅ You can add activities and tasks

## Database Schema Overview

### Tables Created

1. **crm_customers**: Customer contact information and details
2. **crm_stages**: Pipeline stages (Lead, Site Visit, Proposal, etc.)
3. **crm_projects**: Individual electrical projects linked to customers
4. **crm_activities**: Timeline of interactions (calls, emails, site visits)
5. **crm_tasks**: Action items and to-dos

### Key Features

- **Row Level Security**: Users can only see their own data
- **Automatic Timestamps**: `created_at` and `updated_at` fields managed automatically
- **Flexible Schema**: JSON fields for custom data and integrations
- **Performance Optimized**: Proper indexes for fast queries
- **Helper Functions**: Built-in functions for common operations

### Default Pipeline Stages

When a user first accesses the CRM, these stages are automatically created:

1. **Lead** (Red) - Initial contact and qualification
2. **Site Visit** (Orange) - Scheduled site assessment  
3. **Proposal** (Yellow) - Quote prepared and sent
4. **Contracted** (Green) - Project approved and contracted
5. **Completed** (Blue) - Project finished and invoiced

## Advanced Configuration

### Custom Stages

Users can:
- Add new pipeline stages
- Reorder stages via drag-and-drop
- Customize stage colors and descriptions
- Set up stage-based automations (future feature)

### Custom Fields

Each record supports custom fields via JSON columns:
- Customer custom fields
- Project custom fields  
- Activity metadata
- Task metadata

### Integrations

The schema supports external integrations:
- `external_ids` fields for syncing with other systems
- Webhook-ready structure for real-time updates
- Audit trail through activities table

## Troubleshooting

### Common Issues

1. **"Table doesn't exist" errors**:
   - Ensure the SQL script ran completely without errors
   - Check that you ran it on the correct Supabase project

2. **"Permission denied" errors**:
   - Verify Row Level Security policies are correctly applied
   - Check that user is properly authenticated with Supabase

3. **"Cannot insert/update" errors**:
   - Ensure the authenticated user's UUID exists in auth.users
   - Check foreign key constraints (customer must exist before creating project)

### Verification Queries

Run these in SQL Editor to verify setup:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'crm_%';

-- Check RLS policies
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies WHERE tablename LIKE 'crm_%';

-- Test default stages creation (replace with your user ID)
SELECT initialize_default_crm_stages('your-user-uuid-here');
SELECT * FROM crm_stages WHERE user_id = 'your-user-uuid-here';
```

### Getting User ID

To find your authenticated user ID:

```sql
-- Run this while signed into your app
SELECT auth.uid() as my_user_id;
```

## Data Migration

If you need to migrate data from the mock service:

1. Export existing data from localStorage (if using guest mode)
2. Import customers first (they're referenced by projects)
3. Import stages and projects
4. Import activities and tasks last

## Backup and Maintenance

### Regular Backups

Supabase automatically backs up your database, but for additional safety:

1. Go to **Settings** → **Database**
2. Use the backup tools provided
3. Consider setting up automated backups for production

### Performance Monitoring

Monitor your CRM performance:

1. **Database** → **Reports** in Supabase
2. Watch for slow queries
3. Monitor table sizes and growth
4. Optimize based on usage patterns

## Support

If you encounter issues:

1. Check Supabase logs in **Logs** → **Database**
2. Review RLS policies if you get permission errors
3. Ensure proper foreign key relationships
4. Verify environment variables are correctly set

## Next Steps

Once your CRM is set up:

1. **Customize pipeline stages** for your electrical business
2. **Import existing customers** if you have them
3. **Set up integrations** with email or calendar systems
4. **Train your team** on the CRM workflow
5. **Monitor usage** and optimize based on patterns

Your electrical contractor CRM is now ready for production use! 🚀