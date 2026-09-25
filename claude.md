Comprehensive Product Specification

## 1. Executive Summary

This product is a personal professional-content management system designed to solve a specific problem: maintaining a reusable, searchable library of professional achievements and expressing those achievements appropriately across different career directions and individual job applications.

It is deliberately not a CV design/editor tool or a full ATS. Its job is to manage the underlying professional content, relationships, wording variants, reuse, provenance and history.

The central model is:

- Achievement = what I did.
- Master Wording = how I express an Achievement for a target career direction.
- Application Wording = the exact wording used for one specific Job Application.
- Job Type = the target career direction.
- Career Role = a role I previously held.
- Project = work performed within a Career Role.
- Job Application = a specific opportunity/application.
- CV Workspace = the working selection used to assemble a CV.

The system should make it easy to move from raw career evidence to reusable wording and then to exact wording used in specific applications without losing historical context.

## 2. Problem Statement

The current process maintains a master CV for each broad career direction, such as AI Transformation, AI Product Management and Programme Management. For each job application, the relevant master CV is cloned and bullets are tailored.

Tailored changes are currently highlighted in green so they can potentially be reused later. If a tailored change is sufficiently broadly applicable, it is highlighted in red and incorporated into master CV versions.

Over time this creates many master and job-specific CV versions.

Problems include:

1. Difficulty comparing wording across CV versions.
2. Difficulty rediscovering strong wording used previously.
3. The same underlying achievement being expressed differently for different career directions.
4. Difficulty determining exactly what wording was used for a particular application.
5. Difficulty tracing wording back to the underlying achievement and career context.
6. Strong tailored language being lost.
7. Fragmentation of the same achievement across Word documents.
8. No central searchable source of professional achievements.
9. No clean historical record of wording evolution.
10. Difficulty finding a strong example when the user remembers the achievement but not the document in which it appeared.

The new system replaces the green/red Word-based process with a structured workflow:

Master Wording → CV Workspace → Word → Application Wording → optional promotion back to Master.

## 3. Product Vision

Create a trusted personal library of professional achievements in which:

- achievements are stored once;
- career context is structured;
- multiple reusable wordings can coexist;
- wordings can be targeted to different Job Types;
- application-specific wording is preserved;
- historical wording is never silently overwritten;
- CV drafts can be assembled in a Workspace;
- exact Workspace wording is snapshotted;
- final tailored wording can be saved back against the relevant application;
- merged and split bullets are supported;
- search makes prior experience easy to rediscover.

The system should make it easy to answer:

- What have I actually achieved?
- How have I previously described this achievement?
- How have I described it for different Job Types?
- Which version did I use for a particular application?
- Which achievements did I use for a particular application?
- What strong wording have I used in previous applications?
- Which achievements are relevant to a target Job Type but do not yet have suitable Master Wording?
- What Project or Career Role was this achievement associated with?

## 4. Product Principles

### Separate content from wording

An Achievement is not a bullet of text. It is the underlying professional accomplishment. Wording is an expression of that accomplishment.

### Preserve history

Historical wording is valuable content. Do not overwrite old wording when creating an improved version.

### Explicit user control

Automate obvious administrative work but do not make consequential content decisions silently.

- A single obvious matching Master Wording may be selected automatically.
- Multiple relevant wordings require user choice.
- Compound Achievements are never created automatically.
- Uncertain Word-to-Achievement mappings are never silently saved.
- Existing Workspaces never change because a Master Wording changed.

### Word remains the final document editor

Microsoft Word remains responsible for final CV formatting and manual tailoring in the MVP.

### Prefer simple relational structure

Use strong relationships and provenance without unnecessary enterprise complexity. No event sourcing, field-level audit log or elaborate approval system is required.

## 5. Terminology

### Achievement

The underlying professional accomplishment: what I did.

### Master Wording

A reusable expression of an Achievement: how I normally express it for a target career direction.

### Application Wording

The exact wording used for one specific Job Application.

### Job Type

A target career direction, such as AI Transformation, AI Product Management or Programme Management.

### Career Role

A role previously held by the user. Example: AI Transformation Team Lead at ABC Company. This is not a target job role.

### Company

An employer or company associated with a Career Role or Job Application.

### Project

A piece of work undertaken within one Career Role.

