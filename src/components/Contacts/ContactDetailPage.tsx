import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePharmaVisualPivotStore } from '../../data/store'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs'
import { MapPin, Mail, Phone, Building, Users, Activity, ArrowLeft, ExternalLink, User, Briefcase, GraduationCap, Award, MessageSquare, Clock, TrendingUp } from 'lucide-react'
import { cn } from '../../lib/utils'

export function ContactDetailPage() {
  const { contactId } = useParams<{ contactId: string }>()
  const navigate = useNavigate()
  const { companies, currentCompanySlug } = usePharmaVisualPivotStore()
  
  const company = currentCompanySlug ? companies[currentCompanySlug] : null
  const contact = useMemo(() => {
    if (!company || !contactId) return null
    return company.contacts.find(c => c.id === contactId)
  }, [company, contactId])

  const [activeTab, setActiveTab] = useState('overview')

  if (!contact) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate('/contacts')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contacts
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Contact not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return dateString
    }
  }


  const getActivityTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'email': return <Mail className="h-4 w-4" />
      case 'meeting': return <Users className="h-4 w-4" />
      case 'call': return <Phone className="h-4 w-4" />
      case 'klickster': return <MessageSquare className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getActivityTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'email': return 'bg-blue-100 text-blue-800'
      case 'meeting': return 'bg-green-100 text-green-800'
      case 'call': return 'bg-purple-100 text-purple-800'
      case 'klickster': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Mock activity data - in a real app, this would come from the Genome API
  const mockActivities = [
    {
      id: '1',
      type: 'Email',
      date: '2024-01-15',
      description: 'Follow-up on Q4 results discussion',
      participants: ['John Smith', 'Sarah Johnson'],
      isRecent: true
    },
    {
      id: '2',
      type: 'Meeting',
      date: '2024-01-10',
      description: 'Quarterly business review',
      participants: ['John Smith', 'Sarah Johnson', 'Mike Chen'],
      isRecent: true
    },
    {
      id: '3',
      type: 'Call',
      date: '2023-12-20',
      description: 'Holiday check-in',
      participants: ['John Smith'],
      isRecent: false
    },
    {
      id: '4',
      type: 'Klickster',
      date: '2023-12-15',
      description: 'LinkedIn message exchange',
      participants: ['John Smith'],
      isRecent: false
    },
    {
      id: '5',
      type: 'Email',
      date: '2023-11-30',
      description: 'Product launch announcement',
      participants: ['John Smith', 'Sarah Johnson'],
      isRecent: false
    }
  ]

  const recentActivities = mockActivities.filter(activity => activity.isRecent)
  const oldActivities = mockActivities.filter(activity => !activity.isRecent)

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => navigate('/contacts')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Contacts
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{contact.firstName} {contact.lastName}</h1>
          <p className="text-muted-foreground">{contact.title}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Contact Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Basic Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-semibold">
                  {`${contact.firstName?.[0] || ''}${contact.lastName?.[0] || ''}`.toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{contact.firstName} {contact.lastName}</p>
                  <p className="text-sm text-muted-foreground">{contact.title}</p>
                </div>
              </div>

              <div className="space-y-2">
                {contact.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                      {contact.email}
                    </a>
                  </div>
                )}
                

                {contact.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{contact.location}</span>
                  </div>
                )}

                {contact.linkedinUrl && (
                  <div className="flex items-center gap-2 text-sm">
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={contact.linkedinUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      LinkedIn Profile
                    </a>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Company Details</span>
                </div>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Brand:</span> {contact.brand || 'Unknown'}</p>
                  <p><span className="font-medium">Therapeutic Area:</span> {contact.therapeuticArea || 'Unknown'}</p>
                  <p><span className="font-medium">Functional Area:</span> {contact.functionalArea || 'Unknown'}</p>
                  {contact.functionalGroup && (
                    <p><span className="font-medium">Functional Group:</span> {contact.functionalGroup}</p>
                  )}
                  {contact.seniorityLevelDesc && (
                    <p><span className="font-medium">Seniority:</span> {contact.seniorityLevelDesc}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Activity Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{contact.emailCount || 0}</p>
                  <p className="text-sm text-muted-foreground">Emails</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{contact.meetingCount || 0}</p>
                  <p className="text-sm text-muted-foreground">Meetings</p>
                </div>
              </div>
              
              {contact.lastEmailDate && (
                <div className="text-sm">
                  <p><span className="font-medium">Last Email:</span> {formatDate(contact.lastEmailDate)}</p>
                </div>
              )}
              
              {contact.lastKlickster && (
                <div className="text-sm">
                  <p><span className="font-medium">Last Klickster:</span> {formatDate(contact.lastKlickster)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Detailed Information */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Professional Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Professional Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {contact.linkedinSummary ? (
                    <p className="text-sm leading-relaxed">{contact.linkedinSummary}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No professional summary available</p>
                  )}
                </CardContent>
              </Card>

              {/* Current Position */}
              {contact.positions && contact.positions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Current Position
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const currentPosition = contact.positions.find(p => !p.endYear && !p.endMonth) || contact.positions[0]
                      return (
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            {currentPosition.companyLogo && (
                              <img 
                                src={currentPosition.companyLogo} 
                                alt={currentPosition.companyName}
                                className="h-8 w-8 rounded"
                              />
                            )}
                            <div>
                              <p className="font-medium">{currentPosition.title}</p>
                              <p className="text-sm text-muted-foreground">{currentPosition.companyName}</p>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {currentPosition.startMonth && currentPosition.startYear 
                              ? `${new Date(2000, currentPosition.startMonth - 1, 1).toLocaleString(undefined, { month: 'long' })} ${currentPosition.startYear} - Present`
                              : 'Duration not specified'
                            }
                          </p>
                          {currentPosition.description && (
                            <p className="text-sm leading-relaxed mt-2">{currentPosition.description}</p>
                          )}
                        </div>
                      )
                    })()}
                  </CardContent>
                </Card>
              )}

              {/* Skills */}
              {contact.skills && contact.skills.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Skills
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {contact.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill.skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentActivities.length > 0 ? (
                    <div className="space-y-4">
                      {recentActivities.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                          <div className={cn("p-2 rounded-full", getActivityTypeColor(activity.type))}>
                            {getActivityTypeIcon(activity.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{activity.type}</span>
                              <Badge variant="outline" className="text-xs">
                                {formatDate(activity.date)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Users className="h-3 w-3" />
                              <span>{activity.participants.join(', ')}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No recent activity</p>
                  )}
                </CardContent>
              </Card>

              {/* Historical Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Historical Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {oldActivities.length > 0 ? (
                    <div className="space-y-3">
                      {oldActivities.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-2 border rounded">
                          <div className={cn("p-1.5 rounded-full", getActivityTypeColor(activity.type))}>
                            {getActivityTypeIcon(activity.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">{activity.type}</span>
                              <Badge variant="outline" className="text-xs">
                                {formatDate(activity.date)}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{activity.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No historical activity</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile" className="space-y-6">
              {/* Education */}
              {contact.education && contact.education.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Education
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {contact.education.map((edu, index) => (
                        <div key={index} className="flex items-start gap-3">
                          {edu.schoolLogo && (
                            <img 
                              src={edu.schoolLogo} 
                              alt={edu.schoolName}
                              className="h-8 w-8 rounded"
                            />
                          )}
                          <div>
                            <p className="font-medium">{edu.schoolName}</p>
                            {edu.degreeName && (
                              <p className="text-sm text-muted-foreground">{edu.degreeName}</p>
                            )}
                            {edu.fieldOfStudy && (
                              <p className="text-sm text-muted-foreground">{edu.fieldOfStudy}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {edu.startYear} - {edu.endYear}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Work History */}
              {contact.positions && contact.positions.length > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Work History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {contact.positions.slice(1).map((position, index) => (
                        <div key={index} className="flex items-start gap-3">
                          {position.companyLogo && (
                            <img 
                              src={position.companyLogo} 
                              alt={position.companyName}
                              className="h-8 w-8 rounded"
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{position.title}</p>
                            <p className="text-sm text-muted-foreground">{position.companyName}</p>
                            <p className="text-xs text-muted-foreground">
                              {position.startMonth && position.startYear 
                                ? `${new Date(2000, position.startMonth - 1, 1).toLocaleString(undefined, { month: 'long' })} ${position.startYear}`
                                : 'Start date not specified'
                              }
                              {position.endMonth && position.endYear 
                                ? ` - ${new Date(2000, position.endMonth - 1, 1).toLocaleString(undefined, { month: 'long' })} ${position.endYear}`
                                : position.endYear ? ` - ${position.endYear}` : ' - Present'
                              }
                            </p>
                            {position.description && (
                              <p className="text-sm leading-relaxed mt-2">{position.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {(contact.recommendationsGiven && contact.recommendationsGiven.length > 0) || 
               (contact.recommendationsReceived && contact.recommendationsReceived.length > 0) ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {contact.recommendationsReceived && contact.recommendationsReceived.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Received ({contact.recommendationsReceived.length})</h4>
                        <div className="space-y-3">
                          {contact.recommendationsReceived.slice(0, 3).map((rec, index) => (
                            <div key={index} className="p-3 border rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium text-sm">{rec.recommenderName}</span>
                                <span className="text-xs text-muted-foreground">{rec.recommenderTitle}</span>
                              </div>
                              <p className="text-sm leading-relaxed">{rec.recommendationText}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {contact.recommendationsGiven && contact.recommendationsGiven.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Given ({contact.recommendationsGiven.length})</h4>
                        <div className="space-y-3">
                          {contact.recommendationsGiven.slice(0, 3).map((rec, index) => (
                            <div key={index} className="p-3 border rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium text-sm">{rec.recommenderName}</span>
                                <span className="text-xs text-muted-foreground">{rec.recommenderTitle}</span>
                              </div>
                              <p className="text-sm leading-relaxed">{rec.recommendationText}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : null}
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              {/* Contact Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Contact Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Engagement Level</h4>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${Math.min((contact.totalActivity || 0) * 10, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {contact.totalActivity || 0} activities
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Contact Status</h4>
                      <Badge variant={contact.known ? "default" : "secondary"}>
                        {contact.known ? "Known Contact" : "Unknown Contact"}
                      </Badge>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Network Size</h4>
                      <p className="text-2xl font-bold">{contact.followerCount || 0}</p>
                      <p className="text-sm text-muted-foreground">LinkedIn followers</p>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Company Count</h4>
                      <p className="text-2xl font-bold">{contact.companyCount || 0}</p>
                      <p className="text-sm text-muted-foreground">Previous companies</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Genome Data */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Genome Integration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {contact.genomeCrmcontactId && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Genome CRM ID</Badge>
                        <span className="text-sm font-mono">{contact.genomeCrmcontactId}</span>
                      </div>
                    )}
                    
                    {contact.contactId && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Contact ID</Badge>
                        <span className="text-sm font-mono">{contact.contactId}</span>
                      </div>
                    )}
                    
                    {contact.linkedinId && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">LinkedIn ID</Badge>
                        <span className="text-sm font-mono">{contact.linkedinId}</span>
                      </div>
                    )}
                    
                    {contact.linkedinLastPulled && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Last Updated</Badge>
                        <span className="text-sm">{formatDate(contact.linkedinLastPulled)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
