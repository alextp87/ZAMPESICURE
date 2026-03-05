"use client"

import { useState, useCallback } from "react"

interface GeolocationState {
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  error: string | null
  loading: boolean
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: false,
  })

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "La geolocalizzazione non e supportata dal tuo browser",
      }))
      return
    }

    setState((prev) => ({ ...prev, loading: true, error: null }))

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false,
        })
      },
      (error) => {
        let errorMessage = "Errore durante il recupero della posizione"
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Permesso di geolocalizzazione negato"
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Posizione non disponibile"
            break
          case error.TIMEOUT:
            errorMessage = "Timeout durante il recupero della posizione"
            break
        }
        setState({
          latitude: null,
          longitude: null,
          accuracy: null,
          error: errorMessage,
          loading: false,
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }, [])

  return {
    ...state,
    getCurrentPosition,
  }
}
