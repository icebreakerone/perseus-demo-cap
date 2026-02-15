'use client'
import React from 'react'

import ErrorBoundary from '@/app/error'

interface IProps {
  children: React.ReactElement
}

const ViewCAPSetupComplete = ({ children }: IProps) => {
  return (
    <ErrorBoundary>
      <p>
        Congratulations! Setup has now been completed. You will be notified via your IB1CAP dashboard when your emissions report is ready to download. This may take up to 48 hours.
      </p>
      <p>You may now either:</p>
      <div className="ml-8">{children}</div>
    </ErrorBoundary>
  )
}

export default ViewCAPSetupComplete
