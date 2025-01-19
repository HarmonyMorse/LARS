## Creating and deploying a new React+JavaScript Vite project

1. Create, clone, and cd into a new repository

2. `npm create vite@latest .` (Choose React+JavaScript)

3. `npm install`

4. `npm run dev`  (Open a browser and check that it works)

5. `git add .gitignore README.md eslint.config.js index.html package.json package-lock.json vite.config.js public/ src/`

6. `git commit -m "Initial commit"`

7. `git branch -M main`

8. `git push -u origin main`

9. Add the following to index.html:

```html
...
</body>
<!-- Add this script after the body -->
<script>
      // AWS Amplify needs this to work. See https://github.com/aws/aws-sdk-js/issues/3673
      const isBrowser = () => typeof window !== "undefined";
      const isGlobal = () => typeof global !== "undefined";
      if (!isGlobal() && isBrowser()) {
        var global = window;
      }
</script>
<!-- It should be the last thing before the closing body tag -->
</html>
```

10. Add the following to vite.config.js:

```js
...
plugins: [react()],
// Add the following
resolve: {
    alias: {
      "./runtimeConfig": "./runtimeConfig.browser",
    },
  },
...
```

11. `git add index.html vite.config.js`

12. `git commit -m "Add AWS Amplify support"`

13. `git push origin main`

14. Create a new Amplify project in the AWS console

## Connect to Supabase (counter)

1. Create a new Supabase project

2. `touch .env`

3. Add project URL and API (public) key to `.env` (see `.env.example` for an example)

4. Install the Supabase client library:  `npm install @supabase/supabase-js`

5. Run this SQL in your Supabase project:
   ```sql
   DROP TABLE IF EXISTS counts;

   CREATE TABLE counts (
     id SERIAL PRIMARY KEY,
     value INTEGER
   );

   INSERT INTO counts (value) VALUES (0);
   ```

6. Start an SQL file `schema.sql` and add the SQL from step 5 to it. This file will accumulate all the SQL you run on your Supabase project in a single file that is idempotent.

7. In the root of your "src" folder, create a new file called "supabaseClient.js" with the following:
   ```javascript:src/supabaseClient.js
   import { createClient } from '@supabase/supabase-js'

   // These values will come from your .env file
   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
   const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

   export const supabase = createClient(supabaseUrl, supabaseKey)
   ```

8. In "App.jsx", import the Supabase client and modify it to:
   ```javascript:src/App.jsx
   import { useState, useEffect } from 'react'
   import { supabase } from './supabaseClient'

   function App() {
     const [count, setCount] = useState(0)

     // Load the latest count from the database
     useEffect(() => {
       async function fetchCount() {
         const { data, error } = await supabase
           .from('counts')
           .select('*')
           .single()

         if (data && data.value !== undefined) {
           setCount(data.value)
         } else if (error) {
           console.error(error)
         }
       }

       fetchCount()
     }, [])

     // Update the count in the database
     async function updateCount(newValue) {
       setCount(newValue)
       const { error } = await supabase
         .from('counts')
         .update({ value: newValue })
         .eq('id', 1)

       if (error) {
         console.error(error)
       }
     }

     return (
       <>
         <h1>Supabase Counter</h1>
         <div>
           <button onClick={() => updateCount(count - 1)}>
             -
           </button>
           <span style={{ margin: "0 1rem" }}>
             {count}
           </span>
           <button onClick={() => updateCount(count + 1)}>
             +
           </button>
         </div>
       </>
     )
   }

   export default App
   ```

10. Restart your development server (`npm run dev`) to ensure the environment variables are loaded, then try out the +/- buttons to confirm the data is updating and loading from your Supabase database.

11. In the AWS Amplify console, add your environment variables to the Amplify app

12. Push your changes to GitHub: `git add package.json package-lock.json schema.sql src/supabaseClient.js src/App.jsx && git commit -m "Add Supabase support" && git push origin main`

## Connect Supabase Auth (individual counter)

1. In your Supabase project dashboard, go to the "Authentication" settings:
   - Enable email/password sign-ups under "Settings → Auth Settings".
   - (Optional) Configure any social logins you want to support (e.g., GitHub, Google).
   - Disable "Multi-factor authentication"

2. In your Supabase project dashboard, go to "Authentication" -> "Providers" -> "Email" and disable "Confirm Email"

3. Install the Supabase Auth UI library (optional, for pre-styled authentication components):
   ```bash
   npm install @supabase/auth-ui-react @supabase/auth-ui-shared
   ```

4. Update your .env file with any additional keys necessary for authentication if required (usually your public ANON key is enough).

