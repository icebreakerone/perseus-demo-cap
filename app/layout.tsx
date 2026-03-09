import { ReactNode } from 'react'
import type { Metadata } from 'next'

import './globals.css'

import ErrorBoundary from '@/app/error'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: 'Perseus Demo Cap',
  description: 'IB1 CAP Demo - Perseus Energy Data Platform',
}

type TProps = {
  children: ReactNode
}

const LocaleLayout = async ({ children }: TProps) => {
  return (
    <html id="v0.1.5" lang="en">
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
