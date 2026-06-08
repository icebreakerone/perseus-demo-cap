'use client'
import React from 'react'

import ErrorBoundary from '@/app/error'

const ViewRetrieveEDP = () => {
  return (
    <ErrorBoundary>
      <p>Retrieving your energy data from IB1 EDP…</p>
      <p>This will only take a moment.</p>
    </ErrorBoundary>
  )
}

export default ViewRetrieveEDP
