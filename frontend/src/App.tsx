import { C1Chat, ThemeProvider } from '@thesysai/genui-sdk'
import '@crayonai/react-ui/styles/index.css'
import { useState, useCallback } from 'react'
// updted fdfd

const RECOMMENDATIONS = [
  { icon: '📊', text: "Analyze the Indian stock market with today's key signals" },
  { icon: '🧭', text: "Analyse Conditions of Large, Mid and Small Cap in Indian Market" },
  { icon: '📰', text: 'Track major stock market events shaping investor sentiment' },
  { icon: '🌍', text: 'How global news connects with Indian market movements' }
]

function useMessageSender() {
  const sendMessage = useCallback((text: string) => {
    document.body.setAttribute('data-programmatic-interaction', 'true')
    setTimeout(() => {
      const inputElement = document.querySelector('textarea, input[type="text"]') as any
      if (inputElement) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          inputElement instanceof HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype,
          'value'
        )?.set
        nativeInputValueSetter?.call(inputElement, text)
        inputElement.dispatchEvent(new Event('input', { bubbles: true }))
        
        setTimeout(() => {
          const sendButton = document.querySelector('button[type="submit"], button[aria-label*="send" i]') as HTMLButtonElement
          sendButton ? sendButton.click() : inputElement.closest('form')?.requestSubmit()
          setTimeout(() => document.body.removeAttribute('data-programmatic-interaction'), 100)
        }, 300)
      }
    }, 100)
  }, [])
  return sendMessage
}

function App() {
  const [showRecommendations, setShowRecommendations] = useState(true)
  const [hasMessages, setHasMessages] = useState(false)
  const sendMessage = useMessageSender()

  // Handle Recommendation Click
  const handleRecommendationClick = useCallback((text: string) => {
    setShowRecommendations(false)
    setHasMessages(true)
    sendMessage(text)
  }, [sendMessage])

  return (
    <div className="app-container">
      <ThemeProvider mode="dark">
        <C1Chat
          // UPDATED URL TO YOUR WORKING BACKEND
          apiUrl="https://market-insights-fd7r.onrender.com/api/chat"
          agentName="Market Insight"
          logoUrl="/icon.png"
          formFactor="full-page"
        />
      </ThemeProvider>
      
      {showRecommendations && !hasMessages && (
        <div className="recommendations-overlay">
          <div className="recommendations-container">
            {RECOMMENDATIONS.map((rec, i) => (
              <div key={i} className="recommendation-box" onClick={() => handleRecommendationClick(rec.text)}>
                <span className="recommendation-icon">{rec.icon}</span>
                <p className="recommendation-text">{rec.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default App