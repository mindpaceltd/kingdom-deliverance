import { describe, it, expect } from 'vitest'

// Helper function mirroring auth callback recovery redirect resolution
export function getRecoveryRedirectUrl(next: string | null, origin: string = 'https://kdcuganda.org'): string {
  const destination = next && next !== '/account' ? next : '/account/reset-password'
  return `${origin}${destination}`
}

// Helper function mirroring auth callback failure redirect resolution
export function getFailureRedirectUrl(next: string | null, origin: string = 'https://kdcuganda.org'): string {
  const failureLogin = next?.startsWith('/admin') ? '/admin/login' : '/account/login'
  return `${origin}${failureLogin}?error=auth-callback-failed`
}

// Helper function mirroring admin password validation
export function validateAdminPassword(password: string, confirm: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long for administrative accounts.' }
  }
  if (password !== confirm) {
    return { valid: false, error: 'Passwords do not match. Please verify and try again.' }
  }
  return { valid: true }
}

// Helper function mirroring customer password validation
export function validateCustomerPassword(password: string, confirm: string): { valid: boolean; error?: string } {
  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters.' }
  }
  if (password !== confirm) {
    return { valid: false, error: 'Passwords do not match.' }
  }
  return { valid: true }
}

describe('Password Reset Routing & Validation Logic', () => {
  describe('Recovery redirect destination', () => {
    it('redirects to admin reset-password when next is /admin/reset-password', () => {
      const url = getRecoveryRedirectUrl('/admin/reset-password')
      expect(url).toBe('https://kdcuganda.org/admin/reset-password')
    })

    it('defaults to /account/reset-password when next is null', () => {
      const url = getRecoveryRedirectUrl(null)
      expect(url).toBe('https://kdcuganda.org/account/reset-password')
    })

    it('defaults to /account/reset-password when next is /account', () => {
      const url = getRecoveryRedirectUrl('/account')
      expect(url).toBe('https://kdcuganda.org/account/reset-password')
    })
  })

  describe('Failure redirect destination', () => {
    it('redirects to /admin/login when failure happens with admin next param', () => {
      const url = getFailureRedirectUrl('/admin/reset-password')
      expect(url).toBe('https://kdcuganda.org/admin/login?error=auth-callback-failed')
    })

    it('redirects to /account/login when failure happens with customer next param', () => {
      const url = getFailureRedirectUrl('/account/reset-password')
      expect(url).toBe('https://kdcuganda.org/account/login?error=auth-callback-failed')
    })

    it('redirects to /account/login when next is null', () => {
      const url = getFailureRedirectUrl(null)
      expect(url).toBe('https://kdcuganda.org/account/login?error=auth-callback-failed')
    })
  })

  describe('Admin password validation', () => {
    it('rejects passwords shorter than 8 characters', () => {
      const res = validateAdminPassword('Admin1!', 'Admin1!')
      expect(res.valid).toBe(false)
      expect(res.error).toContain('at least 8 characters')
    })

    it('rejects mismatched passwords', () => {
      const res = validateAdminPassword('AdminPassword123!', 'AdminPassword456!')
      expect(res.valid).toBe(false)
      expect(res.error).toContain('do not match')
    })

    it('accepts valid admin passwords of 8+ characters', () => {
      const res = validateAdminPassword('SecureAdminPassword123!', 'SecureAdminPassword123!')
      expect(res.valid).toBe(true)
      expect(res.error).toBeUndefined()
    })
  })

  describe('Customer password validation', () => {
    it('rejects passwords shorter than 6 characters', () => {
      const res = validateCustomerPassword('12345', '12345')
      expect(res.valid).toBe(false)
      expect(res.error).toContain('at least 6 characters')
    })

    it('rejects mismatched passwords', () => {
      const res = validateCustomerPassword('123456', '123457')
      expect(res.valid).toBe(false)
      expect(res.error).toContain('do not match')
    })

    it('accepts valid passwords of 6+ characters', () => {
      const res = validateCustomerPassword('validpassword', 'validpassword')
      expect(res.valid).toBe(true)
      expect(res.error).toBeUndefined()
    })
  })
})
