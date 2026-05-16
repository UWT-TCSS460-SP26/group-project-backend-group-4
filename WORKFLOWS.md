# Sprint 5 AI Agent Workflows Write-ups

## Phelan

- I told it: Your job is to read @sprint-5.md and @openapi.yaml and build the bug tracker front end described in the sprint doc against the API spec

- It gave me: 1b54139cccd96d903c1f28d642ddf97867f62f8c

- For the triage UI I then gave it the contenst of triage_ui.md and it gave me: f00bf52bd367057360f71e6060ca378ac779246b, I had to guide it through some things.

- After that I went with it for a bit fixing and tweaking some things because I didn't like what it was giving me and am a bit of a perfectionist

## Nathan

**Phase 1: Context Preparation (Gemini in Chrome)**

- **What I Prompted:** Parsed the Sprint 5 assignment page and prompted the model to generate scaffolding structures (JSON request bodies, validation rules, HTTP response codes) based on our existing backend `openapi.yaml`.
- **What the Agent Produced:** A comprehensive `frontend-spec.md` blueprint mapping the assignment constraints to our team's specific OpenAPI structures.
- **What I Kept / Cut:** Kept the generated context document and the several other files necessary for agentic coding.

**Phase 2: Agentic Scaffolding (Gemini Agentic in VS Code)**

- **What I Prompted:** Placed only `frontend-spec.md` and `openapi.yaml` in a fresh directory to prevent context pollution. Prompted concisely: _"Build the Bug Tracker FE described in the spec against the provided OpenAPI yaml."_
- **What the Agent Produced:** The heavy lifting—a full Next.js project structure, the unauthenticated form components, and the `POST /issues` fetch logic.
- **What I Kept / Cut:** Kept the base output and moved forward with smaller edits with a more precise tool.

**Phase 3: Targeted Refinement (Gemini Non-Agentic in VS Code)**

- **What I Prompted:** Used file-specific, localized prompts for UI polish, deployment standards, and state handling without risking the broader architecture (e.g., _"Should Zod validation be used in the frontend?"_, _"Add Discord Contact Info as an option."_, _"Fix The text alignment..."_).
- **What the Agent Produced:** Targeted code snippets for specific component state updates and accessibility fixes.
- **What I Kept / Cut:** Kept the specific localized fixes. Cut any suggestions where they were unhelpful or unintuitive.

## Josh

### Prompts

- For each feature I would build context for the agent to use, everything it needed should have been in the context.
- I would then ask it to read the context and ask any questions if needed, and just start working on whatever was written in sprint-5.md
- For the bug reporter the agent did very well the first time and so I had a working product after the first prompt
- For the admin issues page the agent did not do good. I had to get it to fix some things and it was still having trouble.

### Results

#### What was kept and what was cut

- **Kept**: Next.js 14 App Router + TypeScript + Tailwind CSS scaffold, single-page form with all three states (success, validation error, network error), header/footer branding, light and dark mode, bug icon in header, bug report format (title, description, contact, submit), dark mode background, admin issues page.
- **Cut**: I changed 'http://localhost:3000' to 'http://localhost:3001', removed the scroll thingy on the page, change dragon icon in the header back to a bug, removed dragon icon, removed dragon background.

### What I would do differently next time

- I would implement new features in a new directory. The agent did not do as good of a job implementing the admin page because it was getting confused from all the files for the bug reporter.

## Ocean

I told the AI to read every user story for this week's sprint, while also giving it our openapi.yaml documentation. I gave it further direction by saying it should be reminiscent of a GitHub issues page. What I thought should be kept include:

- I liked how the design is a consistent, clean style between pages which were dark-themed.
- I was also impressed by the implementation of Auth2, and how easy it is to switch out things like the issuer or audience or etc. within the code.
- I like how Auth2 is used to allow admins to sign in and update issues based on whether or not they're open, in-progess, fixed, or won't fix.
- The use of states for a ReportForm component's state of being idle, loading, success, api-error, or network-error was very good as it accounted for multiple kinds of errors a Report may come across.

**What I would've done differently:**

- The design needed to be separated into more files, as it only gave me one App.tsx (which, while convenient for copy-pasting and showcasing really quick, is a bit overwhelming). It should be split into a more robust file structure like app/page.tsx, app/layout.tsx, etc.
- I also needed to fix some bugs involving the posting of issues not working.