### Job Application

A specific application to a Company for a Job Title.

### CV Workspace

A working selection of Achievements and fixed wording snapshots used to prepare a CV.

### Compound Achievement

A new Achievement intentionally created by combining other Achievements.

## 6. Conceptual Model

The primary conceptual flow is:

Company → Career Role → Project → Achievement → Master Wording → CV Workspace Snapshot → Application Wording → Job Application

This is not a strict hierarchy. Relationships are many-to-many where appropriate:

- an Achievement can belong to multiple Projects;
- a Master Wording can target multiple Job Types;
- an Application Wording can represent multiple Achievements;
- an Achievement can have multiple Application Wordings.

The system must support navigation in both directions.

## 7. Company

Fields:

- ID
- Name
- Status
- Created At
- Updated At

Relationships:

- one Company → many Career Roles
- one Company → many Job Applications

## 8. Career Role

A Career Role represents an actual role personally held by the user.

Fields:

- ID
- Company ID
- Title
- Description
- Start Date
- End Date
- Status
- Created At
- Updated At

Relationships:

- belongs to one Company;
- has many Projects.

A Career Role is historical career context, not a target Job Type.

All Career Role fields (including Company) are editable after creation.

## 9. Project

A Project represents work undertaken within a Career Role.

Fields:

- ID
- Career Role ID
- Name
- Description
- Start Date
- End Date
- Status
- Created At
- Updated At

Relationships:

- belongs to exactly one Career Role;
- can have many Achievements;
- an Achievement can belong to multiple Projects.

All Project fields (including Career Role) are editable after creation.

## 10. Achievement

Achievement is the central content entity. It represents an accomplishment independently of the words used to describe it.

Fields:

- ID
- Subject
- Description
- Significance & Impact
- Feedback
- Notes
- Mandatory / Optional
- Status
- Created At
- Updated At

Subject is a short descriptive name, e.g. Enterprise AI Transformation.

Description is a factual explanation of the achievement.

Significance & Impact explains why the achievement is impressive or significant. It can capture scale, complexity, business impact, financial impact, organisational importance, seniority, novelty, differentiation, team size, strategic importance and measurable outcomes.

Feedback captures feedback from others (e.g. mentors, interview panels, stakeholders) on how to present or frame this specific achievement. It is not general career feedback or a catch-all notes field.

Notes is free-text for the user's own reference: anything else worth remembering about the achievement, with no fixed format. It is kept separate from Feedback.

Mandatory / Optional distinguishes essential achievements from content that can be dropped when space is constrained.

## 11. Achievement Classification

Achievement-level metadata includes:

- Competencies
- Direct Job Types
- Ad-hoc Tags
- Projects

These belong to the underlying Achievement rather than individual wordings.

## 12. Competencies

Competencies are controlled classification labels, e.g.:

- AI
- Strategy
- Operations
- Transformation
- Programme Management
- Leadership
- Product Management
- Change Management
- Commercial

An Achievement can have multiple Competencies.

Competencies are searchable and filterable and manageable in Settings.

## 13. Ad-hoc Tags

Tags are flexible user-created labels, e.g.:

- board-level
- quantified
- turnaround
- innovation
- difficult stakeholder
- strong story
- good interview example

Tags are searchable and filterable and do not need to be centrally predefined.

## 14. Job Types

Job Types describe target career directions, e.g.:

- AI Transformation
- AI Product Management
- Programme Management
- Strategy
- Operations

Job Type is not the same as Career Role.

Job Types are managed in Settings and support archive rather than destructive deletion.

## 15. Job Type Inheritance

A key design decision is that Master Wording Job Type associations automatically make the underlying Achievement relevant to those Job Types.

Achievement relevance is:

Direct Achievement Job Types UNION Job Types inherited from Master Wordings.

Example:

Achievement = Enterprise AI Transformation.

Direct Job Types = none.

Master Wording = AI Transformation wording.

Master Wording Job Type = AI Transformation.

Therefore the Achievement is relevant to AI Transformation.

Direct Achievement Job Type tags remain allowed when an Achievement is relevant to a Job Type but there is not yet an appropriate Master Wording.

Only active (non-archived) Master Wordings contribute inherited Job Types.

