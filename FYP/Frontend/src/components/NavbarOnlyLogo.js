import React from 'react'
import logo from "../logo.jpeg"

export const NavbarOnlyLogo = () => {
  return (
    <nav className="navbar navbar-light bg-white border-bottom box-shadow px-3" id="navbar">
      <a className="navbar-brand mx-auto"><img src={logo} style={{ maxHeight: "28px" }} /></a>
    </nav>
  )
}
