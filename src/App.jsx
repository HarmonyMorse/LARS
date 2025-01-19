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