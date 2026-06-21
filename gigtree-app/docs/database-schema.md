# Gigtree Database Schema

Gigtree is a UK-based managed gig marketplace for online and in-person gigs.

The platform uses one account type. Users can apply for gigs immediately, but posting gigs requires admin approval. Workers may apply and work before verification, but payment release requires in-person ID/photo verification. High-trust gigs require verification before applying.

## Core tables

### users

Stores basic account records.

Fields:
- id
- email
- phone
- full_name
- avatar_url
- created_at
- updated_at
- deleted_at
- can_post_gigs
- is_admin

Notes:
- One user account can apply for gigs and request posting access.
- Posting requires admin approval.
- Account deletion should remove user profile data while retaining required financial/legal records for 1 year.

### worker_profiles

Stores worker-facing profile information.

Fields:
- id
- user_id
- bio
- location_area
- remote_available
- in_person_available
- skills
- availability
- experience_summary
- portfolio_links
- cv_file_url
- created_at
- updated_at

Notes:
- CV is visible to admin.
- Posters do not see CVs directly in MVP.
- Worker profiles are not public by default.

### verification_records

Stores worker verification status.

Fields:
- id
- user_id
- status
- verified_in_person
- id_checked
- photo_taken_in_person
- verified_at
- notes
- created_at
- updated_at

Statuses:
- unverified
- pending
- verified
- rejected

Rules:
- Workers can apply to low/medium-trust gigs before verification.
- High-trust gigs require verification before applying.
- Payments cannot be released until verification is complete.

### poster_access_requests

Stores requests to unlock gig posting.

Fields:
- id
- user_id
- contact_name
- contact_email
- contact_phone
- reason_for_posting
- status
- admin_notes
- reviewed_by
- reviewed_at
- created_at

Statuses:
- pending
- approved
- rejected

Rules:
- Admin approval is one-time for the account.
- Once approved, user can post gigs.

### gigs

Stores gig listings.

Fields:
- id
- poster_id
- title
- description
- category
- trust_level
- location_type
- location_area
- exact_location_private
- pay_type
- hourly_rate
- fixed_amount
- currency
- schedule_summary
- requirements
- status
- created_at
- updated_at

Trust levels:
- low
- medium
- high

Location types:
- online
- in_person

Pay types:
- hourly
- fixed

Statuses:
- draft
- open
- filled
- completed
- cancelled
- archived

Rules:
- Public gig pages show approximate location only.
- Exact location/contact is revealed only after controlled acceptance.

### gig_applications

Stores worker applications.

Fields:
- id
- gig_id
- worker_id
- availability_answer
- experience_answer
- requirements_confirmed
- status
- created_at
- updated_at

Statuses:
- submitted
- under_review
- recommended
- not_recommended
- selected_by_poster
- accepted_by_worker
- withdrawn_by_admin
- cancelled_by_admin

Rules:
- Workers cannot withdraw applications directly in MVP.
- Admin controls application removal/cancellation.
- Application form is fixed in MVP.

### admin_recommendations

Stores anonymous recommendation summaries created by admin.

Fields:
- id
- gig_id
- application_id
- anonymous_label
- summary
- fit_notes
- status
- created_by
- created_at
- updated_at

Statuses:
- draft
- sent_to_poster
- selected
- declined

Rules:
- Poster sees anonymous summaries only.
- Name, contact details, photo, and CV stay hidden until the worker confirms after poster selection.

### worker_acceptance_confirmations

Stores worker confirmation after poster selects an anonymous candidate.

Fields:
- id
- gig_id
- application_id
- worker_id
- poster_selected_at
- worker_confirmed_at
- status

Statuses:
- pending_worker_confirmation
- accepted
- declined
- expired

Rules:
- Worker identity/contact is revealed only after worker confirms.

### masked_contacts

Stores temporary masked email/SMS access.

Fields:
- id
- gig_id
- worker_id
- poster_id
- masked_email
- masked_phone
- expires_at
- created_at
- expired_at

Rules:
- Masked contact expires after gig completion/contact period.
- Past poster-worker contact/match history should not be retained after expiry.

### payments

Stores payment state for gigs.

Fields:
- id
- gig_id
- poster_id
- worker_id
- amount_gbp
- commission_amount_gbp
- worker_payout_amount_gbp
- stripe_payment_intent_id
- stripe_transfer_id
- status
- created_at
- updated_at

Statuses:
- pending_payment
- held
- pending_completion
- pending_admin_confirmation
- pending_worker_verification
- ready_for_release
- released
- refunded
- disputed
- cancelled

Rules:
- Poster pays full amount upfront.
- Commission is taken only after successful completion.
- Worker payout is released only after poster and admin confirm completion.
- If worker is unverified, payout waits indefinitely with status pending_worker_verification.

### completion_confirmations

Stores completion confirmation from poster and admin.

Fields:
- id
- gig_id
- poster_confirmed
- poster_confirmed_at
- admin_confirmed
- admin_confirmed_at
- admin_notes
- created_at
- updated_at

Rules:
- Both poster and admin must confirm completion before payout can be released.

### admin_notes

Stores private admin notes and internal ratings.

Fields:
- id
- user_id
- gig_id
- note
- internal_rating
- created_by
- created_at

Rules:
- Internal ratings are only visible to admin.
- They help admin make manual decisions.
- They are not shown to workers or posters.

### legal_financial_records

Stores minimum legal/payment records retained for 1 year.

Fields:
- id
- payment_id
- record_type
- amount_gbp
- user_reference
- created_at
- delete_after

Rules:
- Retain for 1 year.
- Keep separate from user profile and match history.
- Used for tax, accounting, fraud prevention, disputes, and legal compliance.

## MVP privacy rules

- Worker profiles are not public.
- Posters see anonymous admin summaries before selection.
- CVs are admin-only in MVP.
- Contact is masked through email and phone/SMS.
- Masked contact expires after the gig/contact period.
- Completed gig history is not retained on user/admin profiles.
- Poster-worker match history is not retained after contact expiry.
- Minimum financial/legal records are retained for 1 year.

## Version 2 candidates

- Automatic matching
- Public reviews
- Map view
- Push notifications
- Custom application questions
- Referral system
- Public worker profiles
- Subscriptions
