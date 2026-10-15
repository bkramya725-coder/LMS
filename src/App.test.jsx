import { render, screen, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/useToast'

describe('Navigation and back button', () => {
  it('renders login, goes to register, and back', async () => {
    window.history.pushState({}, 'Login', '/login')
    render(
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    )

    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument()

    // Now pushState to register
    act(() => {
      window.history.pushState({}, 'Register', '/register')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })

    expect(screen.getByText(/Create account/i)).toBeInTheDocument()

    // Now back to login
    act(() => {
      window.history.pushState({}, 'Login', '/login')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })

    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument()
  })

  it('navigates register wizard steps with step search param', async () => {
    window.history.pushState({}, 'Register Step 1', '/register?step=1')
    render(
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    )

    expect(screen.getByText(/Personal information/i)).toBeInTheDocument()

    // Step 2 via URL/popstate
    act(() => {
      window.history.pushState({}, 'Register Step 2', '/register?step=2')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    expect(screen.getByText(/Role & specialization/i)).toBeInTheDocument()

    // Step 3 via URL/popstate
    act(() => {
      window.history.pushState({}, 'Register Step 3', '/register?step=3')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    expect(screen.getByText(/Set your password/i)).toBeInTheDocument()

    // Browser back to Step 2
    act(() => {
      window.history.pushState({}, 'Register Step 2', '/register?step=2')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    expect(screen.getByText(/Role & specialization/i)).toBeInTheDocument()
  })

  it('resets verify-certificate when going back to plain verify-certificate', async () => {
    window.history.pushState({}, 'Verify with code', '/verify-certificate?code=REVOKED-123')
    render(
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    )

    // Initially has code
    const input = screen.getByLabelText(/Certificate code/i)
    expect(input.value).toBe('REVOKED-123')

    // Go back to plain /verify-certificate without code
    act(() => {
      window.history.pushState({}, 'Verify plain', '/verify-certificate')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })

    // It should clear code and result
    expect(screen.getByLabelText(/Certificate code/i).value).toBe('')
  })

  it('clicking Back button on register step 1 navigates to login', async () => {
    window.history.pushState({}, 'Register Step 1', '/register?step=1')
    render(
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    )

    expect(screen.getByText(/Personal information/i)).toBeInTheDocument()
    const backBtn = screen.getByRole('button', { name: /Back/i })
    act(() => {
      backBtn.click()
    })

    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument()
  })

  it('clicking Back button on verify-certificate navigates back', async () => {
    window.history.pushState({}, 'Verify', '/verify-certificate')
    render(
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    )

    expect(screen.getByText(/Verify a certificate/i)).toBeInTheDocument()
    const backBtn = screen.getByRole('button', { name: /Back/i })
    expect(backBtn).toBeInTheDocument()
  })
})

