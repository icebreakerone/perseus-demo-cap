'use client'
import React, { useState } from 'react'

import ErrorBoundary from '@/app/error'
import Link from 'next/link'

interface IProps {
  children: React.ReactElement
}

const ViewSelectLender = ({ children }: IProps) => {
  return (
    <ErrorBoundary>
      <p>While we are retrieving your electricity data, please either confirm your lender below or select another from the list.</p>
      <div className="ml-8">
        {children}
      </div>

    </ErrorBoundary>
  )
}

export default ViewSelectLender
