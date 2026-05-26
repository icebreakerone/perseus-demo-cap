'use client'
import React from 'react'

import ErrorBoundary from '@/app/error'

interface IProps {
  currentStep: 1 | 2 | 3 | 4 | 5 | 6
}

const STAGES: { num: number; label: string }[] = [
  { num: 1, label: 'Choose\nEnergy Data\nProvider' },
  { num: 2, label: 'Give permission\nto retrieve energy\ndata' },
  { num: 3, label: 'Retrieve energy\ndata' },
  { num: 4, label: 'Choose Financial\nService Provider' },
  {
    num: 5,
    label: 'Give permission to\nreport to Financial\nService Provider',
  },
  { num: 6, label: 'Generate report for\nFinancial Service\nProvider' },
]

const StagesBar = ({ currentStep }: IProps) => {
  return (
    <ErrorBoundary>
      <nav aria-label="Progress" className="w-full px-4 pt-4 pb-2">
        <ol className="mx-auto flex w-full max-w-3xl items-start">
          {STAGES.map((stage, idx) => {
            const isDone = stage.num < currentStep
            const isCurrent = stage.num === currentStep
            const isReached = isDone || isCurrent

            const connectorActive = stage.num <= currentStep
            return (
              <li
                className="relative flex flex-1 flex-col items-center"
                key={stage.num}
              >
                {/* Connector line to previous stage (drawn behind, anchored to left half of this item) */}
                {idx > 0 && (
                  <span
                    aria-hidden="true"
                    className={`absolute top-5 right-1/2 left-[calc(-50%+1.25rem)] h-0.5 ${
                      connectorActive ? 'bg-purple-700' : 'bg-purple-300'
                    }`}
                  />
                )}
                <span
                  className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 text-base font-semibold ${
                    isReached
                      ? 'border-purple-700 bg-purple-700 text-white'
                      : 'border-purple-300 bg-purple-100 text-purple-300'
                  }`}
                >
                  {stage.num}
                </span>
                <span
                  className={`mt-2 text-center text-xs leading-tight whitespace-pre-line ${
                    isCurrent
                      ? 'font-semibold text-purple-900'
                      : isDone
                        ? 'text-purple-900'
                        : 'text-purple-300'
                  }`}
                >
                  {stage.label}
                </span>
              </li>
            )
          })}
        </ol>
      </nav>
    </ErrorBoundary>
  )
}

export default StagesBar
