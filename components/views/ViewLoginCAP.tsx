'use client'
import React from 'react'

import ErrorBoundary from '@/app/error'

interface IProps {
  children: React.ReactElement
}

const ViewLoginCAP = ({ children }: IProps) => {
  return (
    <ErrorBoundary>
      <p>
        We offer better advice and potential access to funding if you allow us
        to access your detailed energy consumption data.
      </p>
      <p>Please sign in to start the process</p>
      <div className="ml-8">{children}</div>
    </ErrorBoundary>
  )
}

export default ViewLoginCAP
