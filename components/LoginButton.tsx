'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    setIsLoading(true)
    router.push('/auth/login')
  }

  return (
    <button
      className="bg-purple-500 text-white px-4 py-2 rounded-[50px] w-[7rem] hover:bg-purple-800"
      disabled={isLoading}
      id="portal"
      // onClick={() => setStageId('edpViaAuth')}
      onClick={handleLogin}
    >
      {isLoading ? 'Loading...' : 'GO'}
    </button>
  )
}
