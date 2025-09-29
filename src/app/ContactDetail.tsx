import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar, 
  MapPin, 
  ExternalLink,
  Activity,
  TrendingUp,
  Star,
  CheckCircle,
  XCircle,
  Target,
  Database
} from 'lucide-react'
import { Navigation } from '@/components/Shared/Navigation'
import { usePharmaVisualPivotStore } from '@/data/store'
import RichLinkedInProfile from '@/components/Contacts/RichLinkedInProfile'

export function ContactDetail() {
  const { contactId } = useParams<{ contactId: string }>()
  const navigate = useNavigate()
  const { currentCompanySlug, companies, updateContact } = usePharmaVisualPivotStore()
  
  const currentCompany = currentCompanySlug ? companies[currentCompanySlug] : null
  const contact = useMemo(() => {
    if (!currentCompany || !contactId) return null
    return currentCompany.contacts.find(c => c.id === contactId)
  }, [currentCompany, contactId])

  const [showRichProfile, setShowRichProfile] = useState(false)

  if (!contact) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Contact Not Found</h1>
            <p className="text-gray-600 mb-6">The contact you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/contacts')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Contacts
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString
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

  const isRecentActivity = (dateString?: string, thresholdDays: number = 90) => {
    const daysSince = getDaysSince(dateString)
    return daysSince !== null && daysSince <= thresholdDays
  }

  const getActivityStatus = (dateString?: string) => {
    if (!dateString) return { status: 'none', label: 'No Activity', color: 'gray' }
    
    const daysSince = getDaysSince(dateString)
    if (daysSince === null) return { status: 'unknown', label: 'Unknown', color: 'gray' }
    
    if (daysSince <= 30) return { status: 'recent', label: 'Recent', color: 'green' }
    if (daysSince <= 90) return { status: 'moderate', label: 'Moderate', color: 'yellow' }
    if (daysSince <= 365) return { status: 'old', label: 'Old', color: 'orange' }
    return { status: 'very-old', label: 'Very Old', color: 'red' }
  }

  const activityStatus = getActivityStatus(contact.lastEmailDate || contact.latestMeetingDate)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Button
              variant="outline"
              onClick={() => navigate('/contacts')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Contacts</span>
            </Button>
          </div>
          
          <div className="flex items-start space-x-6">
            <div className="p-4 bg-white rounded-lg border shadow-sm">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {contact.firstName[0]}{contact.lastName[0]}
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {contact.firstName} {contact.lastName}
                </h1>
                <Badge className={
                  contact.known 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }>
                  {contact.known ? 'Known' : 'Unknown'}
                </Badge>
                <Badge className={`${
                  activityStatus.color === 'green' ? 'bg-green-100 text-green-800' :
                  activityStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                  activityStatus.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                  activityStatus.color === 'red' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {activityStatus.label} Activity
                </Badge>
              </div>
              
              <div className="space-y-2">
                <p className="text-lg text-gray-700 font-medium">{contact.title}</p>
                <p className="text-gray-600">{contact.currCompany || contact.functionalArea}</p>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  {contact.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{contact.location}</span>
                    </div>
                  )}
                  {contact.email && (
                    <div className="flex items-center space-x-1">
                      <Mail className="h-4 w-4" />
                      <span>{contact.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <span>Contact Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Full Name</label>
                      <p className="text-gray-900">{contact.firstName} {contact.lastName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Title</label>
                      <p className="text-gray-900">{contact.title}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Company</label>
                      <p className="text-gray-900">{contact.currCompany || contact.functionalArea}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Functional Area</label>
                      <p className="text-gray-900">{contact.functionalArea}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-gray-900">{contact.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Location</label>
                      <p className="text-gray-900">{contact.location || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Brand</label>
                      <p className="text-gray-900">{contact.brand || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Therapeutic Area</label>
                      <p className="text-gray-900">{contact.therapeuticArea || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  <span>Activity Timeline</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Email Activity */}
                  {contact.emailCount && contact.emailCount > 0 && (
                    <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Mail className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900">Email Activity</h4>
                          <Badge className="bg-blue-100 text-blue-800">
                            {contact.emailCount} emails
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Last email: {formatDate(contact.lastEmailDate)}
                          {contact.lastKlickster && (
                            <span className="ml-2">• Klickster: {contact.lastKlickster}</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge className={`${
                            isRecentActivity(contact.lastEmailDate) 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {isRecentActivity(contact.lastEmailDate) ? 'Recent' : 'Old'}
                          </Badge>
                          {getDaysSince(contact.lastEmailDate) && (
                            <span className="text-xs text-gray-500">
                              {getDaysSince(contact.lastEmailDate)} days ago
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Meeting Activity */}
                  {contact.meetingCount && contact.meetingCount > 0 && (
                    <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg">
                      <div className="p-2 bg-green-100 rounded-full">
                        <Calendar className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900">Meeting Activity</h4>
                          <Badge className="bg-green-100 text-green-800">
                            {contact.meetingCount} meetings
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Last meeting: {formatDate(contact.latestMeetingDate)}
                        </div>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge className={`${
                            isRecentActivity(contact.latestMeetingDate) 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {isRecentActivity(contact.latestMeetingDate) ? 'Recent' : 'Old'}
                          </Badge>
                          {getDaysSince(contact.latestMeetingDate) && (
                            <span className="text-xs text-gray-500">
                              {getDaysSince(contact.latestMeetingDate)} days ago
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Total Activity */}
                  {contact.totalActivity && contact.totalActivity > 0 && (
                    <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-lg">
                      <div className="p-2 bg-purple-100 rounded-full">
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900">Total Activity</h4>
                          <Badge className="bg-purple-100 text-purple-800">
                            {contact.totalActivity} interactions
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Overall engagement level
                        </div>
                      </div>
                    </div>
                  )}

                  {/* No Activity */}
                  {(!contact.emailCount || contact.emailCount === 0) && 
                   (!contact.meetingCount || contact.meetingCount === 0) && 
                   (!contact.totalActivity || contact.totalActivity === 0) && (
                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-gray-100 rounded-full">
                        <XCircle className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">No Activity Data</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          No email, meeting, or interaction data available from Genome API
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Rich LinkedIn Profile */}
            {(contact.education || contact.positions || contact.skills) && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Star className="h-5 w-5 text-yellow-600" />
                      <span>LinkedIn Profile</span>
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRichProfile(!showRichProfile)}
                    >
                      {showRichProfile ? 'Hide' : 'Show'} Rich Profile
                    </Button>
                  </div>
                </CardHeader>
                {showRichProfile && (
                  <CardContent>
                    <RichLinkedInProfile contact={contact} />
                  </CardContent>
                )}
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <span>Contact Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Known Status</span>
                    <Badge className={
                      contact.known 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }>
                      {contact.known ? 'Known' : 'Unknown'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Activity Status</span>
                    <Badge className={`${
                      activityStatus.color === 'green' ? 'bg-green-100 text-green-800' :
                      activityStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                      activityStatus.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                      activityStatus.color === 'red' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {activityStatus.label}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Disposition</span>
                    <Badge variant="outline">{contact.dispositionToKlick}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Influence Level</span>
                    <Badge variant="outline">{contact.influenceLevel}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-green-600" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {contact.linkedinUrl && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => window.open(contact.linkedinUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View LinkedIn Profile
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open(`mailto:${contact.email}`, '_blank')}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      updateContact(contact.id, { known: !contact.known })
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Toggle Known Status
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Genome IDs */}
            {(contact.linkedinId || contact.leadId || contact.contactId || contact.genomeCrmcontactId) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="h-5 w-5 text-purple-600" />
                    <span>Genome IDs</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {contact.linkedinId && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">LinkedIn ID:</span>
                        <span className="font-mono text-xs">{contact.linkedinId}</span>
                      </div>
                    )}
                    {contact.leadId && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Lead ID:</span>
                        <span className="font-mono text-xs">{contact.leadId}</span>
                      </div>
                    )}
                    {contact.contactId && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Contact ID:</span>
                        <span className="font-mono text-xs">{contact.contactId}</span>
                      </div>
                    )}
                    {contact.genomeCrmcontactId && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Genome CRM ID:</span>
                        <span className="font-mono text-xs">{contact.genomeCrmcontactId}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