The union is implemented once, in the database view `achievement_relevant_job_types` (with a `source` column of `direct` or `inherited`). Every screen must read this view rather than re-deriving the union client-side.

## 16. Content Gaps

If an Achievement is relevant to a Job Type but has no Master Wording tagged for that Job Type, show a content gap such as:

Relevant Achievement — no AI Product Management Master Wording

Do not automatically generate wording in the MVP.

## 17. Master Wording

A Master Wording is reusable text associated with one Achievement.

One Achievement can have many Master Wordings.

Example:

Achievement = Enterprise AI Transformation.

Master Wording A — AI Transformation:

Led enterprise AI transformation across 12 business units...

Master Wording B — Programme Management:

Led a cross-functional transformation programme spanning 12 business units...

## 18. Master Wording and Job Types

A Master Wording can have zero, one or many Job Types.

If one wording is equally appropriate to multiple Job Types, use one shared Master Wording record. Do not duplicate it merely to attach it to multiple Job Types.

A Master Wording with no Job Type is valid and should be displayed as Unclassified rather than requiring a fake Generic Job Type.

## 19. Master Wording Versioning

Versioning is intentionally simple.

When wording changes:

- retain the previous version;
- create a new version;
- increment version number;
- preserve timestamps;
- optionally record a short change note.

Historical versions are immutable.

Example:

v1: Led AI transformation across 12 business units...

v2: Led enterprise AI transformation across 12 business units...

v3: Led enterprise AI transformation across 12 business units, establishing...

## 20. Application Wording

Application Wording captures exact wording used for one specific Job Application.

Every Application Wording belongs to exactly one Job Application.

It can be created:

1. from a Master Wording; or
2. from scratch.

If created from a Master Wording, store both the Master Wording ID and the exact Master Wording Version ID.

If created from scratch, the source Master Wording fields are null.

## 21. Application Wording and Achievements

Application Wording has a many-to-many relationship with Achievement.

Normally one Application Wording represents one Achievement.

Merged bullets can represent multiple Achievements.

An Achievement can have multiple Application Wordings.

This supports both merged and split bullet scenarios without corrupting the underlying model.

## 22. Merged Bullets

A merged bullet does not automatically create a Compound Achievement.

Example:

Achievement A = Developed AI strategy.

Achievement B = Led AI transformation programme.

Application Wording:

Led the AI strategy and transformation programme across 12 business units.

This wording can simply reference both Achievements.

The user can explicitly choose to create a Compound Achievement if the combination represents a new reusable accomplishment.

Therefore:

Merged Application Wording ≠ automatically Compound Achievement.

## 23. Split Bullets

One Achievement can be expressed through multiple Application Wordings.

Example:

Achievement = Enterprise AI Transformation.

Application Wording 1:

Led the enterprise AI strategy...

Application Wording 2:

Built cross-functional transformation governance...

Both remain linked to the same Achievement. No duplicate Achievement is created.

## 24. Compound Achievement

A Compound Achievement is a genuinely new Achievement record, created explicitly by the user.

Example:

Achievement A = Developed AI strategy.

Achievement B = Led AI transformation programme.

New Compound Achievement = AI Strategy & Transformation.

The Compound Achievement gets its own:

- Subject
- Description
- Significance & Impact
- Feedback
- Mandatory/Optional
- Competencies
- Job Type relevance
- Tags
- Projects
- Master Wordings
- Application Wordings
- history

The component Achievements remain unchanged.

## 25. Nested Compound Achievements

A Compound Achievement may contain normal Achievements and other Compound Achievements.

Nested compounds are allowed.

Circular references are prohibited. The system must prevent:

- self-reference;
- indirect cycles such as A → B → C → A.

Enforcement:

- self-reference is rejected in the database by a CHECK constraint on `compound_achievement_components`;
- indirect cycles are checked in the application before insert (`src/lib/compoundCycles.ts`) by walking the component graph, which is small enough to traverse directly. No database-level graph constraint is used.

## 26. Job Application

A Job Application represents one specific application.

Fields:

- ID
- Company
- Job Title
- Date Applied
- Job Type
- Job Posting URL
- Status
- Created At
- Updated At

Do not add a Job Description field to the MVP. This is not a full ATS.

## 27. CV Workspace

