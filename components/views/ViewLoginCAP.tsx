'use client'
import React from 'react'

import ErrorBoundary from '@/app/error'
import Link from 'next/link'

interface IProps {
  children: React.ReactElement
}

const ViewLoginCAP = ({ children }: IProps) => {
  return (
    <ErrorBoundary>
      <p>IB1<strong>Bank</strong> requires your automated emissions report in order to offer you green finance.</p>
      <p>Please sign in to start the process</p>
      <Link className="underline" href="/public#">Terms and conditions</Link>
      <div className="ml-8">
        {children}
      </div>

    </ErrorBoundary>
  )
}

export default ViewLoginCAP
