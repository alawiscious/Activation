import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'
import { Lock, User, Eye, EyeOff } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuth = () => {
      const authData = localStorage.getItem('activation_auth')
      if (authData) {
        try {
          const { username: storedUsername, password: storedPassword, timestamp } = JSON.parse(authData)
          const now = Date.now()
          const oneDay = 24 * 60 * 60 * 1000 // 24 hours
          
          // Check if auth is still valid (within 24 hours)
          if (now - timestamp < oneDay) {
            // Verify credentials are still valid
            if (storedUsername === getExpectedUsername() && storedPassword === getExpectedPassword()) {
              setIsAuthenticated(true)
            } else {
              localStorage.removeItem('activation_auth')
            }
          } else {
            localStorage.removeItem('activation_auth')
          }
        } catch (error) {
          localStorage.removeItem('activation_auth')
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const getExpectedUsername = () => {
    const username = (import.meta as any).env?.VITE_AUTH_USERNAME
    if (!username) {
      throw new Error('VITE_AUTH_USERNAME environment variable is required')
    }
    return username
  }

  const getExpectedPassword = () => {
    const password = (import.meta as any).env?.VITE_AUTH_PASSWORD
    if (!password) {
      throw new Error('VITE_AUTH_PASSWORD environment variable is required')
    }
    return password
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const expectedUsername = getExpectedUsername()
    const expectedPassword = getExpectedPassword()

    if (username === expectedUsername && password === expectedPassword) {
      // Store auth data with timestamp
      const authData = {
        username,
        password,
        timestamp: Date.now()
      }
      localStorage.setItem('activation_auth', JSON.stringify(authData))
      setIsAuthenticated(true)
    } else {
      setError('Invalid username or password')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('activation_auth')
    setIsAuthenticated(false)
    setUsername('')
    setPassword('')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Activation Access</CardTitle>
            <p className="text-muted-foreground">
              Please sign in to access the Contact Visualizer
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full">
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Logout button in top right */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="bg-background/80 backdrop-blur-sm"
        >
          Logout
        </Button>
      </div>
      {children}
    </div>
  )
}