CV Workspace is a core feature for assembling a CV before final formatting/tailoring in Word.

Fields/concepts:

- Name
- Target Job Type
- Optional Job Application
- Status
- Selected Achievements
- Selected wording snapshots
- Ordering

A Workspace can exist without a Job Application or link to exactly one Job Application.

## 28. Workspace without Application

Example:

AI Transformation CV — September 2026

This is a reusable targeted CV draft without being tied to a particular application.

## 29. Workspace linked to Application

Example:

Google — AI Transformation Lead

Target Job Type:

AI Transformation

Job Application:

Google — AI Transformation Lead

The Workspace-to-Application relationship is optional and primarily one Workspace → zero or one Job Application.

## 30. Workspace Snapshot Principle

When a Master Wording is selected in a Workspace, the Workspace stores the exact selected wording as a snapshot.

If Master Wording v2 is selected and later becomes v3, the existing Workspace continues to contain v2.

It must not silently change.

The user can explicitly replace the Workspace wording with another version.

This protects CV drafts from unexpected library changes.

## 31. Selecting Wording in a Workspace

When adding an Achievement:

- If exactly one obvious matching Master Wording exists, automatically select it.
- If multiple matching Master Wordings exist, ask the user to choose.
- Also expose other Master Wordings, prior Application Wordings and unclassified Master Wordings where useful.

Prior Application Wordings are inspiration/alternatives; they remain Application Wordings unless explicitly promoted.

## 32. Workspace Ordering

Selected Achievements must be reorderable. Persist the ordering.

Each Workspace item should display:

- sequence number;
- Achievement;
- Mandatory/Optional;
- selected wording;
- source;
- controls to change, remove or view.

## 33. Copy-to-Word Workflow

MVP workflow:

1. Create Workspace.
2. Set target Job Type.
3. Optionally link Job Application.
4. Add relevant Achievements.
5. Select wording.
6. Reorder.
7. Copy selected wording.
8. Paste into Microsoft Word.
9. Format CV in Word.
10. Tailor wording manually.
11. Return to the application.
12. Save final tailored wording as Application Wordings.

Normal clipboard output is clean CV bullet text without IDs or metadata.

## 34. Manual Save-Back

The primary MVP save-back mechanism is manual.

From the Workspace, choose Save as Application Wording.

The system pre-populates where possible:

- Achievement;
- Job Application;
- selected Master Wording;
- exact source Master Wording version.

The user enters the final tailored wording.

If the bullet represents multiple Achievements, multiple Achievements can be selected.

## 35. Word Import

Automatic Word parsing is not required for the MVP.

The system must not depend on .docx parsing because users may reorder, merge, split, rewrite or copy/paste bullets.

The reliable MVP workflow is explicit save-back from the Workspace.

## 36. Optional Assisted Matching

A later enhancement may allow pasted tailored bullets to be matched against the current Workspace's Achievements.

The system can suggest:

Achievement = Enterprise AI Transformation

Confidence = High

The user must confirm. Uncertain matches must never be silently saved.

## 37. Application Wording Versioning

Application Wordings are historical snapshots.

If an Application Wording changes:

- preserve prior version;
- create a new version;
- retain original text.

The system must always be able to answer:

What did I actually write at the time?

## 38. Promotion from Application to Master

An Application Wording can be promoted to a reusable Master Wording.

Promotion:

1. creates a new Master Wording version/record;
2. preserves the Application Wording;
3. preserves its history;
4. retains provenance.

The user selects applicable Job Types.

An existing Master Wording is never overwritten by promotion.

## 39. Replacement of Green/Red Process

Old process:

Master CV → tailor → green change → potentially red change → update master CV.

New process:

Master Wording → CV Workspace → Word → tailored wording → Application Wording → optionally Promote to Master.

This makes reuse explicit and preserves history.

## 40. Achievement Library UX

Use one row per Achievement with expandable Master Wordings.

Example:

Enterprise AI Transformation

ID: gp561y

Mandatory

Job Types: AI Transformation, Programme Management

Competencies: AI, Strategy, Transformation

Expanded:

Master Wordings

AI Transformation

Led enterprise AI transformation across...

Programme Management

Led cross-functional programme to...

Do not create a separate top-level library row for every wording.

## 41. Achievement Search

Search across:

