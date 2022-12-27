import axios from 'axios'
import jwtDecode from 'jwt-decode'
import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from "../logo.jpeg"
import { getUserInformation, logout } from '../services/UserService'
import { Notifications } from './notifications/Notifications'

export const Navbar = () => {
  let navigate = useNavigate()
  const jwt = jwtDecode(localStorage.getItem("token"))
  const [displayName] = useState(jwt["given_name"])
  const [roleName, setRoleName] = useState("")

  useEffect(() => {
    getUserRole()
  }, [])

  const getUserRole = async () => {
    let response = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/users/${jwt["user_id"]}/role`)
    setRoleName(response.data["name"])
  }

  const logoutCurrentUser = () => {
    if (logout()) {
      navigate("/user/login")
    }
  }

  return (
    <>
      <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm fixed-navbar d-none d-lg-flex" id="navbar-desktop">
        <div class="container-fluid mx-2">
          <Link class="navbar-brand" to={"/"}><img src={logo} style={{ maxHeight: "28px" }} /></Link>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarSupportedContent">
            <ul class="ms-auto navbar-nav mb-2 mb-lg-0">
              <Notifications />
              <li class="nav-item dropdown">
                <span className="font-sm" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                  <div className="d-flex font-sm">
                    <fa class="fa fa-user me-3 align-self-center"></fa>
                    <div>
                      {displayName}
                      <br />
                      <span className='badge bg-light rounded-pill text-dark border'>
                        {roleName}
                      </span>
                    </div>
                  </div>
                </span>
                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                  <li><a className="dropdown-item font-sm no-decoration-on-hover" href="#">Profile</a></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><a className="dropdown-item font-sm no-decoration-on-hover text-danger" onClick={logoutCurrentUser} style={{ cursor: "pointer" }} >Sign Out</a></li>
                </ul>
              </li>
            </ul>
          </div>
        </div >
      </nav >

      <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm fixed-navbar font-sm d-flex d-lg-none" id="navbar-mobile">
        <div class="container-fluid">
          <Link class="navbar-brand" to={"/"}><img src={logo} style={{ maxHeight: "28px" }} /></Link>

          <div className='d-flex'>
            <div className='align-self-center me-3'>
              <Notifications />
            </div>

            <div className='align-self-center me-3'>
              <span className="font-sm" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                <div className="d-flex font-sm">
                  <fa class="fa fa-user me-3 align-self-center"></fa>
                  <div>
                    {displayName}
                    <br />
                    <span className='badge bg-light rounded-pill text-dark'>
                      {roleName}
                    </span>
                  </div>
                </div>
              </span>
              <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                <li><a className="dropdown-item font-sm no-decoration-on-hover" href="#">Profile</a></li>
                <li><hr className="dropdown-divider" /></li>
                <li><a className="dropdown-item font-sm no-decoration-on-hover text-danger" onClick={logoutCurrentUser} style={{ cursor: "pointer" }} >Sign Out</a></li>
              </ul>
            </div>

            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
              <span class="navbar-toggler-icon"></span>
            </button>
          </div>

          <div class="collapse navbar-collapse" id="navbarSupportedContent">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0">
              <li class="nav-item">
                <a class="nav-link active" aria-current="page" href="#">Home</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#">Link</a>
              </li>
              <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                  Dropdown
                </a>
                <ul class="dropdown-menu" aria-labelledby="navbarDropdown">
                  <li><a class="dropdown-item" href="#">Action</a></li>
                  <li><a class="dropdown-item" href="#">Another action</a></li>
                  <li><hr class="dropdown-divider" /></li>
                  <li><a class="dropdown-item" href="#">Something else here</a></li>
                </ul>
              </li>
              <li class="nav-item">
                <a class="nav-link disabled" href="#" tabindex="-1" aria-disabled="true">Disabled</a>
              </li>
            </ul>
            <form class="d-flex">
            </form>
          </div>
        </div>
      </nav>
    </>


  )
}
