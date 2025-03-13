'use client'
import React from 'react'

interface IProps {
  onSubmit: (e: any) => void
}

const FormCAPSelectLender = ({ onSubmit }: IProps) => {
  const [lender, setLender] = React.useState<string>('')

  return (
    <form className="flex w-full flex-col gap-8">
      <div className="flex w-full flex-col">
        <label className="block mb-2 text-sm font-medium" htmlFor="countries">Your lender</label>
        <select
          id="edp"
          onChange={e => setLender(e.target.value)}
          className="border text-sm rounded-lg block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
          required={true}
        >
          <option selected>Select your lender</option>
          <option value="IB1EDP">IB1<strong>Bank</strong></option>
        </select>
      </div>

      <div className="flex flex-row gap-4">
        <button
          className={`
            text-md
            rounded-md
            px-4 py-2
            bg-purple-600
            hover:bg-purple-800
            text-white
            disabled:border disabled:border-gray-300 disabled:bg-gray-300 disabled:text-gray-500`
          }
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
