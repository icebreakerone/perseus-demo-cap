'use client'
import React from 'react'

interface IProps {
  onSubmit: (e: never) => void
}

const FormCAPSelectLender = ({ onSubmit }: IProps) => {
  const [lender, setLender] = React.useState<string>('')

  return (
    <form className="flex w-full flex-col gap-8">
      <div className="flex w-full flex-col">
        <label className="mb-2 block text-sm font-medium" htmlFor="countries">
          Your lender
        </label>
        <select
          className="block w-full rounded-lg border border-gray-600 bg-gray-700 p-2.5 text-sm text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
          id="edp"
          onChange={e => setLender(e.target.value)}
          required={true}
        >
          <option selected>Select your lender</option>
          <option value="IB1Bank">
            IB1<strong>Bank</strong>
          </option>
        </select>
      </div>

      <div className="flex flex-row gap-4">
        <button
          className={`
            text-md
            rounded-md
            bg-purple-600 px-4
            py-2
            text-white
            hover:bg-purple-800
            disabled:border disabled:border-gray-300 disabled:bg-gray-300 disabled:text-gray-500`}
          disabled={!lender}
          onClick={onSubmit}
        >
          <span>Confirm</span>
        </button>
      </div>
    </form>
  )
}

export default FormCAPSelectLender