- Subject
- Description
- Significance & Impact
- Feedback
- Notes
- Master Wording text
- Application Wording text
- Tags
- Competencies
- Project
- Career Role
- Company

Filters:

- Job Type
- Competency
- Project
- Company
- Career Role
- Mandatory/Optional
- Tags
- Active/Archived
- Has Master Wording
- Has Application Wording
- Workspace usage

Search exists both for retrieval and inspiration.

## 42. Achievement Detail Page

Show:

1. Header: Subject, ID, status, Edit, Archive.
2. Career Context: Company, Career Role, Projects.
3. Achievement information: Description, Significance & Impact, Feedback, Notes.
4. Classification: Competencies, direct Job Types, inherited Job Types, Tags.
5. Master Wordings with versions.
6. Application Wordings with Application, Company, Job Title, Date Applied, exact wording and source Master Wording/version.
7. Compound relationships.
8. Usage in Workspaces and Applications.

## 43. Applications

List:

- Company
- Job Title
- Job Type
- Date Applied
- Status
- Application Wording count
- linked Workspace

Detail:

- application metadata;
- Application Wordings;
- linked Achievements;
- source Master Wordings;
- versions;
- Workspace.

Optionally show similar applications by Job Type for inspiration. This is retrieval, not AI recommendation.

## 44. Projects

List:

- Project
- Career Role
- Company
- Achievement count
- Edit and Archive/Restore controls

Each Project row is expandable inline to list its linked Achievements. Each item shows only the Achievement Subject plus Mandatory and Archived badges (no Description), and links to the Achievement detail page. The Include Archived toggle applies to both the Projects and their listed Achievements.

Detail:

- Project Name
- Description
- Career Role
- Company
- linked Achievements

## 45. Career

Show:

Company → Career Role → Projects → Achievements

This provides historical context for Achievements.

Career Roles and Projects can be created and edited from here.

## 46. Settings

Manage:

- Job Types: create, rename, archive.
- Competencies: create, rename, archive.
- Tags: dynamically user-created.

## 47. Archiving

Use soft archiving for:

- Achievements
- Master Wordings
- Applications
- Workspaces
- Companies
- Career Roles
- Projects
- Job Types
- Competencies

Archived records are normally excluded from active views. Provide Include Archived for retrieval. Historical relationships remain intact.

## 48. IDs

Every core entity has a stable unique ID.

Achievement IDs should be visible in the library and detail page.

Do not depend on IDs embedded in Word documents.

## 49. Database Model

Recommended relational schema:

companies:

- id
- name
- status
- created_at
- updated_at

career_roles:

- id
- company_id
- title
- description
- start_date
- end_date
- status
- created_at
- updated_at

projects:

- id
- career_role_id
- name
- description
- start_date
- end_date
- status
- created_at
- updated_at

achievements:

- id
- subject
- description
- significance_impact
- feedback
- notes (added in migration 0003)
- mandatory
- status
- created_at
- updated_at

achievement_projects:

- achievement_id
- project_id

job_types:

- id
- name
- status
- created_at
- updated_at

achievement_job_types:

- achievement_id
- job_type_id

Inherited Job Types are derived from Master Wording relationships rather than duplicated here. See the `achievement_relevant_job_types` view (§15).

competencies:

- id
- name
- status

achievement_competencies:

- achievement_id
- competency_id

tags:

- id
- name

achievement_tags:

- achievement_id
- tag_id

master_wordings:

- id
- achievement_id
- current_version_id
- status
- created_at
- updated_at

master_wording_versions:

- id
- master_wording_id
- version_number
- text
- change_note
- created_at

master_wording_job_types:

- master_wording_id
- job_type_id

job_applications:

- id
- company_id
- job_title
- job_type_id
- date_applied
- job_posting_url
- status
- created_at
- updated_at

application_wordings:

- id
- job_application_id
- current_version_id
- source_master_wording_id nullable
- source_master_wording_version_id nullable
- status
- created_at
- updated_at

application_wording_versions:

- id
- application_wording_id
- version_number
- text
- created_at

application_wording_achievements:

- application_wording_id
- achievement_id
- display_order

cv_workspaces:

- id
- name
- job_type_id
- job_application_id nullable
- status
- created_at
- updated_at

