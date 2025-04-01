'use client'
import React from 'react'
import Link from 'next/link'

interface IProps {
  onSubmit: (e: never) => void
}

const FormLoginCAP = ({ onSubmit }: IProps) => {
  const [email, setEmail] = React.useState<string>('')
  const [password, setPassword] = React.useState<string>('')

  return (
    <form className="flex w-full flex-col gap-8">
      <div className="flex w-full flex-col gap-6">
        <div className="flex flex-col justify-between gap-1">
          <label className="flex-1" htmlFor="username">
            Username
          </label>
          <input
            className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-4 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
            id="username"
            onChange={e => setEmail(e.target.value)}
            placeholder="Enter username"
            required={true}
            type="username"
          />
        </div>
        <div className="flex flex-col justify-between gap-1">
          <label className="flex-1" htmlFor="password">
            Password
          </label>
          <input
            className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-4 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
            id="password"
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter password"
            required={true}
            type="password"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
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
            disabled={!password || !email}
            onClick={onSubmit}
          >
            <span>Log on</span>
          </button>
        </div>
        <Link className="text-sm underline" href="#">
          Reset My Password
        </Link>
      </div>
    </form>
  )
}

export default FormLoginCAP
