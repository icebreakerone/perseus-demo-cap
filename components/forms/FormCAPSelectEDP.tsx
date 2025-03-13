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
        <label className="block mb-2 text-sm font-medium" htmlFor="countries">Your energy data provider</label>
        <select
          id="edp"
          onChange={e => setEDP(e.target.value)}
          className="border text-sm rounded-lg block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
          required={true}
        >
          <option selected>Select your EDP</option>
          <option value="IB1EDP">IB1<strong>EDP</strong></option>
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
            px-4 py-2
            bg-purple-600
            hover:bg-purple-800
            text-white
            disabled:border disabled:border-gray-300 disabled:bg-gray-300 disabled:text-gray-500`
          }
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
