// app/page.js
// Home page — renders StateSelector with data from states.json
// This is a Server Component: reads states.json at build time, passes as props

// TODO: Import loadData helper from lib/loadData
// TODO: Import StateSelector from components/home
// TODO: Read public/data/states.json at build time
// TODO: Pass available_states and coming_soon to StateSelector
// TODO: Add hero section / project intro above the state selector

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Gerrymandering Project</h1>
        <p className="text-lg text-gray-600">
          Measuring representational alignment across U.S. states & congressional districts
        </p>
      </div>
    </main>
  );
}
