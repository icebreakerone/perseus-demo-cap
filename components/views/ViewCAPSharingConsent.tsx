'use client'
import React from 'react'

import ErrorBoundary from '@/app/error'

interface IProps {
  children: React.ReactElement
}

const ViewCAPSharingConsent = ({ children }: IProps) => {
  return (
    <ErrorBoundary>
      <p>
        Please click below to confirm your consent for IB1<strong>CAP</strong>{' '}
        to share your calculated emissions data from Perse with IB1
        <strong>Bank</strong>
      </p>
      <p>
        As a reminder, we need to have your consent to access the following data
        provided by Perse.
      </p>
      <h2>Terms and conditions</h2>
      <div className="overflow-y-auto overflow-x-hidden">
        <p>
          [Carbon accounting provider] (&quot;we&quot;) need your consent to
          access the following data provided by [insert source of data]:
        </p>
        <ul>
          <li>* Your electricity consumption (taken every 30 minutes)</li>
          <li>* Electricity tariff data</li>
          <li>
            In order to compute the following (&quot;emissions data&quot;):
          </li>
          <li>
            * An estimate of your current GHG emissions, sourced from the
            preceding 12 months of data where available
          </li>
          <li>
            * An estimate of projected emissions following any proposed
            intervention(s) that could be financed: a one-off estimate prior to
            the intervention, delivered once.
          </li>
          <li>
            * A periodic update to corroborate projected emissions savings:
            derived GHG emissions at monthly resolution, delivered annually
          </li>
          <li>and then use the emissions data as follows:</li>
          <li>
            * Share it with your chosen financial service provider(s) to
            facilitate your access to green finance products from that provider
            or providers.
          </li>
          <li>
            * Produce personalised recommendations of actions that your business
            could take to decarbonise (either financed or non-financed)
          </li>
        </ul>
      </div>
      <div className="ml-8">{children}</div>
    </ErrorBoundary>
  )
}

export default ViewCAPSharingConsent
