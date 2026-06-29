import { Button } from '@heroui/react'

export function Footer() {
  return (
    <footer className="relative bg-linear-115 from-[#f8eec8] from-28% via-[#eab7d6] via-70% to-[#c8a4ef] sm:bg-linear-145 dark:from-[#2e2733] dark:via-[#3d3144] dark:to-[#4e4460]">
      <div className="absolute inset-2 rounded-4xl bg-background/80 backdrop-blur-sm" />
      <div className="px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:max-w-7xl">
          <div className="relative pt-20 pb-16 text-center sm:py-24">
            <hgroup>
              <h2 className="font-mono text-xs/5 font-semibold tracking-widest uppercase data-dark:text-gray-400">
                Get started
              </h2>
              <p className="mt-6 text-3xl font-medium tracking-tight sm:text-5xl">
                Ready to dive in?
                <br />
                Start your free trial today.
              </p>
            </hgroup>
            <p className="mx-auto mt-6 max-w-xs text-sm/6">
              Get the cheat codes for selling and unlock your team's revenue potential.
            </p>
            <Button className="mt-6" size="lg">Get started</Button>
          </div>
          <div className="pb-16"></div>
        </div>
      </div>
    </footer>
  )
}
