import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/layout/Layout.js';
import { HomePage } from './pages/HomePage.js';
import { VoicesPage } from './pages/VoicesPage.js';
import { VideoDownloaderPage } from './pages/VideoDownloaderPage.js';
import { VideoDubbingPage } from './pages/VideoDubbingPage.js';
import type { UILanguage } from './types/index.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function App() {
  const [currentLang, setCurrentLang] = useState<UILanguage>('en');

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout currentLang={currentLang} onLanguageChange={setCurrentLang}>
          <Routes>
            <Route path="/" element={<VideoDubbingPage currentLang={currentLang} />} />
            <Route path="/dubbing" element={<VideoDubbingPage currentLang={currentLang} />} />
            <Route path="/story" element={<HomePage currentLang={currentLang} />} />
            <Route path="/downloader" element={<VideoDownloaderPage currentLang={currentLang} />} />
            <Route path="/voices" element={<VoicesPage currentLang={currentLang} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
