# AGENT.md

## Project Overview

This project is a **Vite + React + TypeScript PWA** for generating a **daily 3-meal plan for a 12-month-old child**.

Users can:

* Sign in with **Google** or **Apple**
* Create and manage **child profiles**
* Register **allergy ingredients** per child
* Input ingredients for **breakfast / lunch / dinner**
* Generate a daily meal plan using:

  * rule-based menu candidate selection
  * AI-generated recommendation text
  * AI-generated recipe summary
  * missing ingredient detection
  * substitute ingredient suggestions

This app must be **mobile-first**, **safe**, and **structured for long-term maintainability**.

---

## Core Product Rules

### Meal Planning Rules

* Always generate **3 meals per day**:

  * breakfast
  * lunch
  * dinner
* Meal recommendations must be appropriate for a **12-month-old child**
* Meal recommendations should prioritize:

  * ingredient match
  * meal diversity
  * low cooking complexity
  * age appropriateness

### Allergy Rules (Critical)

* Allergy ingredients must be treated as **strict exclusion**
* Any menu containing an allergy ingredient must be **fully excluded**
* Allergy filtering must apply to:

  * main ingredients
  * side ingredients
  * sauces
  * broth
  * toppings
  * substitutes
  * AI-generated outputs
* If the user inputs an allergy ingredient, show a warning and exclude it from calculation
* AI must **never** suggest allergy ingredients in:

  * menu text
  * recipe
  * missing ingredients
  * substitutes
  * recommendations

### AI Rules

* AI is **not responsible for choosing the meal candidate**
* Meal candidate selection must be **rule-based**
* AI is only responsible for:

  * recommendation text
  * recipe summary
  * missing ingredients explanation
  * substitute suggestions
  * caution text
* AI must be called **per meal**, not per day
* AI must be called **only from server-side functions**
* Never call AI directly from the client
* Always implement a **fallback response**
* If AI response is invalid, unsafe, or contains allergy ingredients, discard it and use fallback

---

## Tech Stack

### Frontend

* Vite
* React
* TypeScript
* React Router
* PWA via `vite-plugin-pwa`

### State / Data

* React Query for server state
* Zustand for lightweight client state
* localStorage only for:

  * selected child
  * meal draft

### Backend / Infra

* Supabase
* Supabase Postgres
* Supabase Auth
* Supabase Edge Functions

### Auth

* Google login
* Apple login
* Optional anonymous user flow for pre-login usage
* Anonymous data should be linkable to authenticated user later

### Source Control

* GitHub

---

## Architecture Rules

## Frontend Structure

Use **domain-based structure**.

Preferred folders:

src/
app/
pages/
components/
features/
lib/
services/
styles/
types/

### Folder Responsibilities

* `pages/` = route-level screens
* `components/` = reusable UI components
* `features/` = domain logic (API, hooks, types, validation)
* `lib/` = external clients and utilities
* `services/` = local storage, side utilities, browser services
* `app/` = providers, router, app-level setup

### Domain Folders

Use these feature domains:

* `auth`
* `children`
* `ingredients`
* `meal-plans`
* `menus`

Do **not** mix unrelated business logic into generic utility folders.

---

## Backend Rules

### Database

Use Supabase Postgres with the following domain tables:

* `children`
* `ingredients`
* `menus`
* `meal_inputs`
* `meal_plans`
* `meal_plan_items`
* `ai_generation_logs`
* `anonymous_users`
* `user_identity_links`

### Data Modeling Rules

* Ingredient matching must use **standardized ingredient keys**
* Menus must be stored in DB and initially loaded from **seed data**
* Meal results must be stored as:

  * day-level plan (`meal_plans`)
  * meal-level details (`meal_plan_items`)
* Always store:

  * missing ingredients
  * substitutes
  * AI recommendation
  * recipe summary
  * fallback flag
  * prompt version

### Security Rules

* Use RLS where applicable
* Users must only access their own:

  * child profiles
  * meal inputs
  * meal plans
* `menus` and `ingredients` should be readable but not directly writable by normal users
* AI logs should not be exposed to normal users

---

## Coding Standards

### TypeScript Rules

* Use **strict TypeScript**
* Avoid `any`
* Prefer explicit types for:

  * API payloads
  * component props
  * domain models
  * Supabase responses
* Centralize domain types in feature folders

### React Rules

* Use **functional components**
* Prefer hooks
* Keep components small and composable
* Avoid large monolithic page components
* Extract repeated UI into reusable components

### State Management Rules

* Use React Query for:

  * fetching children
  * meal history
  * latest meal plan
  * ingredient search
* Use Zustand for:

  * auth state if needed
  * selected child
  * meal draft state
* Do not overuse global state

### Validation Rules

Use schema validation (recommended: Zod) for:

* child profile forms
* ingredient normalization payloads
* meal generation payloads
* AI response parsing

---

## UI / UX Rules

### General UI

* Mobile-first layout
* Clean, minimal, readable UI
* Avoid over-designed animations
* Prioritize usability over visuals

### Meal Result UI

Each meal card should display:

* menu name
* AI recommendation
* used ingredients
* missing ingredients
* substitutes
* recipe summary (**3 lines only**)
* fallback badge if applicable
* warning if needed

### Child Profile UI

Each child profile must support:

* name
* birth date or age in months
* allergy ingredient tags

### Ingredient Input UI

* Tag-based input preferred
* Autocomplete support preferred
* Normalize ingredients before meal generation
* Show immediate allergy conflict warnings

---

## Local Storage Rules

Allowed local storage only for:

* selected child
* in-progress meal input draft

Do not store:

* AI results as source of truth
* full child profile as source of truth
* auth-sensitive data manually unless required by auth SDK

Server must remain the source of truth.

---

## AI Integration Rules

### AI Input Must Include

* child age in months
* child allergies
* meal type
* normalized user ingredients
* candidate menus selected by rule-based engine
* menu ingredient requirements
* texture / age suitability metadata

### AI Output Must Be Structured

Expected structured response fields:

* `selectedMenu`
* `recommendation`
* `missingIngredients`
* `substitutes`
* `recipe`
* `caution`

### AI Validation Must Check

* valid JSON
* selected menu exists in candidate list
* no allergy ingredient appears anywhere
* no dangerous or age-inappropriate suggestion
* recipe is concise and usable
* substitute ingredients are valid

### Fallback Must Exist

If AI fails, return:

* template recommendation
* template recipe summary
* computed missing ingredients
* default substitute map

Never block the meal plan flow because of AI failure.

---

## Preferred Implementation Order

When building features, follow this order:

1. App shell / routing / project setup
2. Auth
3. Child profile CRUD
4. Allergy input
5. Ingredient input + normalization
6. Rule-based meal candidate selection
7. AI generation layer
8. Meal result UI
9. Meal history
10. Deployment / CI

---

## How to Respond When Implementing

When making changes:

* Keep code modular
* Prefer incremental changes over huge rewrites
* After implementation, summarize:

  1. what was changed
  2. which files were added/updated
  3. what should be done next

When requirements are unclear:

* prefer consistency with this AGENT.md
* do not invent a conflicting architecture

If choosing between “quick hack” and “clean structure”:

* prefer clean structure unless explicitly told otherwise
