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