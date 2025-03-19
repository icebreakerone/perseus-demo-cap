'use client'
import React from 'react'

interface IProps {
  onSubmit: (e: any) => void
}

const FormCAPSelectEDP = ({ onSubmit }: IProps) => {
  const [edp, setEDP] = React.useState<string>('')

  return (
    <form className="flex w-full flex-col gap-8">
      <div className="flex w-full flex-col">
        <label className="mb-2 block text-sm font-medium" htmlFor="countries">
          Your energy data provider
        </label>
        <select
          className="block w-full rounded-lg border border-gray-600 bg-gray-700 p-2.5 text-sm text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
          id="edp"
          onChange={e => setEDP(e.target.value)}
          required={true}
          value={edp}
        >
          <option value="">Select your EDP</option>
          <option className="font-bold" value="IB1EDP">
            IB1 EDP
          </option>
        </select>
      </div>

      <div className="flex flex-row gap-4">
        {/*
        <button
          className={`
            text-md
            rounded-md
            px-4 py-2
            hover:bg-purple-400
            border-2 border-purple-400 bg-white text-black
            disabled:border disabled:border-gray-300 disabled:bg-gray-300 disabled:text-gray-500`
          }
          onClick={onBack}
        >
          <span>Back</span>
        </button>
        */}
        <button
          className={`
            text-md
            rounded-md
            bg-purple-600 px-4
            py-2
            text-white
            hover:bg-purple-800
            disabled:border disabled:border-gray-300 disabled:bg-gray-300 disabled:text-gray-500`}
          disabled={!edp}
          onClick={onSubmit}
        >
          <span>Continue</span>
        </button>
      </div>
    </form>
  )
}

export default FormCAPSelectEDP
