import React, { createContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'

export const SocketContext = createContext()

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    // Connect to WebSocket
    const newSocket = io('${import.meta.env.VITE_BACKEND_URL}', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    })

    newSocket.on('connect', () => {
      console.log('WebSocket connected')
    })

    newSocket.on('stock_updated', (data) => {
      console.log('Stock updated:', data)
      // Trigger UI update via state/context
    })

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected')
    })

    setSocket(newSocket)

    return () => newSocket.close()
  }, [])

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  )
}