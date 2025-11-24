import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }){
  const [me, setMe] = useState(() => {
    const stored = localStorage.getItem('me')
    return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token){
      localStorage.removeItem('me')
      setMe(null)
      setLoading(false)
      return
    }
    try{
      const { data } = await api.get('/auth/me')
      setMe(data.user)
      localStorage.setItem('me', JSON.stringify(data.user))
    }catch(e){
      localStorage.removeItem('token')
      localStorage.removeItem('me')
      setMe(null)
    }finally{
      setLoading(false)
    }
  },[])

  useEffect(()=> {
    refresh()
  },[refresh])

  const logout = useCallback(()=> {
    localStorage.removeItem('token')
    localStorage.removeItem('me')
    setMe(null)
  },[])

  const value = useMemo(()=> ({
    me,
    setMe,
    refresh,
    logout,
    loading
  }),[me, refresh, logout, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(){
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

