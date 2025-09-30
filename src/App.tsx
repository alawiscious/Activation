import { useEffect } from 'react'
import { PharmaVisualPivot } from '@/components/PharmaVisualPivot'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthGuard } from '@/components/Auth/AuthGuard'
import { BrandDetail } from '@/app/BrandDetail'
import { TherapeuticAreaServices } from '@/app/TherapeuticAreaServices'
import { Analytics } from '@/app/Analytics'
import { Agencies } from '@/app/Agencies'
import { CompanyEnhanced as Company } from '@/app/CompanyEnhanced'
import { ImportManager } from '@/app/ImportManager'
import { Contacts } from '@/app/Contacts'
import { ContactDetail } from '@/app/ContactDetail'
import { Feed } from '@/app/Feed'
import { FeeToRevenueRatios } from '@/app/FeeToRevenueRatios'
import GenomeGalaxy from '@/app/GenomeGalaxy'
import { GenomeTools } from '@/app/GenomeTools'
import { TherapeuticAreasNew as TherapeuticAreas } from '@/app/TherapeuticAreasNew'
import './App.css'

function App() {
  console.log('🚀 App component rendering')
  
  useEffect(() => {
    console.log('🚀 App component mounted')
    if (typeof document !== 'undefined') {
      document.title = 'Klick Account Activation'
    }
  }, [])

  return (
    <AuthGuard>
      <BrowserRouter>
        <Routes>
        <Route path="/" element={<PharmaVisualPivot />} />
        <Route path="/brand/:id" element={<BrandDetail />} />
        <Route path="/ta/:name" element={<TherapeuticAreaServices />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/agencies" element={<Agencies />} />
        <Route path="/company" element={<Company />} />
        <Route path="/company/:slug" element={<Company />} />
        <Route path="/import-manager" element={<ImportManager />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/contact/:contactId" element={<ContactDetail />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/fee-to-revenue-ratios" element={<FeeToRevenueRatios />} />
        <Route path="/genome-galaxy" element={<GenomeGalaxy />} />
        <Route path="/genome-tools" element={<GenomeTools />} />
        <Route path="/therapeutic-areas" element={<TherapeuticAreas />} />
      </Routes>
    </BrowserRouter>
    </AuthGuard>
  )
}

export default App







