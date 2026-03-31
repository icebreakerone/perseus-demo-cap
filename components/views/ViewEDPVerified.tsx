'use client'
import React from 'react'
import ErrorBoundary from '@/app/error'

interface IProps {
  onClose: (e: never) => void
}

const FormLoginCAP = ({ onClose }: IProps) => {
  return (
    <ErrorBoundary>
      <div className="flex flex-row gap-4">
        <button
          className={`
            text-md
            rounded-md
            bg-green-600 px-4
            py-2
            text-white
            hover:bg-green-800
            disabled:border disabled:border-gray-300 disabled:bg-gray-300 disabled:text-gray-500`}
          onClick={onClose}
          type="button"
        >
          <span>RETURN TO IB1 CAP</span>
        </button>
      </div>
    </ErrorBoundary>
  )
}

export default FormLoginCAP
