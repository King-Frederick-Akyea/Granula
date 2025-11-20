import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    redirect('/dashboard')
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-blue-50/50 via-white to-white">

        <header className="absolute inset-x-0 top-0 z-50">
          <div className="container mx-auto px-6 py-6 flex justify-between items-center">
            <div className="text-3xl font-bold text-primary">Granula</div>
            <nav className="flex items-center gap-4">
              <Link
                href="/auth/login"
                className="text-foreground/80 hover:text-primary font-medium transition"
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition"
              >
                Get started free
              </Link>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <section className="pt-32 pb-20">
          <div className="container mx-auto px-6 text-center">
            <div className="max-w-4xl mx-auto space-y-8">
              <h1 className="text-5xl md:text-7xl font-extrabold text-foreground leading-tight text-balance">
                Work feels better when it&apos;s <span className="text-primary">visual</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
                Granula gives your team one flexible place to plan, organize, and ship — without the chaos.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                <Link
                  href="/auth/signup"
                  className="bg-primary text-primary-foreground px-9 py-4 rounded-lg text-lg font-semibold hover:opacity-90 transition shadow-lg"
                >
                  Start for free
                </Link>
                <Link
                  href="/auth/login"
                  className="border border-gray-300 text-foreground px-9 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition"
                >
                  Sign in
                </Link>
              </div>
            </div>

            {/* <div className="mt-24 max-w-6xl mx-auto bg-gray-100 border-2 border-dashed border-gray-300 rounded-2xl h-96 flex items-center justify-center text-gray-400">
              <img
                src="/granula.png"
                alt="Granula app"
                // className="max-h-full max-w-full object-contain"
              />
            </div> */}
          </div>
        </section>

        {/* Features */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                Everything your team needs
              </h2>
              <p className="mt-4 text-xl text-muted-foreground">
                Simple enough for anyone. Powerful enough for everyone.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-9 h-9 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 10h16M10 4v16" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold mb-3">Boards</h3>
                <p className="text-muted-foreground">Visualize every project with customizable boards, lists, and cards.</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-9 h-9 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold mb-3">Collaboration</h3>
                <p className="text-muted-foreground">Real-time updates, comments, mentions, and file attachments.</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-9 h-9 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold mb-3">Speed</h3>
                <p className="text-muted-foreground">Drag and drop, keyboard shortcuts, automation — ship faster.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24">
          <div className="container mx-auto px-6 text-center">
            <div className="max-w-10xl mx-auto bg-primary text-primary-foreground rounded-2xl p-16 space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold">
                Ready to transform how your team works?
              </h2>
              <p className="text-xl opacity-90">
                Free forever for unlimited boards and cards. No credit card required.
              </p>
              <Link
                href="/auth/signup"
                className="inline-block bg-white text-primary px-10 py-4 rounded-lg text-lg font-semibold hover:opacity-90 transition shadow-xl"
              >
                Start for free
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-200 py-10">
          <div className="container mx-auto px-6 text-center text-muted-foreground text-sm">
            <p>© 2025 Granula. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  )
}