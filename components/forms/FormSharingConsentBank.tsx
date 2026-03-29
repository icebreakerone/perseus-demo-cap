'use client'
import React from 'react'

interface IProps {
  onSubmit: (e: boolean) => void
}

const FormSharingConsentBank = ({ onSubmit }: IProps) => {
  const [selected, setSelected] = React.useState<boolean>(false)

  return (
    <form className="flex w-full flex-col gap-8">
      <div className="align-center flex w-[10rem] flex-row gap-4 border border-gray-600 p-4">
        <input
          checked={selected}
          className="block rounded-lg border border-gray-600 bg-gray-700 p-2.5 text-sm text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
          id="edp"
          onChange={e => setSelected(e.target.checked)}
          required={true}
          type="checkbox"
        />
        <label className="block text-sm font-medium" htmlFor="consent">
          I agree
        </label>
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
          disabled={!setSelected}
          onClick={() => onSubmit(selected)}
        >
          <span>Confirm</span>
        </button>
      </div>
    </form>
  )
}

export default FormSharingConsentBank
