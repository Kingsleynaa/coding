import axios from "axios"
import jwtDecode from "jwt-decode";

const login = async (email, password) => {
  let userCredentials = {
    "email": email,
    "password": password
  };

  try {
    let response = await axios.post(`${process.env.REACT_APP_API_SERVER}/api/users/login`, userCredentials, {
      headers: {
        "Content-Type": "application/json"
      }
    })

    if (response.status === 200) {
      let decodedJwtToken = jwtDecode(response.data)

      localStorage.setItem("token", response.data)
      sessionStorage.setItem("displayName", decodedJwtToken["given_name"])
      return true
      
    }

    return false
  } catch (error) {
    console.error(error.response)
    return false
  }
}

const getUserInformation = async () => {
  if (hasValidJwt()) {
    let jwtToken = localStorage.getItem("token")
    let decodedJwtToken = jwtDecode(jwtToken)

    try {
      let response = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/users/${decodedJwtToken["user_id"]}`)
      if (response.status === 200) {
        return response.data
      }
    } catch (error) {
      console.error(error)
    }
  }
}

const logout = () => {
  localStorage.removeItem("token")
  return true
}

const hasValidJwt = () => {
  let jwtToken = localStorage.getItem("token")
  if (jwtToken) {
    let decodedJwtToken = jwtDecode(jwtToken)

    let tokenExpiryDate = new Date(decodedJwtToken["exp"] * 1000)
    if (tokenExpiryDate <= new Date()) {
      localStorage.removeItem("token")
      return false
    }
    return true
  }
  return false
}

export { login, hasValidJwt, logout, getUserInformation };