import { type ReactNode } from 'react'
import Footer from './Footer'

interface AuthLayoutProps {
  children: ReactNode
  title: string
}

export default function AuthLayout({ children, title }: AuthLayoutProps) {
  return (
    <div className="bg-background text-on-surface antialiased min-h-screen flex flex-col font-poppins text-body-md">
      <main className="flex-grow flex items-center justify-center px-6 sm:px-8">
        <div className="w-full max-w-sm flex flex-col gap-12">
          <div className="text-center">
            <h1 className="font-poppins text-h1 text-on-surface">{title}</h1>
          </div>
          {children}
        </div>
      </main>
      <Footer />
    </div>
  )
}
