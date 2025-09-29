import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  User, 
  GraduationCap, 
  Briefcase, 
  MapPin, 
  TrendingUp,
  Users,
  Star,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Target,
  Clock
} from 'lucide-react'
import type { Contact } from '@/types/domain'

interface RichLinkedInProfileProps {
  contact: Contact
  className?: string
}

export default function RichLinkedInProfile({ contact, className }: RichLinkedInProfileProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview', 'current']))

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return dateString
    }
  }

  const formatDateRange = (startMonth: number, startYear: number, endMonth?: number, endYear?: number) => {
    const start = `${startMonth}/${startYear}`
    const end = endMonth && endYear ? `${endMonth}/${endYear}` : 'Present'
    return `${start} - ${end}`
  }

  const getSkillColor = (skill: string) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-yellow-100 text-yellow-800',
      'bg-red-100 text-red-800',
      'bg-indigo-100 text-indigo-800'
    ]
    return colors[skill.length % colors.length]
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Profile Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start space-x-6">
            {contact.photoUrl && (
              <img 
                src={contact.photoUrl} 
                alt={`${contact.firstName} ${contact.lastName}`}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  {contact.firstName} {contact.lastName}
                </h2>
                {contact.linkedinUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(contact.linkedinUrl, '_blank')}
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    LinkedIn
                  </Button>
                )}
              </div>
              
              <div className="space-y-2">
                <p className="text-lg text-gray-700 font-medium">{contact.title}</p>
                <p className="text-gray-600">{contact.currCompany || contact.functionalArea}</p>
                
                {contact.linkedinHeadline && (
                  <p className="text-sm text-gray-500 italic">"{contact.linkedinHeadline}"</p>
                )}
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  {contact.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{contact.location}</span>
                    </div>
                  )}
                  {contact.followerCount && (
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{contact.followerCount.toLocaleString()} followers</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <span>Activity Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{contact.totalActivity || 0}</div>
              <div className="text-sm text-gray-500">Total Activity</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{contact.meetingCount || 0}</div>
              <div className="text-sm text-gray-500">Meetings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{contact.emailCount || 0}</div>
              <div className="text-sm text-gray-500">Emails</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{contact.companyCount || 0}</div>
              <div className="text-sm text-gray-500">Companies</div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Latest Meeting:</span>
                <span className="ml-2 font-medium">{formatDate(contact.latestMeetingDate)}</span>
              </div>
              <div>
                <span className="text-gray-500">Last Email:</span>
                <span className="ml-2 font-medium">{formatDate(contact.lastEmailDate)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LinkedIn Summary */}
      {contact.linkedinSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-600" />
              <span>About</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">{contact.linkedinSummary}</p>
          </CardContent>
        </Card>
      )}

      {/* Education */}
      {contact.education && contact.education.length > 0 && (
        <Card>
          <CardHeader>
            <Button
              variant="ghost"
              onClick={() => toggleSection('education')}
              className="p-0 h-auto justify-start"
            >
              <CardTitle className="flex items-center space-x-2">
                <GraduationCap className="h-5 w-5 text-blue-600" />
                <span>Education</span>
                {expandedSections.has('education') ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </CardTitle>
            </Button>
          </CardHeader>
          {expandedSections.has('education') && (
            <CardContent>
              <div className="space-y-4">
                {contact.education.map((edu, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    {edu.schoolLogo && (
                      <img 
                        src={edu.schoolLogo} 
                        alt={edu.schoolName}
                        className="w-12 h-12 rounded object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{edu.schoolName}</h4>
                      {edu.degreeName && (
                        <p className="text-gray-700">{edu.degreeName}</p>
                      )}
                      {edu.fieldOfStudy && (
                        <p className="text-sm text-gray-500">{edu.fieldOfStudy}</p>
                      )}
                      <p className="text-sm text-gray-500">
                        {formatDateRange(edu.startMonth, edu.startYear, edu.endMonth, edu.endYear)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Experience */}
      {contact.positions && contact.positions.length > 0 && (
        <Card>
          <CardHeader>
            <Button
              variant="ghost"
              onClick={() => toggleSection('experience')}
              className="p-0 h-auto justify-start"
            >
              <CardTitle className="flex items-center space-x-2">
                <Briefcase className="h-5 w-5 text-blue-600" />
                <span>Experience</span>
                {expandedSections.has('experience') ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </CardTitle>
            </Button>
          </CardHeader>
          {expandedSections.has('experience') && (
            <CardContent>
              <div className="space-y-4">
                {contact.positions.map((position, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    {position.companyLogo && (
                      <img 
                        src={position.companyLogo} 
                        alt={position.companyName}
                        className="w-12 h-12 rounded object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{position.title}</h4>
                      <p className="text-gray-700">{position.companyName}</p>
                      <p className="text-sm text-gray-500">{position.companyLocation}</p>
                      <p className="text-sm text-gray-500">
                        {formatDateRange(position.startMonth, position.startYear, position.endMonth, position.endYear)}
                      </p>
                      {position.description && (
                        <p className="text-sm text-gray-600 mt-2">{position.description}</p>
                      )}
                      {position.seniorityDesc && (
                        <Badge variant="outline" className="mt-2">
                          {position.seniorityDesc}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Skills */}
      {contact.skills && contact.skills.length > 0 && (
        <Card>
          <CardHeader>
            <Button
              variant="ghost"
              onClick={() => toggleSection('skills')}
              className="p-0 h-auto justify-start"
            >
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-blue-600" />
                <span>Skills</span>
                {expandedSections.has('skills') ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </CardTitle>
            </Button>
          </CardHeader>
          {expandedSections.has('skills') && (
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {contact.skills.map((skill, index) => (
                  <Badge key={index} className={getSkillColor(skill.skill)}>
                    {skill.skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Recommendations */}
      {contact.recommendationsReceived && contact.recommendationsReceived.length > 0 && (
        <Card>
          <CardHeader>
            <Button
              variant="ghost"
              onClick={() => toggleSection('recommendations')}
              className="p-0 h-auto justify-start"
            >
              <CardTitle className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-blue-600" />
                <span>Recommendations</span>
                {expandedSections.has('recommendations') ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </CardTitle>
            </Button>
          </CardHeader>
          {expandedSections.has('recommendations') && (
            <CardContent>
              <div className="space-y-4">
                {contact.recommendationsReceived.map((rec, index) => (
                  <div key={index} className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                    <div className="flex items-start space-x-3">
                      <Star className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-gray-700 italic">"{rec.recommendationText}"</p>
                        <div className="mt-2 text-sm text-gray-500">
                          <span className="font-medium">{rec.recommenderName}</span>
                          <span className="mx-2">•</span>
                          <span>{rec.recommenderTitle}</span>
                          <span className="mx-2">•</span>
                          <span>{rec.recommenderCompany}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Activity Frequency */}
      {contact.frequencyData && contact.frequencyData.length > 0 && (
        <Card>
          <CardHeader>
            <Button
              variant="ghost"
              onClick={() => toggleSection('activity')}
              className="p-0 h-auto justify-start"
            >
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span>Activity Patterns</span>
                {expandedSections.has('activity') ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </CardTitle>
            </Button>
          </CardHeader>
          {expandedSections.has('activity') && (
            <CardContent>
              <div className="space-y-2">
                {contact.frequencyData.slice(0, 10).map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {activity.interactionType}
                      </Badge>
                      <span className="text-sm text-gray-600">{formatDate(activity.weekStart)}</span>
                    </div>
                    <div className="text-sm font-medium">
                      {activity.weeklyCount} interactions
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  )
}
