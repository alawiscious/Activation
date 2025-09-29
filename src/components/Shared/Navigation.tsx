import { Link, useLocation } from 'react-router-dom'
import { 
  BarChart3, 
  Users, 
  Building2, 
  FileText, 
  Calculator,
  TrendingUp,
  Orbit,
  Dna,
  Target
} from 'lucide-react'

export function Navigation() {
  const location = useLocation()
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: BarChart3 },
    { path: '/analytics', label: 'Analytics', icon: TrendingUp },
    { path: '/therapeutic-areas', label: 'Therapeutic Areas', icon: Target },
    { path: '/contacts', label: 'Contacts', icon: Users },
    { path: '/company', label: 'Company', icon: Building2 },
    { path: '/fee-to-revenue-ratios', label: 'Fee-to-Revenue Ratios', icon: Calculator },
    { path: '/genome-galaxy', label: 'Genome Galaxy', icon: Orbit },
    { path: '/genome-tools', label: 'Genome Tools', icon: Dna },
    { path: '/import-manager', label: 'Import Manager', icon: FileText },
  ]

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link 
              to="/" 
              className="text-2xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-green-800 bg-clip-text text-transparent"
            >
              Pharma Visual Pivot
            </Link>
            <div className="flex items-center space-x-6">
              {navItems.map(({ path, label, icon: Icon }) => {
                const isActive = location.pathname === path
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
