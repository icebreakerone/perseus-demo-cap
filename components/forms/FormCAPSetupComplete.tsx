'use client'
import React from 'react'

interface IProps {
  onGotoEDPSelection: (e: never) => void
  onGotoLender: (e: never) => void
}

const FormCAPSetupComplete = ({ onGotoEDPSelection, onGotoLender }: IProps) => {
  return (
    <form className="flex w-full flex-col gap-8">
      <div className="flex w-full flex-col">
        <div className="flex flex-1 flex-col gap-4 p-8">
          <div className="flex flex-1 flex-row items-center justify-center">
            <button
              className={`
                text-md
                rounded-md
                bg-purple-600 px-4
                py-2
                text-white
                hover:bg-purple-800
                disabled:border disabled:border-gray-300 disabled:bg-gray-300 disabled:text-gray-500`}
              disabled
            >
              Close this window
            </button>
          </div>
          <div className="flex flex-1 flex-row items-center justify-center">
            <button
              className={`
                text-md
                rounded-md
                bg-purple-600 px-4
                py-2
                text-white
                hover:bg-purple-800
                disabled:border disabled:border-gray-300 disabled:bg-gray-300 disabled:text-gray-500`}
              onClick={onGotoEDPSelection}
            >
              Restart set-up
            </button>
          </div>
          <div className="flex flex-1 flex-row items-center justify-center">
            <button
              className={`
                text-md
                rounded-md
                bg-purple-600 px-4
                py-2
                text-white
                hover:bg-purple-800
                disabled:border disabled:border-gray-300 disabled:bg-gray-300 disabled:text-gray-500`}
              onClick={onGotoLender}
            >
              Connect another lender
            </button>
          </div>
          <div className="flex flex-1 flex-row items-center justify-center">
            <button
              className={`
                text-md
                rounded-md
                bg-purple-600 px-4
                py-2
                text-white
                hover:bg-purple-800
                disabled:border disabled:border-gray-300 disabled:bg-gray-300 disabled:text-gray-500`}
              disabled
            >
              Go to your IB1CAP dashboard
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}

export default FormCAPSetupComplete
