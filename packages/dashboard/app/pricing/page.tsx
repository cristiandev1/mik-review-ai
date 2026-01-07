'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/icons'

interface FAQItem {
  question: string
  answer: string
}

const faqs: FAQItem[] = [
  {
    question: 'How does the free trial work?',
    answer:
      'All new users get 3 free code reviews. No credit card required to get started. Once you use all 3 reviews, you must upgrade to a paid plan to continue.',
  },
  {
    question: 'What is the difference between Hobby and Pro plans?',
    answer:
      'Hobby: 15 reviews per month per seat at $5/month. Pro: 100 reviews per month per seat at $15/month. Both plans include whitelist and auto-add modes for seat management.',
  },
  {
    question: 'How does seat-based billing work?',
    answer:
      'You pay per developer seat per month. Hobby: $5/month per seat. Pro: $15/month per seat. A seat is assigned when a developer opens a PR and can be manually managed or automatically assigned depending on your settings.',
  },
  {
    question: 'Can I switch between Hobby and Pro?',
    answer:
      'Yes! You can upgrade or downgrade anytime. The difference in pricing is adjusted on your next billing cycle.',
  },
  {
    question: 'What is Whitelist Mode?',
    answer:
      'You manually add developers to your repository via the dashboard. When you add someone, they get a seat and start being charged immediately. Remove them anytime for a proportional credit.',
  },
  {
    question: 'What is Auto-Add Mode?',
    answer:
      'Any developer can open a PR. If you have available seats, they are automatically assigned one and charged. If no seats are available, the PR is blocked with a helpful message.',
  },
  {
    question: 'What happens when I exceed my monthly limit?',
    answer:
      'You cannot create new reviews once you reach your monthly limit. You must wait until the next month or upgrade to a higher plan with more reviews.',
  },
  {
    question: 'How is consumption tracked?',
    answer:
      'Consumption is tracked per developer per month. Your dashboard shows usage in real-time, including PRs processed and alerts when nearing your limit.',
  },
  {
    question: 'Can I use different plans for different repositories?',
    answer:
      'Yes! Each repository can have its own plan. You could have one repository on Hobby and another on Pro, depending on your needs.',
  },
]

