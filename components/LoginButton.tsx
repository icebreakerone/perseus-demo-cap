'use client'

import React, { useState } from 'react'

export default function LoginButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = () => {
    setIsLoading(true)
    // Use window.location.href for full page navigation to avoid CORS issues with OAuth
    window.location.href = '/auth/login'
  }

  return (
    <button
      className="w-[7rem] rounded-[50px] bg-green-500 px-4 py-2 text-white hover:bg-green-800"
      disabled={isLoading}
      id="portal"
      onClick={handleLogin}
    >
      {isLoading ? 'Loading...' : 'GO'}
    </button>
  )
}
