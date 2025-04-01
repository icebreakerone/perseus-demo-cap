'use client'
import ErrorBoundary from '@/app/error'

const Header = () => {
  return (
    <ErrorBoundary>
      <header className="flex w-full flex-col items-center gap-4">
        <div className="flex w-full bg-purple-900 px-8 py-2">
          <h1 className="w-full text-center text-3xl font-normal text-white">
            IB1<strong>CAP</strong> Demo
          </h1>
        </div>
      </header>
    </ErrorBoundary>
  )
}

export default Header