cv_workspace_achievements:

- id
- workspace_id
- achievement_id
- selected_master_wording_id nullable
- selected_master_wording_version_id nullable
- snapshot_text
- display_order
- created_at
- updated_at

compound_achievement_components:

- compound_achievement_id
- component_achievement_id
- display_order

Self-reference is blocked by a CHECK constraint; indirect cycles are checked in the application (§25).

## 50. Workspace Snapshot Data Model

snapshot_text is essential.

Do not rely solely on selected_master_wording_id because Master Wording can change later.

Store both provenance and snapshot:

- which Master Wording/version was selected;
- exactly what text the Workspace contained.

## 51. Application Provenance

Application Wording created from a Master Wording must store:

- Master Wording ID;
- exact Master Wording Version ID.

It must never simply point to the current Master Wording.

## 52. Versioning Summary

Master Wording:

- editing creates a new version.

Application Wording:

- editing creates a new version/snapshot.

Workspace:

- stores a fixed wording snapshot.

Achievement metadata:

- does not require elaborate versioning in the MVP.

## 53. Main Navigation

Primary navigation:

- CV Workspaces
- Achievements
- Applications
- Projects
- Career
- Settings

CV Workspaces and Achievements should receive the greatest prominence.

## 54. Home/Dashboard

Keep the dashboard lightweight.

Useful information:

- Active Workspaces
- Active Achievements
- Mandatory Achievements
- Optional Achievements
- Master Wordings
- Recent Applications
- Content gaps

Avoid excessive analytics.

## 55. Key Workflows

### Capture a new Achievement

Create Achievement, add context, description, significance, evidence, classification and project links, then add Master Wordings.

### Build a targeted CV

Create Workspace, select Job Type, search/filter Achievements, add relevant Achievements, select appropriate Master Wordings, reorder, copy to Word.

### Tailor for an application

Link Workspace to Job Application, copy to Word, tailor manually, return and save final wording as Application Wordings.

### Reuse previous application wording

Search Achievement, review prior Application Wordings, use them as inspiration or basis for new wording while preserving historical application context.

### Improve Master Wording

Edit Master Wording, create new version. Existing Workspaces and Applications remain unchanged.

### Promote successful application wording

Promote Application Wording to new Master Wording version, select Job Types, preserve original Application Wording.

### Create Compound Achievement

Create new Achievement, select components, validate no cycles, save and use like any other Achievement.

## 56. Key Product Decisions and Rationale

### Achievement rather than Bullet

The underlying unit is an Achievement because wording varies independently of the accomplishment.

### Shared Master Wording across Job Types

One wording may genuinely work for multiple target directions, so duplication is unnecessary.

### Job Type inheritance

Reduces redundant tagging and supports content-gap discovery.

### Application Wording belongs to one Job Application

Preserves exact historical context.

### Application Wording is a snapshot

The system must preserve what was actually used.

### Workspace uses snapshots

A CV draft must not change unexpectedly when the content library changes.

### Manual Word workflow

Word documents are flexible and unreliable as the primary source of mapping; explicit save-back is safer.

### Merged bullet does not automatically mean Compound Achievement

Not every one-off combination should become a reusable new Achievement.

### Split bullet does not create duplicate Achievements

Wording structure should not corrupt the underlying professional-content model.

### Compound Achievement is a new record

An intentional reusable combination represents a genuinely new Achievement.

### Nested compounds are allowed

Useful for composition, provided cycles are prevented.

### Promotion creates a new Master Wording version

Historical content must never be overwritten.

### No fake Generic Job Type

Unclassified Master Wordings are valid.

### Soft archive

The system is built around reuse and historical context, so destructive deletion is inappropriate.

## 57. End-to-End Example

Career history:

Company = ABC Corp.

Career Role = AI Transformation Team Lead.

Project = Enterprise AI Transformation.

Achievement = Enterprise AI Transformation.

Significance:

Enterprise-wide programme across 12 business units with senior executive sponsorship.

Master Wording — AI Transformation:

Led enterprise AI transformation across 12 business units, establishing...

Master Wording — Programme Management:

Led a cross-functional transformation programme spanning 12 business units...

Workspace:

Google — AI Transformation Lead.

Target Job Type = AI Transformation.

