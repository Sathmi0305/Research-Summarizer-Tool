import React, { useState, useRef } from 'react';
import { Newspaper, Search, ExternalLink, Loader } from 'lucide-react';
import axios from 'axios';

interface Source {
  url: string;
  title: string;
}

function App() {
  const [urls, setUrls] = useState<string>('');
  const [query, setQuery] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [processedData, setProcessedData] = useState<boolean>(false);
  const [answer, setAnswer] = useState<string>('');
  const [sources, setSources] = useState<Source[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Mock function to simulate processing URLs
  const processUrls = async () => {
    if (!urls.trim()) {
      setError('Please enter at least one URL');
      return;
    }

    setIsProcessing(true);
    setError(null);
    
    try {
      // In a real implementation, this would call a backend API
      // Simulating processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const urlList = urls.split('\n').filter(url => url.trim());
      
      // Mock sources from the URLs
      const mockSources = urlList.map(url => ({
        url,
        title: url.split('/').pop() || 'Article'
      }));
      
      setSources(mockSources);
      setProcessedData(true);
      setError(null);
    } catch (err) {
      setError('Error processing URLs. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Mock function to simulate searching
  const searchArticles = async () => {
    if (!query.trim()) {
      setError('Please enter a question');
      return;
    }

    if (!processedData) {
      setError('Please process URLs first');
      return;
    }

    setIsSearching(true);
    setError(null);
    setAnswer('');
    
    try {
      // In a real implementation, this would call a backend API
      // Simulating search delay and streaming response
      const mockAnswers = [
        "Based on the articles you've provided, ",
        "I can see that the topic you're asking about ",
        "is discussed in several sources. ",
        "The main points from the articles suggest that ",
        "this is an important development in the field. ",
        "According to the sources, there are multiple perspectives on this issue. ",
        "Some experts believe it will have significant impact, ",
        "while others are more cautious about the implications. ",
        "The data from these articles indicates a growing trend ",
        "that merits further investigation and analysis."
      ];
      
      // Simulate streaming response
      for (const part of mockAnswers) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setAnswer(prev => prev + part);
      }
    } catch (err) {
      setError('Error searching articles. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
          <Newspaper className="h-8 w-8 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">News Research Tool</h1>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Newspaper className="h-5 w-5 text-blue-500 mr-2" />
              Enter URLs to analyze
            </h2>
            <textarea
              className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:shadow-outline"
              rows={5}
              placeholder="https://example.com/article1&#10;https://example.com/article2"
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              disabled={isProcessing}
            />
            <div className="mt-4">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
                onClick={processUrls}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                    Processing...
                  </>
                ) : (
                  'Process URLs'
                )}
              </button>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Search className="h-5 w-5 text-blue-500 mr-2" />
              Ask questions about the articles
            </h2>
            <div className="flex">
              <input
                type="text"
                className="flex-grow px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:shadow-outline"
                placeholder="Enter your question"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={isSearching || !processedData}
              />
              <button
                className="ml-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
                onClick={searchArticles}
                disabled={isSearching || !processedData}
              >
                {isSearching ? (
                  <>
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                    Searching...
                  </>
                ) : (
                  'Search'
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {answer && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Answer</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-800">{answer}</p>
              </div>
              
              {sources.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-md font-medium text-gray-900 mb-2">Sources:</h3>
                  <ul className="list-disc pl-5">
                    {sources.map((source, index) => (
                      <li key={index} className="text-blue-600 hover:text-blue-800">
                        <a href={source.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                          {source.url}
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            Built with React and Tailwind CSS
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;