export default function PricingPage() {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-slate-200">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Icons.logo className="h-6 w-6" />
            <Link href="/" className="text-xl font-semibold tracking-tight">
              Mik Review AI
            </Link>
          </div>
          <div className="space-x-3">
            <Link href="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-slate-900 hover:bg-slate-800 text-white">Get Started</Button>
            </Link>
          </div>
        </nav>
      </div>

      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 tracking-tight">
          AI Code Reviews Made Simple
        </h1>
        <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
          Start free with 3 reviews. Upgrade when you&apos;re ready. Pay per seat, get unlimited reviews on your plan.
        </p>
      </div>

      {/* Free Trial Banner */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
          <CardContent className="py-8">
            <div className="text-center">
              <h3 className="font-semibold text-slate-900 mb-2 text-lg">
                Free Trial for Everyone
              </h3>
              <p className="text-slate-600 text-sm md:text-base max-w-2xl mx-auto">
                Get <strong>3 free code reviews</strong> with zero credit card required. After that, upgrade to unlock unlimited reviews and unlock the power of AI-powered code reviews.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Free Trial Card */}
          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle className="text-2xl">Free Trial</CardTitle>
              <p className="text-sm text-slate-500 mt-2">Get started instantly</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="text-4xl font-bold text-slate-900">Free</div>
                <p className="text-sm text-slate-500 mt-1">3 reviews or 300k tokens</p>
              </div>

              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-slate-900 flex-shrink-0" />
                  <span className="text-slate-700">3 free reviews</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-slate-900 flex-shrink-0" />
                  <span className="text-slate-700">Full AI power</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-slate-900 flex-shrink-0" />
                  <span className="text-slate-700">No credit card</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-slate-900 flex-shrink-0" />
                  <span className="text-slate-700">Custom rules</span>
                </li>
                <li className="flex items-center gap-3">
                  <X className="w-5 h-5 text-slate-300 flex-shrink-0" />
                  <span className="text-slate-500">Additional seats</span>
                </li>
              </ul>

              <Link href="/signup" className="block">
                <Button className="w-full" variant="outline">Start Free Trial</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Hobby Card */}
          <Card className="border-2 border-slate-900 shadow-md">
            <CardHeader>
              <CardTitle className="text-2xl">Hobby</CardTitle>
              <p className="text-sm text-slate-500 mt-2">Perfect for small teams</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="text-4xl font-bold text-slate-900">
                  $5<span className="text-lg text-slate-500">/month</span>
                </div>
                <p className="text-sm text-slate-500 mt-1">per developer seat</p>
              </div>

              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-slate-900 flex-shrink-0" />
                  <span className="text-slate-700">15 reviews per month</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-slate-900 flex-shrink-0" />
                  <span className="text-slate-700">Per seat billing</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-slate-900 flex-shrink-0" />
                  <span className="text-slate-700">Whitelist + Auto-Add modes</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-slate-900 flex-shrink-0" />
                  <span className="text-slate-700">Email support</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-slate-900 flex-shrink-0" />
                  <span className="text-slate-700">Full AI power</span>
                </li>
              </ul>

              <Link href="/signup" className="block">
                <Button className="w-full" variant="outline">Choose Hobby</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Pro Card */}
          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle className="text-2xl">Pro</CardTitle>
              <p className="text-sm text-slate-500 mt-2">For growing teams</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="text-4xl font-bold text-slate-900">
                  $15<span className="text-lg text-slate-500">/month</span>
                </div>
                <p className="text-sm text-slate-500 mt-1">per developer seat</p>
              </div>

              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-slate-900 flex-shrink-0" />
                  <span className="text-slate-700">100 reviews per month</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-slate-900 flex-shrink-0" />
                  <span className="text-slate-700">Per seat billing</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-slate-900 flex-shrink-0" />
                  <span className="text-slate-700">Whitelist + Auto-Add modes</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-slate-900 flex-shrink-0" />
                  <span className="text-slate-700">Advanced analytics</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-slate-900 flex-shrink-0" />
                  <span className="text-slate-700">Priority support (24/7)</span>
                </li>
              </ul>

              <Link href="/signup" className="block">
                <Button className="w-full" variant="outline">Choose Pro</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Feature Comparison */}
      <div className="bg-slate-50 py-20 border-t border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">
            Feature Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-300">
                  <th className="text-left py-4 px-4 font-semibold text-slate-900">Feature</th>
                  <th className="text-center py-4 px-4 font-semibold text-slate-900">Free Trial</th>
                  <th className="text-center py-4 px-4 font-semibold text-slate-900">Hobby</th>
                  <th className="text-center py-4 px-4 font-semibold text-slate-900">Pro</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-200 hover:bg-white transition-colors">
                  <td className="py-3 px-4 text-slate-700">Reviews per month</td>
                  <td className="text-center py-3 px-4 text-sm text-slate-600">3 (Total)</td>
                  <td className="text-center py-3 px-4 text-sm text-slate-600">15 per seat</td>
                  <td className="text-center py-3 px-4 text-sm text-slate-600">100 per seat</td>
                </tr>
                <tr className="border-b border-slate-200 hover:bg-white transition-colors">
                  <td className="py-3 px-4 text-slate-700">Billing cycle</td>
                  <td className="text-center py-3 px-4 text-sm text-slate-600">One-time</td>
                  <td className="text-center py-3 px-4 text-sm text-slate-600">Monthly</td>
                  <td className="text-center py-3 px-4 text-sm text-slate-600">Monthly</td>
                </tr>
                <tr className="border-b border-slate-200 hover:bg-white transition-colors">
                  <td className="py-3 px-4 text-slate-700">Whitelist Mode</td>
                  <td className="text-center py-3 px-4"><X className="w-5 h-5 text-slate-300 mx-auto" /></td>
                  <td className="text-center py-3 px-4"><Check className="w-5 h-5 text-slate-900 mx-auto" /></td>
                  <td className="text-center py-3 px-4"><Check className="w-5 h-5 text-slate-900 mx-auto" /></td>
                </tr>
                <tr className="border-b border-slate-200 hover:bg-white transition-colors">
                  <td className="py-3 px-4 text-slate-700">Auto-Add Mode</td>
                  <td className="text-center py-3 px-4"><X className="w-5 h-5 text-slate-300 mx-auto" /></td>
                  <td className="text-center py-3 px-4"><Check className="w-5 h-5 text-slate-900 mx-auto" /></td>
                  <td className="text-center py-3 px-4"><Check className="w-5 h-5 text-slate-900 mx-auto" /></td>
                </tr>
                <tr className="border-b border-slate-200 hover:bg-white transition-colors">
                  <td className="py-3 px-4 text-slate-700">Custom rules</td>
                  <td className="text-center py-3 px-4"><Check className="w-5 h-5 text-slate-900 mx-auto" /></td>
                  <td className="text-center py-3 px-4"><Check className="w-5 h-5 text-slate-900 mx-auto" /></td>
                  <td className="text-center py-3 px-4"><Check className="w-5 h-5 text-slate-900 mx-auto" /></td>
                </tr>
                <tr className="border-b border-slate-200 hover:bg-white transition-colors">
                  <td className="py-3 px-4 text-slate-700">Analytics</td>
                  <td className="text-center py-3 px-4"><X className="w-5 h-5 text-slate-300 mx-auto" /></td>
                  <td className="text-center py-3 px-4"><Check className="w-5 h-5 text-slate-900 mx-auto" /></td>
                  <td className="text-center py-3 px-4"><Check className="w-5 h-5 text-slate-900 mx-auto" /></td>
                </tr>
                <tr className="hover:bg-white transition-colors">
                  <td className="py-3 px-4 text-slate-700">Support</td>
                  <td className="text-center py-3 px-4 text-sm text-slate-600">Community</td>
                  <td className="text-center py-3 px-4 text-sm text-slate-600">Email</td>
                  <td className="text-center py-3 px-4 text-sm text-slate-600">24/7 Priority</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-slate-900 mb-16 text-center">
          Get Started in Minutes
        </h2>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle className="text-xl">1. Sign Up Free</CardTitle>
              <p className="text-sm text-slate-500 mt-2">No credit card required</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="space-y-3 text-sm text-slate-700">
                <li className="flex gap-3">
                  <span className="font-semibold flex-shrink-0 text-slate-900">a.</span>
                  <span>Create an account with your GitHub</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold flex-shrink-0 text-slate-900">b.</span>
                  <span>Get 3 free code reviews instantly</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold flex-shrink-0 text-slate-900">c.</span>
                  <span>Test the full AI power</span>
                </li>
              </ol>
            </CardContent>
          </Card>

          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle className="text-xl">2. Configure Your Repo</CardTitle>
              <p className="text-sm text-slate-500 mt-2">Choose your settings</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="space-y-3 text-sm text-slate-700">
                <li className="flex gap-3">
                  <span className="font-semibold flex-shrink-0 text-slate-900">a.</span>
                  <span>Select repositories for review</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold flex-shrink-0 text-slate-900">b.</span>
                  <span>Choose Whitelist or Auto-Add mode</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold flex-shrink-0 text-slate-900">c.</span>
                  <span>Set custom review rules (optional)</span>
                </li>
              </ol>
            </CardContent>
          </Card>

          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle className="text-xl">3. Upgrade When Ready</CardTitle>
              <p className="text-sm text-slate-500 mt-2">Scale with confidence</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="space-y-3 text-sm text-slate-700">
                <li className="flex gap-3">
                  <span className="font-semibold flex-shrink-0 text-slate-900">a.</span>
                  <span>Choose Hobby ($5) or Pro ($15) per seat</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold flex-shrink-0 text-slate-900">b.</span>
                  <span>Add team members as seats</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold flex-shrink-0 text-slate-900">c.</span>
                  <span>Start getting AI-powered reviews</span>
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Try Before You Pay</h4>
            <p className="text-slate-600 text-sm">3 free reviews to test the platform. No commitment, no credit card needed.</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Pay Per Seat</h4>
            <p className="text-slate-600 text-sm">Only pay for developers who actually use code reviews. Scale up or down anytime.</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Actionable Reviews</h4>
            <p className="text-slate-600 text-sm">Get detailed AI-powered feedback on code quality, security, and best practices.</p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-slate-50 py-20 border-t border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:bg-white transition-colors border border-slate-200"
                onClick={() => toggleFAQ(index)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base md:text-base font-semibold">{faq.question}</CardTitle>
                    {expandedFAQ === index ? (
                      <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    )}
                  </div>
                </CardHeader>

                {expandedFAQ === index && (
                  <CardContent>
                    <p className="text-slate-600 text-sm">{faq.answer}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500">
          <p>&copy; 2026 Mik Review AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