The system finds one matching Master Wording, selects it automatically and stores a snapshot.

The user copies it to Word and edits it to:

Led enterprise AI transformation across 12 business units, establishing a new governance model that accelerated adoption...

The user returns to the system and creates an Application Wording for:

Google — AI Transformation Lead.

The system records:

- Achievement = Enterprise AI Transformation
- Source Master Wording = AI Transformation
- Source Master Wording Version = exact version used
- final Application Wording = tailored text
- Job Application = Google

Later, the user applies to Microsoft and searches the Achievement. The previous Google wording is available as inspiration, but a new Application Wording is created for the Microsoft application.

If the Google wording proves broadly reusable, the user promotes it to Master. The system creates a new Master Wording version while leaving the Google Application Wording unchanged.

## 58. Non-Goals

The MVP is not:

- a complete ATS;
- a CV design application;
- a Word processor;
- a job search platform;
- an automated job application platform;
- an AI CV writer;
- an AI career coach;
- a social platform;
- a collaborative recruiting system.

AI should not be added unless explicitly requested.

## 59. Recommended Technology

If there are no existing constraints:

- React
- TypeScript
- Supabase
- PostgreSQL
- modern component library

Use a relational database and database-backed search. PostgreSQL full-text search is appropriate if useful.

Do not introduce vector search or an AI stack unless a later requirement calls for it.

## 60. Build Priorities

### Phase 1 — Core data

Companies, Career Roles, Projects, Achievements, Job Types, Competencies, Tags.

### Phase 2 — Wording system

Master Wordings, versions, Job Type inheritance, Application Wordings, versions and provenance.

### Phase 3 — Workspace

Workspace creation, Achievement selection, wording selection, fixed snapshots, ordering and clipboard export.

### Phase 4 — Applications

Job Applications, application history, Application Wordings and promotion.

### Phase 5 — Compound Achievements

Component selection, nested compounds and cycle prevention.

### Phase 6 — Search and polish

Global search, filters, content gaps, archive handling, usage views and UX refinement.

### Phase 7 — Optional enhancements

Assisted bullet matching, Word import, semantic search and AI assistance.

## 61. Success Criteria

The product succeeds if it makes professional content substantially easier to manage than a collection of Word documents.

The user should be able to quickly answer:

- What are my strongest Achievements?
- What Projects did they come from?
- Which Career Role did I perform them in?
- Which Job Types are they relevant to?
- How have I previously worded them?
- Which Master Wording is current?
- What did I actually write in a particular application?
- Which previous applications used similar wording?
- Which Achievements have no suitable wording for a target Job Type?
- Which Achievements are Mandatory versus Optional?
- Which Achievements can be combined into a reusable Compound Achievement?

The system should achieve this without requiring multiple manually synchronised CV documents.

## 62. Future Possibilities — Out of Scope for MVP

Potential later features:

- AI-assisted wording suggestions;
- semantic Achievement search;
- automatic bullet-to-Achievement matching;
- .docx import;
- CV document generation;
- job-description analysis;
- automatic identification of relevant Achievements from a job description;
- suggested Workspace composition;
- analytics on Achievement reuse;
- identification of underused Achievements;
- AI-generated content gaps;
- interview-story management.

These must not be implemented implicitly as part of the MVP.

## 63. Final Product Definition

This product is:

A personal, searchable knowledge base of professional Achievements and CV wording, with structured career context, reusable target-specific Master Wordings, application-specific wording snapshots, CV Workspace selection, provenance and version history.

The fundamental separation is:

- Achievement = professional evidence.
- Master Wording = reusable expression of that evidence.
- Workspace Snapshot = what was selected for a particular draft.
- Application Wording = what was actually used for a particular application.
- Compound Achievement = a deliberately created new Achievement formed from existing Achievements.

Everything else exists to make those concepts searchable, reusable, traceable and easy to manage.

## 64. Final Architectural Principle

Never lose the connection between what the user actually achieved and the words used to describe it.

The system should preserve the useful chain:

Career Role → Project → Achievement → Master Wording/version → Workspace snapshot → Application Wording/version → Job Application

while allowing flexible many-to-many relationships wherever professional reality requires them.

The result should be a durable personal content system that becomes more valuable over time as more Achievements, wordings and applications are captured.