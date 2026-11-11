# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: plain HTML, CSS and JavaScript (ES modules, no build step) with Supabase for data and sign-in. Chosen because Hostinger already redeploys the repository automatically on every push to `main`, the site is two pages plus a course hub, and click-to-edit works directly on the page markup. A framework would add a build step and a new deploy pipeline for no visitor benefit.

## Users

People choosing a driving school in and around Preston, Lancashire (PR1 to PR5), mostly on a phone:

- Teens and students (17 to 21) learning for the first time and booking for themselves.
- Parents choosing and paying for a son or daughter's lessons.
- Nervous or adult learners, including people returning after a break.
- Women who specifically want a female instructor.

Their job: decide whether this school is right for them (instructor, car, price, evidence that students pass) and get in touch to book.

Secondary users: the two instructors, who update the site themselves, and current students, who will use the video course hub.

## Product Purpose

Learner2Driver is a Preston driving school run by two instructors. The website exists to turn a visitor into a booking enquiry by WhatsApp or phone call, and to give current students a private video course hub. Success is a visitor who picks an instructor, a car and a package and sends the message.

## Positioning

- A choice of a male or a female instructor.
- A choice of manual (Toyota Yaris) or fully electric automatic (Hyundai Kona EV), both dual-controlled.

Supporting, not leading: local knowledge of the Preston test centre routes, and first-time pass results.

## Operating Context

- Booking is by WhatsApp message or phone call (07427 330827). The visitor chooses instructor, car and package; the site pre-fills the message. There is no online calendar or payment.
- The instructors edit the site by signing in and clicking text or photos on the live page (click-to-edit). This is a confirmed requirement for the rebuild.
- Reviews are pulled from the Google Business profile.
- Real student pass photos come from the @lrnr2drvr Instagram account.
- Hosting: Hostinger shared hosting, auto-deployed from GitHub `main`. Live at learner2driver.co.uk (learner2driver.net redirects to it).
- Data and sign-in: Supabase, with row-level security. The public reads site content; only signed-in instructors write.

## Capabilities and Constraints

Homepage features to keep: instructors, the two cars with their feature hotspots, test readiness quiz, Preston test-route map with danger-spot tips, Instagram feed, booking wizard ending in WhatsApp or call, pass photo gallery, reviews.

Dropped: dark mode.

Video course hub: for current students only, each with their own login and saved progress. The instructor creates the accounts. Student logins are paused until this is rebuilt with real accounts.

Pricing (as published on the live site): £38 per hour for manual and for automatic; 10-hour block £360 (was £380).

Terminology on the live site: the instructors are presented as "Male Instructor" and "Female Instructor", not by name. The female instructor is described as a PDI.

Undecided: whether instructors are named and pictured on the new site.

## Brand Commitments

- Name: Learner2Driver, written as one word.
- Wordmark: red capital L, amber 2, green capital D. Green is the main brand colour. Both are to be kept.
- Tone: sharp and professional.

## Evidence on Hand

- Car photos uploaded by the instructor: the silver Toyota Yaris and the dark grey Hyundai Kona EV, each with the Learner2Driver roof board.
- Four student pass photos uploaded by the instructor, plus the live Instagram feed of pass photos.
- Headline figures the owner confirmed as true and publishable: 90%+ first-time pass rate, 100+ Preston passes, 5-star Google rating.
- Google reviews on the business profile.

Absent, and not to be invented: instructor portraits, an exact Google review count, a logo file, named student testimonials beyond what Google and Instagram supply.

## Product Principles

1. The page ends in a message to an instructor. Every section should move a visitor toward choosing an instructor, a car and a package.
2. Show the real thing: the actual cars, actual students, actual prices. No stock imagery standing in for the business.
3. Only publish what is true and checkable. Numbers, ratings and reviews come from a confirmed source or are left out.
4. The instructors must be able to change any wording, price or photo themselves, without breaking the page.
5. Visitors can read; only signed-in instructors can change anything.

## Accessibility & Inclusion

Most visitors are on phones. The audit found contrast failures, missing keyboard focus and pop-ups that cannot be closed from the keyboard; the rebuild should meet WCAG AA.
