'use client'
import React from 'react'

import ErrorBoundary from '@/app/error'
import Link from 'next/link'

interface IProps {
  children: React.ReactElement
}

const ViewSelectEDP = ({ children }: IProps) => {
  return (
    <ErrorBoundary>
      <p>
        IB1<strong>Bank</strong> requires your automated emissions report in
        order to offer you green finance.
      </p>
      <p>
        Your energy data provider is part of the process of calculating your
        emissions report. Please select your energy data provider from the list
        below:
      </p>
      <Link className="underline" href="#">
        Terms and conditions
      </Link>
      <div className="ml-8">{children}</div>
    </ErrorBoundary>
  )
}

export default ViewSelectEDP
