import React, { useEffect } from 'react'
import { Navbar } from '../components/Navbar'
import $ from "jquery"

export const LayoutNoSidebar = (props) => {

  useEffect(() => {
    $(".content").css("margin-top", $("#navbar-mobile").outerHeight())
    $(".content").css("margin-top", $("#navbar-desktop").outerHeight())
  }, [])

  return (
    <>
      <Navbar />

      <div className="content">
        {props.children}
      </div>
    </>
  )
}
