'use client'
import React from 'react'

import ErrorBoundary from '@/app/error'

interface IProps {
  children: React.ReactElement
}

const ViewSelectEDP = ({ children }: IProps) => {
  return (
    <ErrorBoundary>
      <p>
        IB1 Bank requires your automated emissions report in order to offer you
        green finance.
      </p>
      <p>
        Your energy data provider is part of the process of calculating your
        emissions report. Please select your energy data provider from the list
        below:
      </p>
      <div className="ml-8">{children}</div>
    </ErrorBoundary>
  )
}

export default ViewSelectEDP
