'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/icons'

export default function BillingExamplePage() {
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
          <Link href="/pricing">
            <Button variant="outline">← Back to Pricing</Button>
          </Link>
        </nav>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Real-World Billing Examples
          </h1>
          <p className="text-xl text-slate-600">
            See how our seat-based pricing works in different scenarios
          </p>
        </div>

        {/* Example 1 */}
        <Card className="border border-slate-200 mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Example 1: Solo Developer</CardTitle>
            <p className="text-sm text-slate-500 mt-2">You are a freelancer building a side project</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-slate-900 mb-4">Setup:</h4>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li>• Plan: <strong>Hobby ($5/month)</strong></li>
                  <li>• Repository: my-project</li>
                  <li>• Mode: Auto-Add</li>
                  <li>• Seats: 1 (just you)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-4">What Happens:</h4>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li>✓ You open a PR → Get review</li>
                  <li>✓ Monthly cost: <strong>$5</strong></li>
                  <li>✓ No one else can use (0 seats left)</li>
                </ul>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded border border-slate-200">
              <div className="text-sm text-slate-600 mb-2">Invoice at month end:</div>
              <div className="text-3xl font-bold text-slate-900 mb-1">$5.00</div>
              <div className="text-xs text-slate-500">Hobby plan (1 seat) × $5/month</div>
            </div>
          </CardContent>
        </Card>

        {/* Example 2 */}
        <Card className="border border-slate-200 mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Example 2: Small Team (Whitelist Mode)</CardTitle>
            <p className="text-sm text-slate-500 mt-2">You manage 3 developers with defined members</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-slate-900 mb-4">Setup:</h4>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li>• Plan: <strong>Hobby ($5/month)</strong></li>
                  <li>• Repository: team-project</li>
                  <li>• Mode: <strong>Whitelist</strong></li>
                  <li>• Authorized devs:</li>
                  <ul className="ml-6 space-y-1">
                    <li>• @you</li>
                    <li>• @alice</li>
                    <li>• @bob</li>
                  </ul>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-4">What Happens:</h4>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li>✓ @you, @alice, @bob → get reviews</li>
                  <li>✓ Anyone else → blocked</li>
                  <li>✓ Remove @bob anytime for -$5</li>
                  <li>✓ Add @charlie for +$5</li>
                </ul>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded border border-slate-200">
              <div className="text-sm text-slate-600 mb-3">Invoice at month end:</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Hobby plan (you)</span>
                  <span className="font-semibold">$5.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Additional seat (@alice)</span>
                  <span className="font-semibold">$5.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Additional seat (@bob)</span>
                  <span className="font-semibold">$5.00</span>
                </div>
                <div className="border-t border-slate-300 pt-2 flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-slate-900">$15.00</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Example 3 */}
        <Card className="border border-slate-200 mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Example 3: Growing Team (Auto-Add Mode)</CardTitle>
            <p className="text-sm text-slate-500 mt-2">Your team grows, you want flexibility</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-slate-900 mb-4">Setup:</h4>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li>• Plan: <strong>Pro ($15/month)</strong></li>
                  <li>• Repository: enterprise-app</li>
                  <li>• Mode: <strong>Auto-Add</strong></li>
                  <li>• Seats purchased: <strong>5</strong></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-4">What Happens:</h4>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li>✓ 5 devs open PRs → auto-assigned</li>
                  <li>✓ 6th dev tries → blocked</li>
                  <li>✓ You get email: &quot;Buy more seats?&quot;</li>
                  <li>✓ Cost scales with growth</li>
                </ul>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded border border-slate-200">
              <div className="text-sm text-slate-600 mb-3">Month 1 (3 devs open PRs):</div>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span>Pro seat 1</span>
                  <span className="font-semibold">$15.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Pro seat 2 (@alice)</span>
                  <span className="font-semibold">$15.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Pro seat 3 (@bob)</span>
                  <span className="font-semibold">$15.00</span>
                </div>
                <div className="border-t border-slate-300 pt-2 flex justify-between font-semibold">
                  <span>Month 1 Total</span>
                  <span className="text-slate-900">$45.00</span>
                </div>
              </div>

              <div className="text-sm text-slate-600 mb-3">Month 2 (5 devs open PRs):</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Pro seats (5 × $15)</span>
                  <span className="font-semibold">$75.00</span>
                </div>
                <div className="border-t border-slate-300 pt-2 flex justify-between font-semibold">
                  <span>Month 2 Total</span>
                  <span className="text-slate-900">$75.00</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Example 4 */}
        <Card className="border border-slate-200 mb-12">
          <CardHeader>
            <CardTitle className="text-2xl">Example 4: Open Source Project</CardTitle>
            <p className="text-sm text-slate-500 mt-2">Many contributors, scale gracefully</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-slate-900 mb-4">Setup:</h4>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li>• Plan: <strong>Hobby ($5/month)</strong></li>
                  <li>• Repository: awesome-library</li>
                  <li>• Mode: <strong>Auto-Add</strong></li>
                  <li>• Seats purchased: <strong>10</strong></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-4">What Happens:</h4>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li>✓ 10 contributors → all get reviews</li>
                  <li>✓ 11th contributor → blocked</li>
                  <li>✓ You buy +5 seats for $25</li>
                  <li>✓ Scale your community predictably</li>
                </ul>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded border border-slate-200">
              <div className="text-sm text-slate-600 mb-2">For 10 active contributors:</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Hobby seats (10 × $5)</span>
                  <span className="font-semibold">$50.00</span>
                </div>
                <div className="border-t border-slate-300 pt-2 flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-slate-900">$50.00</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick FAQ */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">What if a developer leaves?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              Remove them to get a credit. Seats automatically open in Auto-Add mode.
            </CardContent>
          </Card>

          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Can I switch modes?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              Yes! Switch anytime between Whitelist and Auto-Add. Adjustments are proportional.
            </CardContent>
          </Card>

          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">What if I exceed seats?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              New developers get blocked with a message. You get an email suggesting to buy more.
            </CardContent>
          </Card>

          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Can I have different plans per repo?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              Yes! Some repos on Hobby, others on Pro. Each repo is independent.
            </CardContent>
          </Card>
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
