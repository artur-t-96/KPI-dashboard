import { TrendingUp, BarChart3, Target, DollarSign } from 'lucide-react';

export default function Sales() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">📈 Sprzedaż</h1>
        <p className="text-gray-600">Moduł KPI dla działu sprzedaży</p>
      </div>

      {/* Placeholder Content */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-sm p-12">
        <div className="text-center max-w-lg mx-auto">
          <div className="w-24 h-24 bg-white rounded-full mx-auto flex items-center justify-center shadow-lg mb-6">
            <TrendingUp className="w-12 h-12 text-green-500" />
          </div>
          
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Moduł w przygotowaniu
          </h2>
          
          <p className="text-gray-600 mb-8">
            Pracujemy nad modułem KPI dla działu sprzedaży. 
            Wkrótce będziesz mógł śledzić wyniki BDM i SDR.
          </p>

          {/* Feature preview cards */}
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <BarChart3 className="w-8 h-8 text-green-500 mb-2" />
              <h3 className="font-semibold text-gray-800">Pipeline</h3>
              <p className="text-sm text-gray-500">Śledzenie lejka sprzedażowego</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <Target className="w-8 h-8 text-blue-500 mb-2" />
              <h3 className="font-semibold text-gray-800">Targety</h3>
              <p className="text-sm text-gray-500">Cele sprzedażowe zespołu</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <DollarSign className="w-8 h-8 text-purple-500 mb-2" />
              <h3 className="font-semibold text-gray-800">Revenue</h3>
              <p className="text-sm text-gray-500">Przychody i prowizje</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <TrendingUp className="w-8 h-8 text-amber-500 mb-2" />
              <h3 className="font-semibold text-gray-800">Trendy</h3>
              <p className="text-sm text-gray-500">Analiza wzrostu</p>
            </div>
          </div>
        </div>
      </div>

      {/* Coming soon badge */}
      <div className="text-center">
        <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
          🚀 Planowana data: Q1 2025
        </span>
      </div>
    </div>
  );
}
