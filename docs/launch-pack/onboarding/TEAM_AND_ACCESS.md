# Team and access

> Status: drafted; owner review pending. Client-facing. Source: `src/lib/auth/roles.ts`, **Settings → People**.

## Inviting someone

1. Go to **Settings → People → Invite someone**. Only a workspace admin can do this.
2. Enter a name and email, choose a role, and optionally add profiles.
3. They choose their own password when they accept. Nobody sets another person's password.
   - The link works once and expires after seven days.
   - If email isn't set up yet, the link is shown on screen for you to send yourself.
4. Pending invitations can be sent again with **Resend**, which stops the old link working, or cancelled with **Revoke**.

## Roles

| Role | Can do |
| --- | --- |
| **Admin** (client admin) | Everything in the workspace: approve ideas, scripts, edits and packaging; edit the Brand Brain and the diagnosis; sign off installation; record proof permissions; connect accounts and publish; manage settings and people; see billing; prepare a data export. |
| **Member** | Contribute: view the workspace, suggest ideas, edit script drafts, record, upload to the Library, complete tasks, read reports and results. Cannot approve work or change settings. |
| **Editor** | Production only: the production board, the Library, tasks, and read access to scripts and the schedule. No strategy or settings. Intended for your own editors. |

## Profiles

Profiles sit on top of a Member's role and add or remove powers:

- **Approver:** can approve ideas, scripts and finished pieces.
- **Commercial:** sees and updates pipeline and results, reads reports, and sees billing.
- **View only:** read-only. Every create, edit, upload and complete power is removed.
- **Contributor:** the default for a member.

Profiles never grant settings or member management. Those stay with admins.

**Who can approve:** admins, plus any member with the Approver profile. The **Approvals** page only offers approval controls to people who can use them.

## Contacts

Each person's menu has **Profiles and contact**, where you set the **Primary contact** and a **Backup contact**. The backup approver is told about approvals that have been waiting three days.

## Secure access

- **Two-factor authentication** is optional for client users. Turn it on under **Account security**:
  1. Add the setup key to an authenticator app.
  2. Enter the code the app shows.
  3. Keep your recovery codes somewhere safe.

  Two-factor is only available once Threadline has configured credential encryption on the live site.
- **Account security** also lists **Where you are signed in**, and can sign out everywhere except this browser.
- **Notifications** are chosen per person, per workspace:
  - never, as it happens, or a daily summary;
  - optional quiet hours and snooze.

  In-app notifications always appear.

## When someone leaves

- **Suspend:** access ends immediately, and their open tasks return to the unassigned queue. **Reinstate** restores it.
- **Remove:** takes them out of the workspace.
- **Make owner** moves ownership to another admin.
- A client admin can never change or remove Threadline staff.
