'use client'
import ErrorBoundary from '@/app/error'

const Header = () => {
  return (
    <ErrorBoundary>
      <header className="flex w-full flex-col gap-4 items-center">
        <div className="flex bg-purple-900 py-2 px-8 w-full">
          <h1 className="text-3xl font-normal text-white text-center w-full">IB1<strong>CAP</strong> Demo</h1>
        </div>
      </header>
    </ErrorBoundary>
  )
}

export default Header
