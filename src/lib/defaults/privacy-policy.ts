/**
 * Default privacy policy template for UniNotepad instances.
 * Loaded during setup wizard and seed if no custom policy is provided.
 * Administrators can edit this at any time via Settings > Legal.
 */
export const DEFAULT_PRIVACY_POLICY = `# Privacy Policy

**Last updated:** ${new Date().toISOString().split("T")[0]}

This Privacy Policy describes how your personal information is collected, used, and shared when you use this UniNotepad instance ("the Platform").

## 1. Information We Collect

### Information You Provide
- **Account information:** Name, email address, student ID, faculty, and programme when you register.
- **Content:** Notes, assignments, forum posts, messages, and other materials you upload or create.
- **AI interactions:** Questions you ask the AI assistant and quiz responses.
- **Tasks and schedules:** Personal tasks and class schedules you create.

### Information Collected Automatically
- **Usage data:** Pages visited, features used, and interaction timestamps.
- **Device information:** Browser type, operating system, and screen resolution.

## 2. How We Use Your Information

We use the information we collect to:
- Provide, maintain, and improve the Platform.
- Authenticate your identity and manage your account.
- Deliver AI-powered learning assistance and personalised quiz content.
- Enable communication between students, lecturers, and administrators.
- Generate anonymised, aggregated analytics for institutional reporting.
- Send important notifications about your account or the Platform.

## 3. Information Sharing

We do **not** sell your personal information. We may share information with:
- **Your institution's administrators** for academic oversight and reporting (aggregated data only).
- **Third-party service providers** that help us operate the Platform (e.g., cloud hosting, AI services, email delivery). These providers only access data necessary to perform their services and are bound by confidentiality obligations.
- **Law enforcement** if required by applicable law.

## 4. Data Retention

- **Account data** is retained while your account is active. You may request account deletion at any time.
- **AI interaction history** is retained for learning continuity and may be deleted by you at any time.
- **Content you upload** is retained until you or an administrator removes it.
- **Deleted accounts** are soft-deleted and permanently purged after 30 days.

## 5. Your Rights

You have the right to:
- **Access** your personal data via the data export feature (Settings > Export My Data).
- **Correct** inaccurate information via your profile settings.
- **Delete** your account and associated data (Settings > Account > Delete Account).
- **Export** your data in JSON or CSV format at any time.
- **Withdraw consent** by closing your account.

## 6. Data Security

We implement appropriate technical and organisational measures to protect your personal information, including:
- Password hashing using bcrypt.
- Session-based authentication.
- Input validation and sanitisation.
- Role-based access controls.
- Audit logging of sensitive operations.

## 7. Children's Privacy

The Platform is intended for university students and staff. We do not knowingly collect personal information from children under 16.

## 8. Changes to This Policy

We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated revision date. Continued use of the Platform after changes constitutes acceptance of the updated policy.

## 9. Contact

If you have questions about this Privacy Policy or wish to exercise your data rights, contact your institution's Platform administrator.
`;
