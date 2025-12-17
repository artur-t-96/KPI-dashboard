import { Briefcase, FileText, PieChart, Users } from 'lucide-react';

export default function Board() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">👔 Rada Nadzorcza</h1>
        <p className="text-gray-600">Raporty i podsumowania dla zarządu</p>
      </div>

      {/* Placeholder Content */}
      <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl shadow-sm p-12">
        <div className="text-center max-w-lg mx-auto">
          <div className="w-24 h-24 bg-white rounded-full mx-auto flex items-center justify-center shadow-lg mb-6">
            <Briefcase className="w-12 h-12 text-slate-600" />
          </div>
          
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Moduł w przygotowaniu
          </h2>
          
          <p className="text-gray-600 mb-8">
            Moduł raportowy dla Rady Nadzorczej. 
            Zawierać będzie zagregowane dane i raporty PDF.
          </p>

          {/* Feature preview cards */}
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <FileText className="w-8 h-8 text-slate-600 mb-2" />
              <h3 className="font-semibold text-gray-800">Raporty PDF</h3>
              <p className="text-sm text-gray-500">Eksport raportów miesięcznych</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <PieChart className="w-8 h-8 text-blue-500 mb-2" />
              <h3 className="font-semibold text-gray-800">Dashboard</h3>
              <p className="text-sm text-gray-500">Kluczowe wskaźniki firmy</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <Users className="w-8 h-8 text-green-500 mb-2" />
              <h3 className="font-semibold text-gray-800">Zespół</h3>
              <p className="text-sm text-gray-500">Podsumowanie HR</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <Briefcase className="w-8 h-8 text-purple-500 mb-2" />
              <h3 className="font-semibold text-gray-800">Finanse</h3>
              <p className="text-sm text-gray-500">Przegląd finansowy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Coming soon badge */}
      <div className="text-center">
        <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-800 rounded-full text-sm font-medium">
          🚀 Planowana data: Q2 2025
        </span>
      </div>
    </div>
  );
}
