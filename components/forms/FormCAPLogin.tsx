'use client'
import React from 'react'
import Link from "next/link";

interface IProps {
  onSubmit: (e: any) => void
}

const FormCAPLogin = ({ onSubmit }: IProps) => {
  const [email, setEmail] = React.useState<string>('')
  const [password, setPassword] = React.useState<string>('')

  return (
    <form className="flex w-full flex-col gap-8">
      <div className="flex w-full flex-col gap-8">
        <input
          id="email"
          onChange={e => setEmail(e.target.value)}
          className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-4 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
          placeholder="Enter email"
          required={true}
          type="email"
        />
        <input
          id="email"
          onChange={e => setPassword(e.target.value)}
          className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-4 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
          placeholder="Enter password"
          required={true}
          type="password"
        />
        <div className="flex w-full flex-col gap-2">
          <Link className="underline" href="#">Sign Up for a Portal Account</Link>
          <Link className="underline" href="#">Reset My Password</Link>
        </div>
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
          disabled={!password || !email}
          onClick={onSubmit}
        >
          <span>Log on</span>
        </button>
      </div>
    </form>
  )
}

export default FormCAPLogin
