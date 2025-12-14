'use client'

import { useState } from 'react'
import { BookOpen, Video, FileText, Download, ExternalLink, CheckCircle, Play, Clock } from 'lucide-react'

interface TrainingItem {
  id: string
  title: string
  description: string
  type: 'video' | 'document' | 'article' | 'quiz'
  category: string
  duration?: string // e.g., "5 min read" or "12:30"
  url: string
  completed?: boolean
  required?: boolean
}

interface TrainingSectionProps {
  items: TrainingItem[]
  loading?: boolean
  title?: string
  showProgress?: boolean
  categories?: string[]
  onComplete?: (itemId: string) => void
}

export default function TrainingSection({
  items,
  loading = false,
  title = 'Training & Resources',
  showProgress = true,
  categories,
  onComplete,
}: TrainingSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const allCategories = categories || [...new Set(items.map(i => i.category))]
  
  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter(i => i.category === selectedCategory)

  const completedCount = items.filter(i => i.completed).length
  const requiredCount = items.filter(i => i.required).length
  const requiredCompleted = items.filter(i => i.required && i.completed).length

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-5 h-5 text-red-400" />
      case 'document': return <FileText className="w-5 h-5 text-blue-400" />
      case 'article': return <BookOpen className="w-5 h-5 text-green-400" />
      case 'quiz': return <CheckCircle className="w-5 h-5 text-purple-400" />
      default: return <FileText className="w-5 h-5 text-[#64748B]" />
    }
  }

  const getTypeBg = (type: string) => {
    switch (type) {
      case 'video': return 'bg-red-500/20'
      case 'document': return 'bg-blue-500/20'
      case 'article': return 'bg-green-500/20'
      case 'quiz': return 'bg-purple-500/20'
      default: return 'bg-[#2D3B5F]'
    }
  }

  return (
    <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl">
      {/* Header */}
      <div className="p-4 border-b border-[#2D3B5F]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {showProgress && (
            <div className="text-sm text-[#94A3B8]">
              {completedCount}/{items.length} completed
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-[#64748B] mb-1">
              <span>Progress</span>
              <span>{Math.round((completedCount / items.length) * 100)}%</span>
            </div>
            <div className="h-2 bg-[#0A0F2C] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#0EA5E9] transition-all duration-300"
                style={{ width: `${(completedCount / items.length) * 100}%` }}
              />
            </div>
            {requiredCount > 0 && (
              <div className="text-xs text-[#64748B] mt-1">
                {requiredCompleted}/{requiredCount} required items completed
              </div>
            )}
          </div>
        )}

        {/* Category Filter */}
        {allCategories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-[#0EA5E9] text-white'
                  : 'bg-[#0A0F2C] text-[#94A3B8] hover:text-white'
              }`}
            >
              All
            </button>
            {allCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[#0EA5E9] text-white'
                    : 'bg-[#0A0F2C] text-[#94A3B8] hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Items List */}
      <div className="divide-y divide-[#2D3B5F]">
        {loading ? (
          <div className="p-8 text-center text-[#64748B]">Loading resources...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center text-[#64748B]">No resources available</div>
        ) : (
          filteredItems.map(item => (
            <div
              key={item.id}
              className="p-4 hover:bg-[#0A0F2C]/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 ${getTypeBg(item.type)} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  {getTypeIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{item.title}</span>
                        {item.required && (
                          <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">
                            Required
                          </span>
                        )}
                        {item.completed && (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        )}
                      </div>
                      <div className="text-[#64748B] text-sm mt-1">{item.description}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-[#64748B] text-xs uppercase tracking-wide">
                      {item.category}
                    </span>
                    {item.duration && (
                      <span className="flex items-center gap-1 text-[#64748B] text-xs">
                        <Clock className="w-3 h-3" />
                        {item.duration}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0EA5E9] text-white rounded-lg text-sm hover:bg-[#0EA5E9]/80 transition-colors"
                    >
                      {item.type === 'video' ? (
                        <>
                          <Play className="w-4 h-4" />
                          Watch
                        </>
                      ) : item.type === 'quiz' ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Start Quiz
                        </>
                      ) : (
                        <>
                          <BookOpen className="w-4 h-4" />
                          Read
                        </>
                      )}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    
                    {!item.completed && onComplete && (
                      <button
                        onClick={() => onComplete(item.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A0F2C] text-[#94A3B8] rounded-lg text-sm hover:text-white hover:bg-[#2D3B5F] transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
