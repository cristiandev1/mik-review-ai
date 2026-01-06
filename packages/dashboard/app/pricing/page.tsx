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
    question: 'How does the seat-based billing model work?',
    answer:
      'You purchase seats upfront for a month. Each seat allows one developer to receive reviews automatically. Hobby: $5/month per seat. Pro: $15/month per seat. Payment is taken at the beginning of the month.',
  },
  {
    question: 'What is the difference between Whitelist Mode and Auto-Add Mode?',
    answer:
      'Whitelist Mode: You manually add developers who can access reviews. When you add someone, they are charged. Auto-Add Mode: Any developer can open a PR (while seats are available). Developers are automatically assigned and charged.',
  },
  {
    question: 'What happens when there are no available seats?',
    answer:
      'The system blocks the PR with a clear message. You receive an email suggesting to purchase +1 seat for $5 (Hobby) or $15 (Pro).',
  },
  {
    question: 'Can I remove a developer?',
    answer:
      'Yes! Remove them from your list and receive a proportional credit on your next bill, saving $5 (Hobby) or $15 (Pro) per month.',
  },
  {
    question: 'What happens if my payment fails?',
    answer:
      'Reviews are blocked until payment is resolved. You will receive an email and see a warning in your dashboard.',
  },
  {
    question: 'Can I change plans?',
    answer:
      'Yes! Switch between Hobby and Pro anytime. The difference is adjusted on your next bill.',
  },
  {
    question: 'Is there a free trial?',
    answer:
      'Yes! All new users get 3 free reviews OR 300k tokens (whichever runs out first). Test without a credit card!',
  },
  {
    question: 'How is consumption tracked?',
    answer:
      'Consumption is tracked per developer. Each PR processed and tokens used are recorded in your dashboard.',
  },
  {
    question: 'Can I use one plan across multiple repositories?',
    answer:
      'Yes! Seats are managed per repository. You can have some repositories on Hobby and others on Pro.',
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
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
          Pay for what you need, scale as your team grows. Buy seats upfront, use reviews for a full month.
        </p>
      </div>

      {/* Free Trial Banner */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <Card className="bg-slate-50 border border-slate-200">
          <CardContent className="py-8">
            <div className="text-center">
              <h3 className="font-semibold text-slate-900 mb-2 text-lg">
                Free Trial for Everyone
              </h3>
              <p className="text-slate-600 text-sm md:text-base max-w-2xl mx-auto">
                Get <strong>3 free reviews</strong> or <strong>300,000 tokens</strong> (whichever runs out first). Test the full power of AI code reviews with no credit card required.
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
                  <span className="text-slate-700">1 included seat</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-slate-900 flex-shrink-0" />
                  <span className="text-slate-700">Unlimited additional seats</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-slate-900 flex-shrink-0" />
                  <span className="text-slate-700">Whitelist + Auto-Add modes</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-slate-900 flex-shrink-0" />
                  <span className="text-slate-700">Priority support</span>
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
                  <span className="text-slate-700">1 included seat</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-slate-900 flex-shrink-0" />
                  <span className="text-slate-700">Unlimited additional seats</span>
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
                  <span className="text-slate-700">API access</span>
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
                  <td className="text-center py-3 px-4 text-sm text-slate-600">3</td>
                  <td className="text-center py-3 px-4 text-sm text-slate-600">Unlimited</td>
                  <td className="text-center py-3 px-4 text-sm text-slate-600">Unlimited</td>
                </tr>
                <tr className="border-b border-slate-200 hover:bg-white transition-colors">
                  <td className="py-3 px-4 text-slate-700">Developer seats</td>
                  <td className="text-center py-3 px-4 text-sm text-slate-600">1</td>
                  <td className="text-center py-3 px-4 text-sm text-slate-600">Unlimited</td>
                  <td className="text-center py-3 px-4 text-sm text-slate-600">Unlimited</td>
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
          How Seat-Based Billing Works
        </h2>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle className="text-xl">Whitelist Mode</CardTitle>
              <p className="text-sm text-slate-500 mt-2">Perfect for closed teams</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="space-y-3 text-sm text-slate-700">
                <li className="flex gap-3">
                  <span className="font-semibold flex-shrink-0 text-slate-900">1.</span>
                  <span>You manually add developers to your repository</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold flex-shrink-0 text-slate-900">2.</span>
                  <span>Each dev is charged $5 (Hobby) or $15 (Pro) per month</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold flex-shrink-0 text-slate-900">3.</span>
                  <span>They get unlimited reviews on your repository</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold flex-shrink-0 text-slate-900">4.</span>
                  <span>Remove anytime for a proportional credit</span>
                </li>
              </ol>
              <div className="bg-slate-50 p-3 rounded border border-slate-200 mt-4 text-sm text-slate-700">
                <strong>Example:</strong> 3 team members on Hobby = 3 × $5 = $15/month
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle className="text-xl">Auto-Add Mode</CardTitle>
              <p className="text-sm text-slate-500 mt-2">Great for dynamic teams</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="space-y-3 text-sm text-slate-700">
                <li className="flex gap-3">
                  <span className="font-semibold flex-shrink-0 text-slate-900">1.</span>
                  <span>Any developer can open a PR</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold flex-shrink-0 text-slate-900">2.</span>
                  <span>If seats available, they get one automatically</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold flex-shrink-0 text-slate-900">3.</span>
                  <span>You are charged for each dev that uses a seat</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold flex-shrink-0 text-slate-900">4.</span>
                  <span>No seats left? PR is blocked with helpful message</span>
                </li>
              </ol>
              <div className="bg-slate-50 p-3 rounded border border-slate-200 mt-4 text-sm text-slate-700">
                <strong>Example:</strong> 5 seats bought, 3 devs open PRs = 3 × $5 = $15/month
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Predictable Costs</h4>
            <p className="text-slate-600 text-sm">Know exactly what you will pay each month. No surprises.</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Protected Revenue</h4>
            <p className="text-slate-600 text-sm">You only pay for seats you buy. We never lose reviews.</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Instant Feedback</h4>
            <p className="text-slate-600 text-sm">Developers get AI reviews immediately when opening PRs.</p>
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
