'use client'
import React from 'react'

interface IProps {
  onSubmit: (e: any) => void
}

const FormCAPSharingConsent = ({ onSubmit }: IProps) => {
  const [selected, setSelected] = React.useState<boolean>(false)

  return (
    <form className="flex w-full flex-col gap-8">
      <div className="flex w-full flex-col">
        <label className="block mb-2 text-sm font-medium" htmlFor="countries">Your energy data provider</label>
        <input
          id="edp"
          onChange={e => setSelected(e.target.checked)}
          className="border text-sm rounded-lg block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
          required={true}
          checked={selected}
          type="checkbox"
        />
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
          disabled={!setSelected}
          onClick={onSubmit}
        >
          <span>Confirm</span>
        </button>
      </div>
    </form>
  )
}

export default FormCAPSharingConsent
