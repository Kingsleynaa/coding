import React from 'react'
import { Navigate } from "react-router-dom"
import { hasValidJwt } from '../services/UserService'

// User can only access page if they are not logged in
export const AnonymousRoute = (props) => {
  let isJwtPresent = hasValidJwt()

  if (!isJwtPresent) {
    return props.children
  }

  return (
    <Navigate to="../" replace />
  )
}
