import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { LanguageProvider, useLanguage } from '@/components/LanguageContext'

// Test component that uses the language context
const TestComponent = () => {
  const { lang, setLang } = useLanguage()
  
  return (
    <div>
      <span data-testid="current-lang">{lang}</span>
      <button onClick={() => setLang('ko')} data-testid="set-ko">
        한국어
      </button>
      <button onClick={() => setLang('en')} data-testid="set-en">
        English
      </button>
    </div>
  )
}

describe('LanguageContext', () => {
  test('should provide default language', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    )
    
    expect(screen.getByTestId('current-lang')).toHaveTextContent('en')
  })

  test('should change language when setLang is called', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    )
    
    const koButton = screen.getByTestId('set-ko')
    const enButton = screen.getByTestId('set-en')
    
    // Change to Korean
    fireEvent.click(koButton)
    expect(screen.getByTestId('current-lang')).toHaveTextContent('ko')
    
    // Change to English
    fireEvent.click(enButton)
    expect(screen.getByTestId('current-lang')).toHaveTextContent('en')
  })

  test('should persist language in sessionStorage', () => {
    const mockSessionStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    }
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true,
    })
    
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    )
    
    const koButton = screen.getByTestId('set-ko')
    fireEvent.click(koButton)
    
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('language', 'ko')
  })

  test('should load language from sessionStorage on mount', () => {
    const mockSessionStorage = {
      getItem: jest.fn().mockReturnValue('ko'),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    }
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true,
    })
    
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    )
    
    expect(screen.getByTestId('current-lang')).toHaveTextContent('ko')
  })
}) 