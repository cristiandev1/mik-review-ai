'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import ReactMarkdown from 'react-markdown'
import { Loader2, FileCode, GitPullRequest, Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'

interface ReviewComment {
  file: string
  lineNumber: string
  comment: string
}

interface Review {
  id: string
  repository: string
  pullRequest: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  summary: string
  comments: ReviewComment[]
  createdAt: string
  completedAt: string
  error?: string
}

export default function ReviewDetailsPage() {
  const params = useParams()
  const reviewId = params.id as string

  const { data: review, isLoading, isError } = useQuery<Review>({
    queryKey: ['review', reviewId],
    queryFn: async () => {
      const response = await api.get(`/v1/reviews/${reviewId}`)
      return response.data.data
    },
  })

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isError || !review) {
    return (
      <div className="p-8">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-500">Error loading review</CardTitle>
          </CardHeader>
          <CardContent>
            Could not fetch review details. Please try again later.
          </CardContent>
        </Card>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'failed': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'processing': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 mr-1" />
      case 'failed': return <XCircle className="h-4 w-4 mr-1" />
      case 'processing': return <Loader2 className="h-4 w-4 mr-1 animate-spin" />
      default: return <Clock className="h-4 w-4 mr-1" />
    }
  }

  // Group comments by file
  const commentsByFile = review.comments?.reduce((acc, comment) => {
    if (!acc[comment.file]) {
      acc[comment.file] = []
    }
    acc[comment.file].push(comment)
    return acc
  }, {} as Record<string, ReviewComment[]>) || {}

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Review Details</h1>
          <p className="text-muted-foreground flex items-center mt-1">
            <GitPullRequest className="h-4 w-4 mr-1" />
            {review.repository} #{review.pullRequest}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusColor(review.status)}`}>
            {getStatusIcon(review.status)}
            {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
          </div>
          <div className="text-sm text-muted-foreground flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {format(new Date(review.createdAt), 'PPP p')}
          </div>
        </div>
      </div>

      {/* Summary Section */}
      {review.summary && (
        <Card>
          <CardHeader>
            <CardTitle>AI Summary</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <ReactMarkdown>{review.summary}</ReactMarkdown>
          </CardContent>
        </Card>
      )}

      {/* Error Message (if failed) */}
      {review.error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">Review Failed</CardTitle>
          </CardHeader>
          <CardContent className="text-red-600 dark:text-red-400 font-mono text-sm">
            {review.error}
          </CardContent>
        </Card>
      )}

      {/* Comments Section */}
      <div className="grid gap-6">
        <h2 className="text-2xl font-semibold">Code Comments</h2>
        
        {Object.keys(commentsByFile).length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {review.status === 'completed' 
                ? 'No issues found in this review. Good job! 🎉'
                : 'Comments will appear here once the review is completed.'}
            </CardContent>
          </Card>
        ) : (
          Object.entries(commentsByFile).map(([file, comments]) => (
            <Card key={file}>
              <CardHeader className="bg-muted/50 py-3">
                <CardTitle className="text-base font-mono flex items-center">
                  <FileCode className="h-4 w-4 mr-2" />
                  {file}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {comments.map((comment, index) => (
                  <div 
                    key={index} 
                    className={`p-4 ${index !== comments.length - 1 ? 'border-b' : ''}`}
                  >
                    <div className="mb-2 text-xs font-medium text-muted-foreground bg-muted inline-block px-2 py-1 rounded">
                      Line {comment.lineNumber}
                    </div>
                    <div className="prose dark:prose-invert max-w-none text-sm">
                      <ReactMarkdown>{comment.comment}</ReactMarkdown>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
