# Thannu authentication and Supabase setup

The app uses:

- **Firebase Authentication** for email/password sign-in and account creation.
- **Supabase Database** for owner-scoped collections and links.
- **Firebase ID tokens** as the identity presented to Supabase through the
  configured token provider in `src/services/firebase.ts`.

## Local configuration

Copy `.env.example` to `.env.local` and fill in the public Expo variables. A
local `.env.local` has already been created for this workspace and is ignored
by Git.

Do not put either of these in the Expo app or in `.env.local`:

- `SUPABASE_SECRET_KEY`
- the Postgres connection string/password

The secret key is server-only and the database password must never be shipped
to a client application.

## Firebase console

1. Open Firebase Console for the `thannu-cdb49` project.
2. Go to **Authentication → Sign-in method**.
3. Enable **Email/Password**.
4. Add the web deployment domain to **Authentication → Settings → Authorized
   domains** when deploying outside localhost.

## Supabase database

Apply this migration in the Supabase SQL Editor or with the Supabase CLI:

```text
supabase/migrations/20261011000000_create_collections_and_links.sql
```

For nested collections, also apply:

```text
supabase/migrations/20261015000000_add_collection_parent_id.sql
```

It creates:

- `public.collections`
- `public.links`
- indexes and `updated_at` triggers
- row-level security policies keyed to the Firebase JWT `sub` claim
- `parent_id` support for sub-collections

The migration is intentionally tracked as SQL instead of embedding a database
password in the repository.

## Firebase tokens in Supabase

Configure the Supabase project to accept Firebase as a third-party JWT issuer.
Use the Supabase dashboard's Firebase/third-party authentication integration if
available. Otherwise configure the JWT verification settings with the Firebase
issuer and JWKS endpoint supplied for this project, then ensure requests use
the `authenticated` role.

The policies expect:

```text
auth.jwt() ->> 'sub' = collections.user_id
auth.jwt() ->> 'sub' = links.user_id
```

After changing provider/JWT settings, restart Expo so the local environment is
loaded again:

```bash
npm run web
```

## Credential safety

The Supabase secret key and database password were shared in chat. Rotate both
in Supabase before using this project in production, then update only the
server-side secret store. The app only needs the publishable key and project
URL.
