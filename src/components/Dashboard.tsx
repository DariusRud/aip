interface Stats {
  needsReview: number;
  todayUploaded: number;
  todayValidated: number;
  todayExported: number;
  todayCorrections: number;
}

type View = 'dashboard' | 'purchase-invoices' | 'sales-invoices' | 'companies' | 'products' | 'export' | 'reports';

interface DashboardProps {
  currentDate: string;
  stats: Stats;
  setShowUploadModal: (show: boolean) => void;
  setCurrentView: (view: View) => void;
}

function Dashboard({ currentDate, stats, setShowUploadModal, setCurrentView }: DashboardProps) {
  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-1">Darbalaukis</h1>
          <p className="text-slate-500 time-display">{currentDate}</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2">
            <i className="fas fa-bell text-slate-600"></i>
            <span className="text-sm font-medium text-slate-700">Pranešimai</span>
            <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">3</span>
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition-all shadow-sm flex items-center gap-2 quick-action"
          >
            <i className="fas fa-plus text-sm"></i>
            <span className="font-medium">Įkelti Sąskaitą</span>
          </button>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <i className="fas fa-exclamation-triangle text-red-500"></i>
          <h2 className="text-xl font-semibold text-slate-800">Reikia Dėmesio</h2>
        </div>

        <div className="space-y-3">
          <div className="alert-card card p-4 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="badge badge-urgent">
                    <i className="fas fa-circle text-xs"></i>
                    Skubu
                  </span>
                  <span className="text-sm font-semibold text-slate-800">5 sąskaitos laukia peržiūros</span>
                </div>
                <p className="text-sm text-slate-600">Sąskaitos su neatpažintomis arba nepatvirtintomis eilutėmis</p>
              </div>
              <button
                onClick={() => setCurrentView('purchase-invoices')}
                className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
              >
                Peržiūrėti →
              </button>
            </div>
          </div>

          <div className="alert-card card p-4 border-l-4 border-amber-500">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="badge badge-warning">
                    <i className="fas fa-circle text-xs"></i>
                    Įspėjimas
                  </span>
                  <span className="text-sm font-semibold text-slate-800">12 neatpažintų prekių eilučių</span>
                </div>
                <p className="text-sm text-slate-600">Reikalingas rankinis susiejimas su prekių katalogu</p>
              </div>
              <button className="px-4 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors font-medium text-sm">
                Valdyti →
              </button>
            </div>
          </div>

          <div className="alert-card card p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="badge badge-info">
                    <i className="fas fa-circle text-xs"></i>
                    Info
                  </span>
                  <span className="text-sm font-semibold text-slate-800">3 tiekėjai su pakartotinėmis klaidomis</span>
                </div>
                <p className="text-sm text-slate-600">UAB "Statybų Partneris", UAB "Nežinomi Įrankiai", UAB "Tvirtas Varžtas"</p>
              </div>
              <button className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm">
                Analizuoti →
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Šiandien</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="stat-mini p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-upload text-blue-600"></i>
              </div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Įkelta</span>
            </div>
            <p className="text-3xl font-bold text-slate-800 mb-1">{stats.todayUploaded}</p>
            <p className="text-xs text-slate-500">sąskaitos šiandien</p>
          </div>

          <div className="stat-mini p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-check-circle text-emerald-600"></i>
              </div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Validuota</span>
            </div>
            <p className="text-3xl font-bold text-slate-800 mb-1">{stats.todayValidated}</p>
            <p className="text-xs text-slate-500">sąskaitos šiandien</p>
          </div>

          <div className="stat-mini p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-download text-purple-600"></i>
              </div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Eksportuota</span>
            </div>
            <p className="text-3xl font-bold text-slate-800 mb-1">{stats.todayExported}</p>
            <p className="text-xs text-slate-500">įrašai šiandien</p>
          </div>

          <div className="stat-mini p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-pencil-alt text-amber-600"></i>
              </div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Korekcijos</span>
            </div>
            <p className="text-3xl font-bold text-slate-800 mb-1">{stats.todayCorrections}</p>
            <p className="text-xs text-slate-500">pakeitimai šiandien</p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Greiti Veiksmai</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setShowUploadModal(true)}
            className="card p-6 text-left hover:shadow-lg transition-all group"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <i className="fas fa-upload text-indigo-600 text-xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Įkelti Sąskaitą</h3>
            <p className="text-sm text-slate-600">Įkelkite naują pirkimo ar pardavimo sąskaitą</p>
          </button>

          <button
            onClick={() => setCurrentView('export')}
            className="card p-6 text-left hover:shadow-lg transition-all group"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <i className="fas fa-file-export text-emerald-600 text-xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Eksportuoti Duomenis</h3>
            <p className="text-sm text-slate-600">Eksportuokite validuotas sąskaitas</p>
          </button>

          <button
            onClick={() => setCurrentView('reports')}
            className="card p-6 text-left hover:shadow-lg transition-all group"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <i className="fas fa-chart-line text-purple-600 text-xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Peržiūrėti Ataskaitas</h3>
            <p className="text-sm text-slate-600">Analizuokite duomenis ir tendencijas</p>
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Paskutinė Veikla</h2>

        <div className="card p-6">
          <div className="space-y-4">
            <div className="flex gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="fas fa-check text-green-600"></i>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">Sąskaita TV-843 validuota</p>
                <p className="text-xs text-slate-500">Prieš 5 minutes · Mantas Petraitis</p>
              </div>
            </div>

            <div className="flex gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="fas fa-upload text-blue-600"></i>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">Įkelta 3 naujos sąskaitos</p>
                <p className="text-xs text-slate-500">Prieš 15 minučių · Sistema</p>
              </div>
            </div>

            <div className="flex gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="fas fa-download text-purple-600"></i>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">Eksportuota 12 sąskaitų į Rivilės sistemą</p>
                <p className="text-xs text-slate-500">Prieš 1 valandą · Mantas Petraitis</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="fas fa-link text-amber-600"></i>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">5 prekės susietos rankiniu būdu</p>
                <p className="text-xs text-slate-500">Prieš 2 valandas · Mantas Petraitis</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
