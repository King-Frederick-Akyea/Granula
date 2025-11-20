# Granula

A simple, collaborative Kanban board that helps teams get work done without the complexity.
Think of it as your team’s digital whiteboard. Organize tasks, track progress, and collaborate in real-time.

## Features

- **Boards, Lists & Cards** – Classic Kanban system
- **Team Collaboration** – Invite teammates and work together
- **Drag & Drop** – Move tasks effortlessly
- **Activity Tracking** – Know exactly what happened and when
- **Real-time Updates** – Everyone stays synced automatically

## Quick Start

1. **Clone and Install**

   ```bash
   git clone <your-repo>
   cd granula
   npm install
   ```

2. **Set Up Environment**

Create a file named `.env.local` and add the following:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
BREVO_API_KEY=your_brevo_key
DEFAULT_FROM_EMAIL=your_email
```

3. **Run the Application**

```bash
npm run dev
```

Then open the application in your browser:

http://localhost:3000

## Troubleshooting

**Emails Not Sending?**

- Verify your Brevo API key in `.env.local`
- Ensure your sender email is verified in Brevo
- Check that your server IP is added to Brevo’s authorized IPs

**Other Issues?**

- Check the terminal for error messages
- Confirm that all environment variables are correctly set
- Make sure your Supabase project is properly configured

## Built With

- **Next.js** – Main framework
- **Supabase** – Database and authentication
- **Tailwind CSS** – Styling
- **Brevo** – Email invites

## Project Structure

`app/` → Main pages and API routes

`components/` → React components

`lib/` → Utilities and Supabase configuration

**Invite flow files:**

- `components/dashboard/InviteMemberModal.tsx`
- `app/api/send-invite/route.ts`

Granula is designed to be simple and reliable. If you run into issues, refer to the troubleshooting section above or contact me.
