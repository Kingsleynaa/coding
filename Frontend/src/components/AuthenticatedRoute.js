import React from 'react'
import { Navigate } from "react-router-dom"
import { hasValidJwt } from '../services/UserService'

export const AuthenticatedRoute = (props) => {
  let isJwtPresent = hasValidJwt()

  if (isJwtPresent) {
    return props.children
  }

  return <Navigate to="/user/login" replace />
}
