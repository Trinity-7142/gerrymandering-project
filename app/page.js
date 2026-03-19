// app/page.js
// Home page — renders StateSelector with data from states.json
// This is a Server Component: reads states.json at build time, passes as props

// TODO: Import loadData helper from lib/loadData
// TODO: Import StateSelector from components/home
// TODO: Read public/data/states.json at build time
// TODO: Pass available_states and coming_soon to StateSelector
// TODO: Add hero section / project intro above the state selector

import StateSelector from '../components/home/StateSelector'

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Gerrymandering Project</h1>
        <p className="text-lg text-gray-600">
          Measuring representational alignment across U.S. states & congressional districts
        </p>
        
        <StateSelector/>
        <div className='text-center flex items-center max-w-prose mx-auto'>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque semper, justo eu faucibus consequat, sapien tortor efficitur nisi, blandit bibendum magna magna ut turpis. Nunc nisl nisi, auctor eget consectetur ac, condimentum nec ipsum. Donec et sapien vehicula, condimentum metus sed, scelerisque odio. Donec ut elit metus. Nam pharetra faucibus purus viverra consectetur. Etiam rhoncus fringilla facilisis. Duis nec semper augue, ac laoreet sapien. Aenean at finibus leo, non malesuada elit. Nunc et lectus id risus molestie viverra ut non magna. Suspendisse ante neque, consectetur in mollis ac, pharetra ullamcorper risus.</p>
        </div>
      </div>
      
    </main>

  );
}