5. In your src folder, create a new file called Auth.jsx (or name it however you want, e.g., SignIn.jsx), which will handle sign-in, sign-up, and sign-out:
   ```javascript:src/Auth.jsx
   import React, { useEffect, useState } from 'react'
   import { supabase } from './supabaseClient'
   import { Auth } from '@supabase/auth-ui-react'
   import { ThemeSupa } from '@supabase/auth-ui-shared'

   export default function AuthComponent() {
     const [session, setSession] = useState(null)

     useEffect(() => {
       supabase.auth.getSession().then(({ data: { session } }) => {
         setSession(session)
       })

       const {
         data: { subscription },
       } = supabase.auth.onAuthStateChange((_event, session) => {
         setSession(session)
       })

       return () => subscription.unsubscribe()
     }, [])

     // If you prefer a fully custom UI, you can create your own forms for sign in/sign up.
     // For demonstration, we'll use the Supabase UI components here.
     return (
       <div>
         {!session ? (
           <Auth
             supabaseClient={supabase}
             appearance={{ theme: ThemeSupa }}
             providers={['google', 'github']}  // Optional: remove or add as needed
           />
         ) : (
           <button onClick={() => supabase.auth.signOut()}>Sign Out</button>
         )}
       </div>
     )
   }
   ```

6. Create a new table for individuals' counters so each user can have their own personal count. In your existing schema.sql file (or a new migration file), add something like:
   ```sql
   -- For storing a personal counter for each user.
   -- user_id references the built-in auth.users table in Supabase (if you are storing user data there).
   CREATE TABLE IF NOT EXISTS personal_counts (
     user_id uuid references auth.users (id) not null primary key,
     value integer default 0
   );
   ```

7. Append the above SQL block to schema.sql (right after your existing CREATE TABLE statements). Drop the table at the beginning if it already exists (idempotent).

8. In your App.jsx (or another component), add logic to use the authenticated user's ID to fetch and update personal_counts. For example:
   ```javascript:src/App.jsx
   import { useState, useEffect } from 'react'
   import { supabase } from './supabaseClient'
   import AuthComponent from './Auth.jsx'

   function App() {
     const [session, setSession] = useState(null)
     const [personalCount, setPersonalCount] = useState(0)

     useEffect(() => {
       // Get session on initial load
       supabase.auth.getSession().then(({ data: { session } }) => {
         setSession(session)
       })

       // Subscribe to auth changes
       const {
         data: { subscription },
       } = supabase.auth.onAuthStateChange((_event, session) => {
         setSession(session)
       })

       return () => subscription.unsubscribe()
     }, [])

     // Load the personal counter from the database once user is signed in
     useEffect(() => {
       async function fetchPersonalCount() {
         if (session && session.user) {
           const { data, error } = await supabase
             .from('personal_counts')
             .select('value')
             .eq('user_id', session.user.id)
             .single()

           if (data && data.value !== undefined) {
             setPersonalCount(data.value)
           } else if (!data) {
             // If there's no row yet, optionally create it
             const { error: insertError } = await supabase
               .from('personal_counts')
               .insert([{ user_id: session.user.id, value: 0 }])

             if (!insertError) {
               setPersonalCount(0)
             }
           }
           if (error) console.error(error)
         }
       }

       fetchPersonalCount()
     }, [session])

     // Update the personal counter in the database
     async function updatePersonalCount(newValue) {
       setPersonalCount(newValue)
       if (session && session.user) {
         const { error } = await supabase
           .from('personal_counts')
           .upsert({ user_id: session.user.id, value: newValue })

         if (error) {
           console.error(error)
         }
       }
     }

     return (
       <>
         <AuthComponent />

         {session && session.user ? (
           <div style={{ marginTop: '1rem' }}>
             <h2>Personal Counter</h2>
             <button onClick={() => updatePersonalCount(personalCount - 1)}>
               -
             </button>
             <span style={{ margin: '0 1rem' }}>
               {personalCount}
             </span>
             <button onClick={() => updatePersonalCount(personalCount + 1)}>
               +
             </button>
           </div>
         ) : (
           <p>Please sign in to see your personal counter.</p>
         )}
       </>
     )
   }

   export default App
   ```

9. Restart your development server (npm run dev) and test the new Auth flow and personal counter:
   - If you are not logged in, you'll see the login/sign-up UI.  
   - Once logged in, you can update a personal counter stored in the personal_counts table.

10. Finally, remember to add your new files (e.g., Auth.jsx) to Git, commit, and push them:

`git add src/Auth.jsx src/App.jsx schema.sql package.json package-lock.json`

`git commit -m "Add Supabase Auth and personal counter functionality"`

`git push origin main`



## Thanks

- [Supabase](https://supabase.com/)
- [AWS Amplify](https://aws.amazon.com/amplify/)
- [Vite](https://vitejs.dev/)
- [React](https://reactjs.org/)
- [JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [Next Steps Vite+Amplify](https://www.nextsteps.dev/posts/aws-amplify-getting-started-with-vite)
