import { usePharmaVisualPivotStore } from '@/data/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Building2, Users, TrendingUp, Activity } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

export function Feed() {
  const navigate = useNavigate()
  const { companies } = usePharmaVisualPivotStore()

  // Mock feed data - in a real app this would come from an API
  const feedItems = [
    {
      id: 1,
      type: 'company_created',
      title: 'New Company Added',
      description: 'Vertex Pharmaceuticals has been added to the system',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      company: 'Vertex Pharmaceuticals'
    },
    {
      id: 2,
      type: 'contacts_imported',
      title: 'Contacts Imported',
      description: '1,250 contacts imported for AbbVie',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      company: 'AbbVie'
    },
    {
      id: 3,
      type: 'revenue_updated',
      title: 'Revenue Data Updated',
      description: 'Q3 2024 revenue data has been processed',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      company: 'Multiple Companies'
    },
    {
      id: 4,
      type: 'analytics_generated',
      title: 'Analytics Report Generated',
      description: 'Portfolio analytics report for Tier 1 companies',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      company: 'System'
    }
  ]

  const getIcon = (type: string) => {
    switch (type) {
      case 'company_created':
        return <Building2 className="h-4 w-4" />
      case 'contacts_imported':
        return <Users className="h-4 w-4" />
      case 'revenue_updated':
        return <TrendingUp className="h-4 w-4" />
      case 'analytics_generated':
        return <Activity className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'company_created':
        return 'text-blue-600'
      case 'contacts_imported':
        return 'text-green-600'
      case 'revenue_updated':
        return 'text-purple-600'
      case 'analytics_generated':
        return 'text-orange-600'
      default:
        return 'text-gray-600'
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else {
      return 'Just now'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-end justify-between gap-6 mb-6">
            <div>
              <button
                type="button"
                className="text-primary underline mb-4 block"
                onClick={() => navigate(-1)}
              >
                ← Back
              </button>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-pink-800 bg-clip-text text-transparent mb-3">
                Activity Feed
              </h1>
              <p className="text-lg text-muted-foreground font-light">
                Track recent activity and updates across the platform
              </p>
            </div>
          </div>
        </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Total Companies</span>
            </div>
            <p className="text-2xl font-bold">{Object.keys(companies).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Total Contacts</span>
            </div>
            <p className="text-2xl font-bold">
              {Object.values(companies).reduce((sum, c) => sum + c.contacts.length, 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Total Brands</span>
            </div>
            <p className="text-2xl font-bold">
              {Object.values(companies).reduce((sum, c) => sum + c.brands.length, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {feedItems.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className={`flex-shrink-0 ${getTypeColor(item.type)}`}>
                  {getIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{item.title}</h4>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(item.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {item.description}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {item.company}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {feedItems.length === 0 && (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Recent Activity</h3>
              <p className="text-muted-foreground">
                Activity will appear here as you use the system.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link 
              to="/import-manager" 
              className="inline-flex items-center gap-2 h-10 px-4 rounded-md border bg-background text-sm hover:bg-accent"
            >
              <Building2 className="h-4 w-4" />
              Import Manager
            </Link>
            <Link 
              to="/contacts" 
              className="inline-flex items-center gap-2 h-10 px-4 rounded-md border bg-background text-sm hover:bg-accent"
            >
              <Users className="h-4 w-4" />
              Contacts
            </Link>
            <Link 
              to="/analytics" 
              className="inline-flex items-center gap-2 h-10 px-4 rounded-md border bg-background text-sm hover:bg-accent"
            >
              <TrendingUp className="h-4 w-4" />
              Analytics
            </Link>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
