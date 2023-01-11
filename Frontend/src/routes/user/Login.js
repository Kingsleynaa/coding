import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NavbarOnlyLogo } from '../../components/NavbarOnlyLogo'
import { login } from '../../services/UserService'
import $ from "jquery"
import "jquery-validation-unobtrusive"
import { Alert } from "../../components/Alert"

const Login = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const authenticate = async () => {
    if (!$("#login-form").valid()) {
      return
    }

    console.log("Logging in...")

    let isLoginSuccessful = await login(email, password)

    if (isLoginSuccessful) {
      navigate("/")
    } else {
      $("#form-errors").html(Alert("Invalid credentials, please try again."))
    }
  }

  useEffect(() => {
    $.validator.unobtrusive.parse($("#login-form"))
  }, [])

  const checkForEnterKeyUp = (e) => {
    if (e.keyCode === 13) {
      authenticate()
    }
  }

  return (
    <>
      <NavbarOnlyLogo />
      <div className='row justify-content-center align-content-center' style={{ paddingTop: "65px" }}>
        <div className='col-lg-3 col-md-5 col-sm-10'>
          <h5 className='p-0'>Login</h5>
          <hr className='my-3' />

          <form id='login-form'>
            <div className="row">
              <div id="form-errors"></div>

              <div className="mb-3 col-12">
                <label className="form-label font-sm">Email</label>
                <input
                  type={"email"}
                  data-val-required="Email is required."
                  name="email"
                  data-val="true"
                  className="form-control font-sm"
                  value={email}
                  onKeyUp={e => checkForEnterKeyUp(e)}
                  onChange={e => setEmail(e.target.value)} />
                <span
                  data-valmsg-for="email"
                  data-valmsg-replace="true"
                  className="text-danger font-xsm"></span>
              </div>

              <div className="mb-3 col-12">
                <label className="form-label font-sm">Password</label>
                <input
                  data-val-required="Password is required."
                  name="password"
                  data-val="true"
                  className="form-control font-sm"
                  type="password"
                  value={password}
                  onKeyUp={e => checkForEnterKeyUp(e)}
                  onChange={e => setPassword(e.target.value)} />
                <span
                  data-valmsg-for="password"
                  data-valmsg-replace="true"
                  className="text-danger font-xsm"></span>
              </div>

              <div className="mb-3 col-12 d-flex justify-content-between align-content-center">
                <div className="d-flex align-self-center">
                  <input className="form-check-input me-2 font-xsm" type="checkbox" value="" id="flexCheckDefault" />
                  <label className="form-check-label font-xsm">
                    Remember me
                  </label>

                </div>
                <div className="align-self-center">
                  <a href="" className="font-xsm">Forgot your password?</a>
                </div>
              </div>

            </div>
            <button className="btn btn-primary font-sm mb-2 col-12" onClick={authenticate} type="button">Login</button>
          </form>
        </div>
      </div>
    </>
  )
}

export default Login