# Meetings

# Week 2

## Agenda Item 1:

### Decide on a Meeting Manager (This person is NOT the group leader. The meeting manager’s role is to keep the group on task during the meeting)

### Meeting Manager: Phelan Gormley

## Agenda Item 2:

### Decide on a Meeting Scribe (This person documents the meeting minutes. Group, help the scribe in their role. Keep your own notes. Work slowly enough so that the scribe may document the meeting)

### Meeting Scribe: Joshua Kalcha

## Agenda Item 3:

### Get to know each group member. Each group member answer (at least) the following questions: What is your name/nickname and what do you prefer to be called?

### Name: Phelan - Preferred name: Phelan

### Name: Oisin - Preferred name: Ocean

### Name: Joshua - Preferred name: Josh

### Name: Nathan - Preferred name: Nathan

## Where did you do Freshman/Sophomore year and/or where did you take 142/143? Did your 142/143 prepare you for this course?

### Phelan - Piece College, Yes they prepared me for the course

### Oisin - Western Washington University, Yes they prepared me for the course

### Joshua - Highline, Yes they prepared me for the course

### Nathan - UW, Yes they prepared me for the course

## What are your programming strengths and weaknesses? BE HONEST! It’s ok that you are not a good programmer. Let your group know so that the group as a whole can work with you.

### Phelan

Weakness: Don’t know that much type script.
Strength: been programming since middle school.

### Oisin

Weakness: Don’t know that much type script.
Strength: Can spend more time on the project/learning typescript after this week.

### Joshua

Weakness: get stressed out a lot.
Strength: Usually dedicate a lot of time to projects.

### Nathan

Weakness: don't want to work on GUI.
Strength: can adapt to new tools/languages quickly .

## What other obligations take time away from your ability to work on this project? Work, Family/Kids, 20 credits this quarter, etc. BE HONEST Let your group know so that the group as a whole can work with you.

### Phelan - Nothing

### Oisin - Taking care of family

### Joshua - Church 4 days a week

### Nathan - Meetings on Tuesdays and Thursdays

## What is something you want others to know about yourself?

### Phelan - I like to surf facebook marketplace

### Oisin - I like to draw

### Joshua - I like to Snowboarding

### Nathan - I started learning to self host software

## Agenda Item 4:

Decide on a group structure.
Do you want to have a dedicated group leader?
Who are the Subject Matter Experts (SME) for different areas? GUI, OO, Logic, Management, etc.
Students A and B pair program together while students C and D pair program together.
Student A is a dedicated tester/Unit test creator.
Consider your group's strengths and weaknesses. Pair a weak programmer with a strong programmer for pair programming sessions.
Who has Git experience and/or wants to dive into working with Git and GitHub to become the group's Git SME?
Etc.

### Group structure:

We all get together and assign tasks for the week.
Phelan will be in charge of git stuff.
Josh is in charge of meeting minutes.

## Agenda Item 5:

Discuss your concerns for the group project. Air any bad experiences from group work in the past. Discuss what you want to get out of this group project. Discuss strategies you think can work for a successful group project.

### Phelan

Bad experience - Teammates did not live up to expectations.
Strategy - be transparent.

### Oisin

Bad experience - group members procrastinated and turned in the project close to the deadline.
Strategy - set deadlines for tasks.

### Joshua

Bad experience - Teammates did not complete work on time.
Strategy - communicate with each other and try to make the deadlines you set.

### Nathan

Bad experience - Nothing specific.
Strategy - Clearly define goals and tasks.

## Agenda Item 6:

The group needs to meet synchronously (online is OK) AT LEAST 3 times a Week. What times/days work for everyone?
https://www.when2meet.com/

### Phelan

Available all times.

### Oisin

Available 12:10 - 1:30 pm tuesday and thursday.
Available anytime monday, wednesday, friday.

### Joshua

Available on Monday, Wednesday, Friday before 6pm
Or 12:10 - 1:30 pm on Tuesday and Thursday.

### Nathan

Available 12:10 - 1:30 pm tuesday and thursday.
Available Monday, Wednesday, Friday 1 - 6 pm

## Agenda Item 7:

Wrap-up

### Everyone do

Create a new branch off main (e.g., setup/your-name)
Add a new route to the API (e.g., /hello/your-name that returns a JSON greeting)
Commit your changes and push your branch
Open a pull request to main

### Josh

Team meeting minutes

### Phelan

OpenAPI info section customized with team name, description, and deployed server URL
API is deployed and responds at a public URL
Deployed URL is in the repo README and GitHub About section

### Oisin

Deleting the hello route "As a team, we want to remove the example /hello route so that our API only contains code we own"

### Nathan

Setup heartbeat endpoint

## Week 3

### Meeting Date: 4/14/2026

### Meeting Time: 12:30 - 1:30

### Present: All members

## Introduction

### Everyone has their own development api key

### Decide on how to split sprint 1 into tasks

## Tasks

### Nathan

- Popular results endpoints

### Joshua

- search endpoints

### Oisin

- details endpoints

### Phelan

- testing

## wrapping it up

- Do not touch production branch
- use v3 TMDB API

## Week 4

### Meeting Date: 4/21/2026

### Meeting Time: 12:30 - 1:20

### Present: All members

## Tasks

### Nathan

- Ratings support create, read (single + list), update, delete
- Public GET endpoints return ratings for a given TMDB identifier
- OpenAPI Docs
- Writes and admin actions are gated by requireAuth and appropriate role checks

### Joshua

- Automated tests cover success and error cases for every new endpoint
- Write authenticated tests for every write path (create, update, delete) in both modules.
- Verify dev-login route mints a JWT that passes requireAuth and role checks.

### Oisin

- Reviews support create, read (single + list), update, delete
- Public GET endpoints return reviews for a given TMDB identifier
- OpenAPI Docs
- Writes and admin actions are gated by requireAuth and appropriate role checks

### Phelan

- Prisma schema defines users, ratings, and reviews — no movies or TV tables
- Initial migration is committed to the repository under prisma/migrations/
- Seed script creates at least one admin account
- /auth/dev-login is mounted and mints working JWTs

## Setup

- After pulling, install…
- Npx prisma generate to generate actual client
- Everyone get a postgres database setup

## Other

- Admins have hard delete
- Everyone create a pr, phelan will merge once he reviewed it
- Josh update api doc for endpoints from last week
- Finish endpoints by friday

## Week 5

### Meeting Date: 4/28/2026

### Meeting Time: 12:30 - 1:20 pm

### Present: All members

## Tasks

### Nathan

- Migrate tests that need auth to new stub pattern
- Make sure that any time we return a 500 error code, WE LOG THE REASON WHY
- Tests for /issues

### Joshua

- Implement role gating helpers
- JWKS-based RS256 verification middleware in place; dev-login route, JWT_SECRET, and jsonwebtoken dep removed

### Oisin

- Tests for your routes
- Enriched movie/show detail route returns TMDB metadata combined with your community's aggregate and recent reviews

### Phelan

- Create the db schema for issues (also the subjectId String @unique on User thing)
- POST /issues accepts and persists bug reports; input validated; response shape documented
