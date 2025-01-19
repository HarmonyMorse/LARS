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
                    providers={[]}  // Optional: remove or add as needed
                />
            ) : (
                <button onClick={() => supabase.auth.signOut()}>Sign Out</button>
            )}
        </div>
    )
}