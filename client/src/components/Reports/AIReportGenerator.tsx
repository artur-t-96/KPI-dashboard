import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { generateReport, getReports, deleteReport, SavedReport, ReportResponse } from '../../services/api';
import { Send, Loader2, FileText, Trash2, Download, Clock, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function AIReportGenerator() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
    // Refresh reports every minute to update remaining time
    const interval = setInterval(loadReports, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadReports = async () => {
    try {
      const data = await getReports();
      setReports(data);
    } catch (error) {
      console.error('Failed to load reports:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userMessage = query.trim();
    setQuery('');
    setLoading(true);

    // Add user message to conversation
    const newConversation = [...conversation, { role: 'user' as const, content: userMessage }];
    setConversation(newConversation);

    try {
      const response: ReportResponse = await generateReport(
        userMessage,
        conversation.length > 0 ? conversation : undefined
      );

      if (response.type === 'question') {
        // AI is asking a clarifying question
        setConversation([...newConversation, { role: 'assistant', content: response.content }]);
      } else {
        // Report generated
        setConversation([...newConversation, {
          role: 'assistant',
          content: `Raport "${response.reportTitle}" zostal wygenerowany i zapisany.`
        }]);
        // Clear conversation after successful report
        setTimeout(() => {
          setConversation([]);
        }, 2000);
        loadReports();
      }
    } catch (error) {
      setConversation([...newConversation, {
        role: 'assistant',
        content: 'Przepraszam, wystapil blad. Sprobuj ponownie.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunac ten raport?')) return;

    try {
      await deleteReport(id);
      setReports(reports.filter(r => r.id !== id));
      if (expandedReport === id) setExpandedReport(null);
    } catch (error) {
      alert('Blad usuwania raportu');
    }
  };

  const handleDownloadPDF = (report: SavedReport) => {
    // Create a simple HTML representation for printing
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${report.title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
          h2 { color: #374151; margin-top: 24px; }
          h3 { color: #6b7280; }
          table { border-collapse: collapse; width: 100%; margin: 16px 0; }
          th, td { border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; }
          th { background-color: #f3f4f6; }
          ul, ol { margin: 12px 0; padding-left: 24px; }
          li { margin: 4px 0; }
          p { line-height: 1.6; }
          .meta { color: #6b7280; font-size: 12px; margin-bottom: 24px; }
        </style>
      </head>
      <body>
        <h1>${report.title}</h1>
        <div class="meta">Wygenerowano: ${new Date(report.createdAt).toLocaleString('pl-PL')}</div>
        ${report.content.replace(/\n/g, '<br>')}
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  const cardClass = isDark ? 'bg-gray-800' : 'bg-white';
  const textClass = isDark ? 'text-white' : 'text-gray-800';
  const mutedTextClass = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderClass = isDark ? 'border-gray-700' : 'border-gray-200';
  const inputClass = isDark
    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500';

  return (
    <div className="space-y-4">
      {/* Report Input */}
      <div className={`${cardClass} rounded-xl shadow-sm p-4`}>
        <div className="flex items-center gap-2 mb-3">
          <FileText className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <h3 className={`font-semibold ${textClass}`}>Generator Raportow AI</h3>
        </div>

        {/* Conversation */}
        {conversation.length > 0 && (
          <div className={`mb-4 p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'} space-y-3`}>
            {conversation.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : isDark ? 'bg-gray-600 text-gray-100' : 'bg-white text-gray-800 border border-gray-200'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className={`px-3 py-2 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-white border border-gray-200'}`}>
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Np. 'Pokaz podsumowanie wynikow za ostatni tydzien' lub 'Kto ma najlepsze wyniki?'"
            className={`flex-1 px-4 py-2 rounded-lg border ${inputClass} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>

        <p className={`text-xs ${mutedTextClass} mt-2`}>
          Zapytaj o dowolny raport KPI. AI moze zadac dodatkowe pytania jesli potrzebuje wiecej informacji.
        </p>
      </div>

      {/* Saved Reports */}
      {reports.length > 0 && (
        <div className={`${cardClass} rounded-xl shadow-sm p-4`}>
          <h3 className={`font-semibold ${textClass} mb-3 flex items-center gap-2`}>
            <MessageSquare className="w-5 h-5" />
            Wygenerowane raporty ({reports.length})
          </h3>

          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.id} className={`border ${borderClass} rounded-lg overflow-hidden`}>
                {/* Report Header */}
                <div
                  className={`p-3 flex items-center justify-between cursor-pointer ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                  onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                >
                  <div className="flex-1">
                    <h4 className={`font-medium ${textClass}`}>{report.title}</h4>
                    <div className={`flex items-center gap-3 text-xs ${mutedTextClass} mt-1`}>
                      <span>{new Date(report.createdAt).toLocaleString('pl-PL')}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {report.remainingMinutes > 0 ? `${report.remainingMinutes} min` : 'Wygasa'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDownloadPDF(report); }}
                      className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-100'}`}
                      title="Pobierz PDF"
                    >
                      <Download className={`w-4 h-4 ${mutedTextClass}`} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteReport(report.id); }}
                      className={`p-2 rounded-lg ${isDark ? 'hover:bg-red-900/30' : 'hover:bg-red-50'}`}
                      title="Usun"
                    >
                      <Trash2 className={`w-4 h-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                    </button>
                  </div>
                </div>

                {/* Report Content */}
                {expandedReport === report.id && (
                  <div className={`p-4 border-t ${borderClass} ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
                      <ReactMarkdown
                        components={{
                          table: ({ children }) => (
                            <div className="overflow-x-auto">
                              <table className={`w-full border-collapse ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                                {children}
                              </table>
                            </div>
                          ),
                          th: ({ children }) => (
                            <th className={`border px-3 py-2 text-left text-sm font-semibold ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-100'}`}>
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td className={`border px-3 py-2 text-sm ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                              {children}
                            </td>
                          ),
                          h1: ({ children }) => <h1 className={`text-xl font-bold ${textClass} mt-4 mb-2`}>{children}</h1>,
                          h2: ({ children }) => <h2 className={`text-lg font-semibold ${textClass} mt-3 mb-2`}>{children}</h2>,
                          h3: ({ children }) => <h3 className={`text-base font-medium ${textClass} mt-2 mb-1`}>{children}</h3>,
                          p: ({ children }) => <p className={`${mutedTextClass} mb-2`}>{children}</p>,
                          ul: ({ children }) => <ul className={`list-disc list-inside ${mutedTextClass} mb-2`}>{children}</ul>,
                          ol: ({ children }) => <ol className={`list-decimal list-inside ${mutedTextClass} mb-2`}>{children}</ol>,
                          li: ({ children }) => <li className="mb-1">{children}</li>,
                          strong: ({ children }) => <strong className={textClass}>{children}</strong>,
                        }}
                      >
                        {report.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
