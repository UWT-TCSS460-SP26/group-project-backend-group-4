# Meetings

## Week 2 — Kickoff

**Date:** 4/7/2026 · **Time:** 12:30 – 1:30 pm · **Attendees:** All members

### Roles

| Role            | Assignee       |
| --------------- | -------------- |
| Meeting Manager | Phelan Gormley |
| Meeting Scribe  | Joshua Kalcha  |

### Team Introductions

| Name   | Preferred | Background               | Strengths                               | Weaknesses                | Availability Constraints |
| ------ | --------- | ------------------------ | --------------------------------------- | ------------------------- | ------------------------ |
| Phelan | Phelan    | Pierce College           | Programming since middle school         | New to TypeScript         | None                     |
| Oisin  | Ocean     | Western Washington Univ. | Can dedicate extra time after this week | New to TypeScript         | Family care              |
| Joshua | Josh      | Highline                 | Dedicates lots of time to projects      | Gets stressed easily      | Church 4 days/week       |
| Nathan | Nathan    | UW                       | Adapts to new tools/languages quickly   | Prefers to avoid GUI work | Meetings Tue/Thu         |

> All members felt their 142/143 coursework prepared them for TCSS 460.

### Fun Facts

- **Phelan** — Likes surfing Facebook Marketplace
- **Oisin (Ocean)** — Likes to draw
- **Josh** — Likes snowboarding
- **Nathan** — Started learning to self-host software

---

### Group Structure

- No dedicated group leader; tasks assigned weekly as a group
- **Git SME:** Phelan
- **Meeting Minutes:** Josh

---

### Past Experiences & Strategies

| Member | Bad Experience                      | Proposed Strategy               |
| ------ | ----------------------------------- | ------------------------------- |
| Phelan | Teammates didn't meet expectations  | Be transparent                  |
| Oisin  | Group procrastinated near deadlines | Set internal deadlines          |
| Josh   | Teammates missed deadlines          | Communicate and honor deadlines |
| Nathan | Nothing specific                    | Clearly define goals and tasks  |

---

### Availability (at least 3 sync meetings/week)

| Member | Mon / Wed / Fri | Tue / Thu       |
| ------ | --------------- | --------------- |
| Phelan | All day         | All day         |
| Oisin  | All day         | 12:10 – 1:30 pm |
| Josh   | Before 6 pm     | 12:10 – 1:30 pm |
| Nathan | 1 – 6 pm        | 12:10 – 1:30 pm |

---

### Wrap-up (Action Items)

- **Everyone:** Create branch `setup/<your-name>`, add `/hello/<your-name>` route, push, open PR to `main`
- **Josh:** Team meeting minutes
- **Phelan:** Customize OpenAPI info, deploy API, update README & GitHub About
- **Oisin:** Remove the `/hello` example route
- **Nathan:** Set up heartbeat endpoint

---

## Week 3 — Sprint 1 Planning

**Date:** 4/14/2026 · **Time:** 12:30 – 1:30 pm · **Attendees:** All members

### Decisions

- Everyone uses their own TMDB development API key
- Use TMDB v3 API — do **not** touch production branch

### Tasks

| Member | Responsibilities          |
| ------ | ------------------------- |
| Nathan | Popular results endpoints |
| Joshua | Search endpoints          |
| Oisin  | Details endpoints         |
| Phelan | Testing                   |

---

## Week 4 — Ratings & Reviews

**Date:** 4/21/2026 · **Time:** 12:30 – 1:20 pm · **Attendees:** All members

### Setup Notes

- After pulling, run `npm install` and `npx prisma generate`
- Everyone needs a local PostgreSQL database

### Tasks

| Member     | Responsibilities                                                                        |
| ---------- | --------------------------------------------------------------------------------------- |
| **Nathan** | Ratings CRUD, public GET by TMDB ID, OpenAPI docs, auth gates                           |
| **Joshua** | Automated tests (all CRUD + auth flows), verify dev-login JWT                           |
| **Oisin**  | Reviews CRUD, public GET by TMDB ID, OpenAPI docs, auth gates                           |
| **Phelan** | Prisma schema (users/ratings/reviews), initial migration, seed admin, `/auth/dev-login` |

### Other Notes

- Admins perform hard deletes
- Everyone opens a PR; Phelan merges after review
- Josh updates API docs for last week's endpoints
- **Deadline:** Friday

---

## Week 5 — Issues & Auth Migration

**Date:** 4/28/2026 · **Time:** 12:30 – 1:20 pm · **Attendees:** All members

### Tasks

| Member     | Responsibilities                                                                 |
| ---------- | -------------------------------------------------------------------------------- |
| **Nathan** | Migrate auth tests to new stub, log all 500 errors, write `/issues` tests        |
| **Joshua** | Role-gating helpers, JWKS RS256 middleware, remove dev-login + `jsonwebtoken`    |
| **Oisin**  | Tests for reviews, enriched detail route (TMDB + community data)                 |
| **Phelan** | Issue DB schema, add `subjectId @unique` on User, `POST /issues` with validation |

---

## Week 6 — Self-lists, Combined Routes & Admin Issues

**Date:** 5/5/2026 · **Time:** 12:30 – 1:20 pm · **Attendees:** All members

### Tasks

| Member     | Responsibilities                                                                            |
| ---------- | ------------------------------------------------------------------------------------------- |
| **Nathan** | Auth'd self-list reviews, community-ranked combined route, tests                            |
| **Joshua** | Admin-gated GET/PATCH/DELETE `/issues`, pagination/filter/sort, tests                       |
| **Oisin**  | Auth'd self-list ratings, rated-items + TMDB combined route, tests                          |
| **Phelan** | Tests, Auth² security scheme in spec, partner README, full OpenAPI coverage, CORS allowlist |

---

## Week 7 — Final Merge

### Meeting 1

**Date:** 5/12/2026 · **Time:** 12:30 – 1:20 pm · **Attendees:** All members

#### Plan

- **Friday 4:30 pm:** Merge session — present work, pick features, merge together
- Everyone works individually until Friday
- Accept invite to final repo, create a branch, write a ~200 word summary
- Complete sprint tasks + issues page

#### Extra Work (Optional)

- Build a GitHub Issues-style frontend page (requires OAuth2 from Charles)

#### Backend Change (by Wednesday night)

- Expose ability to query a user's role from the database _(Phelan)_

---

### Meeting 2 — Frontend Showcase & Voting

**Date:** 5/15/2026 · **Time:** 4:30 – 5:00 pm · **Attendees:** All members

#### Frontend Demos

| Member | Status   | Style        | Login     | Notes                                      |
| ------ | -------- | ------------ | --------- | ------------------------------------------ |
| Ocean  | ✅ Works | GitHub-style | Paste JWT | Nice issue-detail popup                    |
| Josh   | ✅ Works | Basic        | Auth2     | Kermit background, slightly buggy          |
| Phelan | ✅ Works | GitHub-style | Auth2     | Best overall FE                            |
| Nathan | ✅ Works | GitHub-style | Paste JWT | Good sort and search for admin issues list |

> All bug reporters look roughly the same.

#### Decisions

- **Chosen frontend:** Phelan's bug reporter & admin issues page + Josh's Kermit background
- Josh collects workflows and posts meeting minutes
- Phelan merges selected items from Josh's FE into his
