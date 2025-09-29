import { useRef, useEffect, useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Orbit, 
  Users, 
  Building2, 
  Target, 
  Star,
  RotateCcw,
  Play,
  Pause
} from 'lucide-react'
import * as THREE from 'three'

interface Contact {
  id: number
  firstName: string
  lastName: string
  title: string
  company: string
  functionalGroup: string
  seniorityLevel: number
  seniorityLevelDesc: string
  email: string
  location: string
  meetingCount: number
  emailCount: number
  isCompetitor: boolean
  isFavorite: boolean
  totalActivity: number
  latestMeetingDate?: string
  latestEmailDate?: string
}

interface Company {
  id: number
  name: string
  contacts: Contact[]
  isCompetitor: boolean
  totalContacts: number
  totalActivity: number
}

interface GalaxyData {
  companies: Company[]
  totalContacts: number
  totalCompanies: number
  competitorCount: number
}

export default function GenomeGalaxy3D() {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene>()
  const rendererRef = useRef<THREE.WebGLRenderer>()
  const cameraRef = useRef<THREE.PerspectiveCamera>()
  const animationRef = useRef<number>()
  
  const [isPlaying, setIsPlaying] = useState(true)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [viewMode, setViewMode] = useState<'galaxy' | 'company' | 'relationship'>('galaxy')
  const [speed, setSpeed] = useState([1])
  const [showCompetitors, setShowCompetitors] = useState(true)
  const [showClients, setShowClients] = useState(true)

  // Mock data - in real app, this would come from Genome API
  const galaxyData: GalaxyData = useMemo(() => ({
    companies: [
      {
        id: 1,
        name: "Pfizer",
        isCompetitor: false,
        totalContacts: 45,
        totalActivity: 1200,
        contacts: [
          {
            id: 1,
            firstName: "Sarah",
            lastName: "Johnson",
            title: "VP Marketing",
            company: "Pfizer",
            functionalGroup: "Marketing",
            seniorityLevel: 9,
            seniorityLevelDesc: "Senior Executive Management",
            email: "sarah.johnson@pfizer.com",
            location: "New York, NY",
            meetingCount: 12,
            emailCount: 45,
            isCompetitor: false,
            isFavorite: true,
            totalActivity: 57,
            latestMeetingDate: "2025-09-25",
            latestEmailDate: "2025-09-24"
          },
          {
            id: 2,
            firstName: "Michael",
            lastName: "Chen",
            title: "Director R&D",
            company: "Pfizer",
            functionalGroup: "Research",
            seniorityLevel: 7,
            seniorityLevelDesc: "Advanced Senior Leadership",
            email: "michael.chen@pfizer.com",
            location: "Boston, MA",
            meetingCount: 8,
            emailCount: 23,
            isCompetitor: false,
            isFavorite: false,
            totalActivity: 31,
            latestMeetingDate: "2025-09-20",
            latestEmailDate: "2025-09-22"
          }
        ]
      },
      {
        id: 2,
        name: "Merck",
        isCompetitor: true,
        totalContacts: 32,
        totalActivity: 890,
        contacts: [
          {
            id: 3,
            firstName: "Emily",
            lastName: "Rodriguez",
            title: "SVP Commercial",
            company: "Merck",
            functionalGroup: "Commercial",
            seniorityLevel: 10,
            seniorityLevelDesc: "Top Executive (Non-C-Suite)",
            email: "emily.rodriguez@merck.com",
            location: "New Jersey, NJ",
            meetingCount: 15,
            emailCount: 67,
            isCompetitor: true,
            isFavorite: false,
            totalActivity: 82,
            latestMeetingDate: "2025-09-23",
            latestEmailDate: "2025-09-25"
          }
        ]
      },
      {
        id: 3,
        name: "Johnson & Johnson",
        isCompetitor: false,
        totalContacts: 28,
        totalActivity: 756,
        contacts: [
          {
            id: 4,
            firstName: "David",
            lastName: "Kim",
            title: "Head of Medical Affairs",
            company: "Johnson & Johnson",
            functionalGroup: "Medical",
            seniorityLevel: 8,
            seniorityLevelDesc: "Executive Management",
            email: "david.kim@jnj.com",
            location: "Philadelphia, PA",
            meetingCount: 6,
            emailCount: 34,
            isCompetitor: false,
            isFavorite: true,
            totalActivity: 40,
            latestMeetingDate: "2025-09-18",
            latestEmailDate: "2025-09-21"
          }
        ]
      }
    ],
    totalContacts: 105,
    totalCompanies: 3,
    competitorCount: 1
  }), [])

  useEffect(() => {
    if (!mountRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0a)
    sceneRef.current = scene

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(0, 0, 50)
    cameraRef.current = camera

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    mountRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(50, 50, 50)
    directionalLight.castShadow = true
    scene.add(directionalLight)

    // Create galaxy
    createGalaxy(scene)

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate)
      
      if (isPlaying) {
        scene.rotation.y += 0.001 * speed[0]
        scene.rotation.x += 0.0005 * speed[0]
      }
      
      renderer.render(scene, camera)
    }
    animate()

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return
      
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
    }
  }, [isPlaying, speed])

  const createGalaxy = (scene: THREE.Scene) => {
    // Clear existing objects
    scene.clear()
    
    // Add lighting back
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3)
    scene.add(ambientLight)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(50, 50, 50)
    scene.add(directionalLight)

    // Create company solar systems
    galaxyData.companies.forEach((company, companyIndex) => {
      if ((company.isCompetitor && !showCompetitors) || (!company.isCompetitor && !showClients)) {
        return
      }

      // Company center (sun)
      const sunGeometry = new THREE.SphereGeometry(2, 32, 32)
      const sunMaterial = new THREE.MeshPhongMaterial({
        color: company.isCompetitor ? 0xff4444 : 0x4444ff,
        emissive: company.isCompetitor ? 0x220000 : 0x000022,
        emissiveIntensity: 0.3
      })
      const sun = new THREE.Mesh(sunGeometry, sunMaterial)
      
      // Position companies in a circle
      const angle = (companyIndex / galaxyData.companies.length) * Math.PI * 2
      const radius = 20
      sun.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius * 0.3,
        Math.sin(angle) * radius * 0.5
      )
      
      scene.add(sun)

      // Add company label
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')!
      canvas.width = 256
      canvas.height = 64
      context.fillStyle = 'rgba(0, 0, 0, 0.8)'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.fillStyle = 'white'
      context.font = '16px Arial'
      context.textAlign = 'center'
      context.fillText(company.name, canvas.width / 2, canvas.height / 2 + 5)
      
      const texture = new THREE.CanvasTexture(canvas)
      const labelMaterial = new THREE.SpriteMaterial({ map: texture })
      const label = new THREE.Sprite(labelMaterial)
      label.position.copy(sun.position)
      label.position.y += 4
      label.scale.set(8, 2, 1)
      scene.add(label)

      // Create contact planets orbiting the company
      company.contacts.forEach((contact, contactIndex) => {
        const planetGeometry = new THREE.SphereGeometry(
          Math.max(0.3, contact.seniorityLevel / 15), // Size based on seniority
          16, 16
        )
        
        // Color based on functional group
        const functionalGroupColors: Record<string, number> = {
          'Marketing': 0x00ff00,
          'Research': 0xff8800,
          'Commercial': 0xff00ff,
          'Medical': 0x00ffff,
          'Sales': 0xffff00,
          'Regulatory': 0xff0088
        }
        
        const planetMaterial = new THREE.MeshPhongMaterial({
          color: functionalGroupColors[contact.functionalGroup] || 0x888888,
          emissive: contact.isFavorite ? 0x222222 : 0x000000,
          emissiveIntensity: contact.isFavorite ? 0.2 : 0
        })
        
        const planet = new THREE.Mesh(planetGeometry, planetMaterial)
        
        // Orbit position
        const orbitRadius = 4 + contactIndex * 0.8
        const orbitAngle = (contactIndex / company.contacts.length) * Math.PI * 2
        const orbitHeight = (contactIndex - company.contacts.length / 2) * 0.5
        
        planet.position.set(
          sun.position.x + Math.cos(orbitAngle) * orbitRadius,
          sun.position.y + orbitHeight,
          sun.position.z + Math.sin(orbitAngle) * orbitRadius
        )
        
        // Add interaction
        planet.userData = { contact, company }
        
        scene.add(planet)

        // Add activity trails (for high-activity contacts)
        if (contact.totalActivity > 50) {
          const trailGeometry = new THREE.RingGeometry(orbitRadius - 0.1, orbitRadius + 0.1, 32)
          const trailMaterial = new THREE.MeshBasicMaterial({
            color: planetMaterial.color,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
          })
          const trail = new THREE.Mesh(trailGeometry, trailMaterial)
          trail.position.copy(sun.position)
          trail.rotation.x = Math.PI / 2
          scene.add(trail)
        }
      })
    })

    // Add connection lines between companies (relationships)
    if (viewMode === 'relationship') {
      for (let i = 0; i < galaxyData.companies.length; i++) {
        for (let j = i + 1; j < galaxyData.companies.length; j++) {
          const company1 = galaxyData.companies[i]
          const company2 = galaxyData.companies[j]
          
          // Find mutual connections
          const mutualConnections = company1.contacts.filter(contact1 =>
            company2.contacts.some(contact2 => 
              contact1.functionalGroup === contact2.functionalGroup
            )
          )
          
          if (mutualConnections.length > 0) {
            const lineGeometry = new THREE.BufferGeometry()
            const positions = new Float32Array([
              0, 0, 0,
              0, 0, 0
            ])
            lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
            
            const lineMaterial = new THREE.LineBasicMaterial({
              color: 0xffffff,
              transparent: true,
              opacity: Math.min(0.8, mutualConnections.length / 5)
            })
            
            const line = new THREE.Line(lineGeometry, lineMaterial)
            scene.add(line)
          }
        }
      }
    }
  }


  const resetView = () => {
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 0, 50)
      cameraRef.current.lookAt(0, 0, 0)
    }
    if (sceneRef.current) {
      sceneRef.current.rotation.set(0, 0, 0)
    }
  }

  return (
    <div className="w-full h-screen flex">
      {/* 3D Galaxy View */}
      <div className="flex-1 relative">
        <div 
          ref={mountRef} 
          className="w-full h-full cursor-grab active:cursor-grabbing"
          style={{ background: 'radial-gradient(circle, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)' }}
        />
        
        {/* Overlay Controls */}
        <div className="absolute top-4 left-4 space-y-2">
          <Card className="bg-black/80 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Button
                  size="sm"
                  variant={isPlaying ? "default" : "outline"}
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="outline" onClick={resetView}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-white/70 mb-1 block">Speed</label>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={speed[0]}
                    onChange={(e) => setSpeed([parseFloat(e.target.value)])}
                    className="w-24"
                  />
                </div>
                
                <div>
                  <label className="text-xs text-white/70 mb-1 block">View Mode</label>
                  <div className="flex space-x-1">
                    {[
                      { key: 'galaxy', label: 'Galaxy', icon: Orbit },
                      { key: 'company', label: 'Company', icon: Building2 },
                      { key: 'relationship', label: 'Relations', icon: Target }
                    ].map(({ key, label, icon: Icon }) => (
                      <Button
                        key={key}
                        size="sm"
                        variant={viewMode === key ? "default" : "outline"}
                        onClick={() => setViewMode(key as any)}
                        className="text-xs px-2"
                      >
                        <Icon className="h-3 w-3 mr-1" />
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant={showClients ? "default" : "outline"}
                      onClick={() => setShowClients(!showClients)}
                      className="text-xs"
                    >
                      <Users className="h-3 w-3 mr-1" />
                      Clients
                    </Button>
                    <Button
                      size="sm"
                      variant={showCompetitors ? "default" : "outline"}
                      onClick={() => setShowCompetitors(!showCompetitors)}
                      className="text-xs"
                    >
                      <Target className="h-3 w-3 mr-1" />
                      Competitors
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Galaxy Stats */}
        <div className="absolute top-4 right-4">
          <Card className="bg-black/80 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-white">{galaxyData.totalContacts} Contacts</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-white">{galaxyData.totalCompanies} Companies</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-red-400" />
                  <span className="text-sm text-white">{galaxyData.competitorCount} Competitors</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Contact Details Panel */}
      {selectedContact && (
        <div className="w-80 bg-slate-900 border-l border-slate-700 p-6 overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Contact Details</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedContact(null)}
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-xl font-bold text-white">
                  {selectedContact.firstName} {selectedContact.lastName}
                </h4>
                <p className="text-slate-300">{selectedContact.title}</p>
                <p className="text-slate-400">{selectedContact.company}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Badge variant="outline" className="text-xs">
                  {selectedContact.functionalGroup}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Level {selectedContact.seniorityLevel}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Meetings:</span>
                  <span className="text-white">{selectedContact.meetingCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Emails:</span>
                  <span className="text-white">{selectedContact.emailCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Total Activity:</span>
                  <span className="text-white">{selectedContact.totalActivity}</span>
                </div>
              </div>
              
              {selectedContact.isFavorite && (
                <div className="flex items-center space-x-1 text-yellow-400">
                  <Star className="h-4 w-4" />
                  <span className="text-sm">Favorite Contact</span>
                </div>
              )}
              
              <div className="pt-2 border-t border-slate-700">
                <p className="text-xs text-slate-400">
                  Latest Meeting: {selectedContact.latestMeetingDate}
                </p>
                <p className="text-xs text-slate-400">
                  Latest Email: {selectedContact.latestEmailDate}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
