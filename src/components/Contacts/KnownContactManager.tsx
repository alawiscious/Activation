import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Users, 
  Mail, 
  Calendar, 
  Activity, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Settings,
  TrendingUp,
  Clock,
  AlertTriangle
} from 'lucide-react'
import type { Contact } from '@/types/domain'
import { 
  batchUpdateKnownStatus, 
  getKnownDetectionStats, 
  extractContactActivityData,
  shouldMarkAsKnown,
  type KnownDetectionConfig
} from '@/lib/contactKnownDetection'

interface KnownContactManagerProps {
  contacts: Contact[]
  onContactsUpdate?: (updatedContacts: Contact[]) => void
  className?: string
}

export default function KnownContactManager({ 
  contacts, 
  onContactsUpdate, 
  className 
}: KnownContactManagerProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  
  // Check if contacts have Genome enrichment data
  const contactsWithGenomeData = useMemo(() => {
    return contacts.filter(contact => 
      contact.emailCount !== undefined || 
      contact.meetingCount !== undefined || 
      contact.totalActivity !== undefined ||
      contact.lastEmailDate ||
      contact.lastKlickster
    )
  }, [contacts])
  
  const hasGenomeData = contactsWithGenomeData.length > 0
  const [config, setConfig] = useState<KnownDetectionConfig>({
    minEmailCount: 1,
    minMeetingCount: 0,
    maxDaysSinceLastActivity: 365,
    requireRecentActivity: true,
    activityThreshold: 1
  })

  // Calculate stats
  const stats = useMemo(() => getKnownDetectionStats(contacts), [contacts])

  // Get contacts that would be marked as known with current config
  const contactsToMarkAsKnown = useMemo(() => {
    return contacts.filter(contact => {
      const activityData = extractContactActivityData(contact)
      return shouldMarkAsKnown(contact, activityData, config)
    })
  }, [contacts, config])

  // Get contacts that would be marked as unknown with current config
  const contactsToMarkAsUnknown = useMemo(() => {
    return contacts.filter(contact => {
      const activityData = extractContactActivityData(contact)
      return !shouldMarkAsKnown(contact, activityData, config)
    })
  }, [contacts, config])

  const handleUpdateKnownStatus = async () => {
    setIsUpdating(true)
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const updatedContacts = batchUpdateKnownStatus(contacts, config)
      onContactsUpdate?.(updatedContacts)
    } catch (error) {
      console.error('Error updating known status:', error)
    } finally {
      setIsUpdating(false)
    }
  }


  const getDaysSince = (dateString?: string) => {
    if (!dateString) return null
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - date.getTime())
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    } catch {
      return null
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Known Contact Detection</h2>
          <p className="text-gray-600 mt-1">
            Automatically mark contacts as "known" based on Genome API activity data
          </p>
          {!hasGenomeData && (
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Genome enrichment required
                  </p>
                  <p className="text-sm text-yellow-700">
                    Run Genome enrichment first to get activity data for known contact detection.
                    {contactsWithGenomeData.length} of {contacts.length} contacts have Genome data.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfig(!showConfig)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
          <Button
            onClick={handleUpdateKnownStatus}
            disabled={isUpdating || !hasGenomeData}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isUpdating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Update Known Status
            {!hasGenomeData && " (Requires Genome Data)"}
          </Button>
        </div>
      </div>

      {/* Configuration Panel */}
      {showConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Detection Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Email Count
                </label>
                <input
                  type="number"
                  min="0"
                  value={config.minEmailCount}
                  onChange={(e) => setConfig(prev => ({ ...prev, minEmailCount: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Meeting Count
                </label>
                <input
                  type="number"
                  min="0"
                  value={config.minMeetingCount}
                  onChange={(e) => setConfig(prev => ({ ...prev, minMeetingCount: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Days Since Activity
                </label>
                <input
                  type="number"
                  min="1"
                  value={config.maxDaysSinceLastActivity}
                  onChange={(e) => setConfig(prev => ({ ...prev, maxDaysSinceLastActivity: parseInt(e.target.value) || 365 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Threshold
                </label>
                <input
                  type="number"
                  min="0"
                  value={config.activityThreshold}
                  onChange={(e) => setConfig(prev => ({ ...prev, activityThreshold: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="requireRecentActivity"
                  checked={config.requireRecentActivity}
                  onChange={(e) => setConfig(prev => ({ ...prev, requireRecentActivity: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="requireRecentActivity" className="text-sm font-medium text-gray-700">
                  Require Recent Activity
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflow Guide */}
      {!hasGenomeData && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <Activity className="h-5 w-5" />
              <span>Workflow Guide</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <p className="font-medium text-blue-900">Run Genome Enrichment</p>
                  <p className="text-sm text-blue-700">Use the "Optimized Bulk Genome Enrichment" tool above to fetch activity data from the Genome API</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <p className="font-medium text-blue-900">Review Activity Data</p>
                  <p className="text-sm text-blue-700">Check that contacts now have email counts, meeting counts, and activity dates</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <p className="font-medium text-blue-900">Configure & Update</p>
                  <p className="text-sm text-blue-700">Adjust detection criteria and run the known contact detection</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalContacts}</p>
                <p className="text-sm text-gray-600">Total Contacts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.knownContacts}</p>
                <p className="text-sm text-gray-600">Known Contacts</p>
                <p className="text-xs text-gray-500">{stats.knownPercentage.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <XCircle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.unknownContacts}</p>
                <p className="text-sm text-gray-600">Unknown Contacts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.contactsWithActivity}</p>
                <p className="text-sm text-gray-600">With Activity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Changes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Will Be Marked as Known</span>
              <Badge variant="outline" className="bg-green-100 text-green-800">
                {contactsToMarkAsKnown.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {contactsToMarkAsKnown.slice(0, 10).map((contact) => {
                const activityData = extractContactActivityData(contact)
                const daysSinceEmail = getDaysSince(activityData.latestEmailDate || activityData.lastEmailDate)
                
                return (
                  <div key={contact.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{contact.firstName} {contact.lastName}</p>
                      <p className="text-sm text-gray-600">{contact.title} at {contact.currCompany || contact.functionalArea}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                        {activityData.emailCount && activityData.emailCount > 0 && (
                          <span className="flex items-center space-x-1">
                            <Mail className="h-3 w-3" />
                            <span>{activityData.emailCount} emails</span>
                          </span>
                        )}
                        {activityData.meetingCount && activityData.meetingCount > 0 && (
                          <span className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{activityData.meetingCount} meetings</span>
                          </span>
                        )}
                        {daysSinceEmail && (
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{daysSinceEmail}d ago</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      Known
                    </Badge>
                  </div>
                )
              })}
              {contactsToMarkAsKnown.length > 10 && (
                <p className="text-sm text-gray-500 text-center">
                  ... and {contactsToMarkAsKnown.length - 10} more
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span>Will Be Marked as Unknown</span>
              <Badge variant="outline" className="bg-red-100 text-red-800">
                {contactsToMarkAsUnknown.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {contactsToMarkAsUnknown.slice(0, 10).map((contact) => {
                const activityData = extractContactActivityData(contact)
                
                return (
                  <div key={contact.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{contact.firstName} {contact.lastName}</p>
                      <p className="text-sm text-gray-600">{contact.title} at {contact.currCompany || contact.functionalArea}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                        {(!activityData.emailCount || activityData.emailCount === 0) && (
                          <span className="text-red-500">No email activity</span>
                        )}
                        {(!activityData.meetingCount || activityData.meetingCount === 0) && (
                          <span className="text-red-500">No meeting activity</span>
                        )}
                        {(!activityData.totalActivity || activityData.totalActivity === 0) && (
                          <span className="text-red-500">No total activity</span>
                        )}
                      </div>
                    </div>
                    <Badge className="bg-red-100 text-red-800">
                      Unknown
                    </Badge>
                  </div>
                )
              })}
              {contactsToMarkAsUnknown.length > 10 && (
                <p className="text-sm text-gray-500 text-center">
                  ... and {contactsToMarkAsUnknown.length - 10} more
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Activity Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Email Activity</h4>
              <div className="space-y-2">
                {contacts.filter(c => c.emailCount && c.emailCount > 0).length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Contacts with emails:</span>
                    <span className="font-medium">{contacts.filter(c => c.emailCount && c.emailCount > 0).length}</span>
                  </div>
                )}
                {contacts.filter(c => c.lastEmailDate).length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>With email dates:</span>
                    <span className="font-medium">{contacts.filter(c => c.lastEmailDate).length}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Meeting Activity</h4>
              <div className="space-y-2">
                {contacts.filter(c => c.meetingCount && c.meetingCount > 0).length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Contacts with meetings:</span>
                    <span className="font-medium">{contacts.filter(c => c.meetingCount && c.meetingCount > 0).length}</span>
                  </div>
                )}
                {contacts.filter(c => c.latestMeetingDate).length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>With meeting dates:</span>
                    <span className="font-medium">{contacts.filter(c => c.latestMeetingDate).length}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Total Activity</h4>
              <div className="space-y-2">
                {contacts.filter(c => c.totalActivity && c.totalActivity > 0).length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Contacts with activity:</span>
                    <span className="font-medium">{contacts.filter(c => c.totalActivity && c.totalActivity > 0).length}</span>
                  </div>
                )}
                {contacts.filter(c => c.lastKlickster).length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>With Klickster data:</span>
                    <span className="font-medium">{contacts.filter(c => c.lastKlickster).length}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
