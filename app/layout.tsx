import { ReactNode } from 'react'

import './globals.css'

import ErrorBoundary from '@/app/error'
import Header from '@/components/Header'

type TProps = {
  children: ReactNode
}

const LocaleLayout = async ({ children }: TProps) => {
  return (
    <html id="v0.0.020" lang="en">
      <body className="h-full w-full bg-purple-100">
        <main className="flex h-full w-full flex-col overflow-hidden">
          <ErrorBoundary>
            <Header />
            {children}
          </ErrorBoundary>
        </main>
      </body>
    </html>
  )
}

export default LocaleLayout
