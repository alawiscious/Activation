import { usePharmaVisualPivotStore } from '@/data/store'

export function CompanyDebugger() {
  const { companies, currentCompanySlug } = usePharmaVisualPivotStore()
  
  console.log('Company Debug Info:', {
    currentCompanySlug,
    companiesCount: Object.keys(companies).length,
    companies: Object.keys(companies),
    currentCompany: currentCompanySlug ? companies[currentCompanySlug] : null
  })
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      right: 0, 
      background: 'white', 
      border: '1px solid black', 
      padding: '10px',
      zIndex: 9999,
      fontSize: '12px',
      maxWidth: '300px'
    }}>
      <h4>Company Debug</h4>
      <p>Current: {currentCompanySlug || 'None'}</p>
      <p>Companies: {Object.keys(companies).length}</p>
      <p>Available: {Object.keys(companies).join(', ')}</p>
      {currentCompanySlug && companies[currentCompanySlug] && (
        <div>
          <p>Company: {companies[currentCompanySlug].name}</p>
          <p>Brands: {companies[currentCompanySlug].brands?.length || 0}</p>
          <p>Contacts: {companies[currentCompanySlug].contacts?.length || 0}</p>
          <p>Revenue Rows: {companies[currentCompanySlug].revenueRows?.length || 0}</p>
        </div>
      )}
    </div>
  )
}
