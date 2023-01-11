import React, { useEffect, useState } from 'react'
import { LayoutNoSidebar } from '../layouts/LayoutNoSidebar'
import { Link } from "react-router-dom"
import { RowProject } from '../components/projects/RowProject'
import axios from 'axios'
import { getUserInformation } from '../services/UserService'
import { dateFormat } from '../utils/CommonUtils'

const PROJECT_SCOPE = {
  "ALL": "ALL",
  "CREATED_BY_YOU": "CREATED_BY_YOU",
  "ASSOCIATED_WITH_YOU": "ASSOCIATED_WITH_YOU"
}

Object.freeze(PROJECT_SCOPE)

export const ProjectList = () => {
  const [projects, setProjects] = useState([])
  const [projectScope, setProjectScope] = useState()
  const [currentUser, setCurrentUser] = useState({})

  // Verify user role on page load
  useEffect(() => {
    const loadUserData = async () => {
      let currentUser = await getUserInformation()

      if (currentUser["roleName"] == "User") {
        setProjectScope(PROJECT_SCOPE.ASSOCIATED_WITH_YOU)
      } else {
        setProjectScope(PROJECT_SCOPE.ALL)
      }

      setCurrentUser(currentUser)
    }

    loadUserData()
    document.title = "Projects"
  }, [])

  useEffect(() => {
    if (projectScope != null) {
      searchProjects()
    }
  }, [projectScope])

  const searchProjects = async () => {
    let searchResponse = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/search?scope=${projectScope}`)
    if (searchResponse.status == 200) {
      setProjects(searchResponse.data)
    }
  }

  useEffect(() => {
    console.log(currentUser)
  }, [currentUser])

  return (
    <LayoutNoSidebar>
      <div className='container'>
        <div className="d-flex justify-content-between py-3 border-bottom align-content-center">
          <h5 className="mb-0 align-self-center bold">Projects</h5>
          <Link to={"/projects/new"} className="btn btn-primary font-sm no-decoration-on-hover align-self-center">New Project</Link>
        </div>

        <div className="d-flex justify-content-between border-bottom flex-wrap">
          <div className="d-flex order-2 order-lg-1 order-md-1">
            {currentUser["roleName"] == "" && (
              <>
                <span onClick={e => setProjectScope(PROJECT_SCOPE.ALL)} className={`nav-link font-sm milestones-scope text-dark ${projectScope == PROJECT_SCOPE.ALL ? "active bold" : ""}`} href="/" style={{ whiteSpace: "nowrap", cursor: "pointer" }}>All</span>
                <span onClick={e => setProjectScope(PROJECT_SCOPE.CREATED_BY_YOU)} className={`nav-link font-sm milestones-scope text-dark ${projectScope == PROJECT_SCOPE.CREATED_BY_YOU ? "active bold" : ""}`} href="/" style={{ whiteSpace: "nowrap", cursor: "pointer" }}>Created by you</span>
              </>
            )
            }

            {currentUser["roleName"] == "Project Manager" && (
              <>
                <span onClick={e => setProjectScope(PROJECT_SCOPE.ALL)} className={`nav-link font-sm milestones-scope text-dark ${projectScope == PROJECT_SCOPE.ALL ? "active bold" : ""}`} href="/" style={{ whiteSpace: "nowrap", cursor: "pointer" }}>All</span>
                <span onClick={e => setProjectScope(PROJECT_SCOPE.CREATED_BY_YOU)} className={`nav-link font-sm milestones-scope text-dark ${projectScope == PROJECT_SCOPE.CREATED_BY_YOU ? "active bold" : ""}`} href="/" style={{ whiteSpace: "nowrap", cursor: "pointer" }}>Created by you</span>
              </>
            )
            }

            {currentUser["roleName"] == "User" && (
              <>
                <span onClick={e => setProjectScope(PROJECT_SCOPE.ASSOCIATED_WITH_YOU)} className={`nav-link font-sm milestones-scope text-dark ${projectScope == PROJECT_SCOPE.ASSOCIATED_WITH_YOU ? "active bold" : ""}`} style={{ whiteSpace: "nowrap", cursor: "pointer" }} href="/">Associated with you</span>
              </>
            )
            }
          </div>

          <div className="d-flex order-1 order-lg-2 order-md-1 flex-grow-1 flex-lg-grow-0 flex-md-grow-1 flex-sm-grow-1">
            <input className="form-control font-sm my-1 flex-grow-1 me-2 h-wrap-content align-self-center w-auto" placeholder="Search by project name" />
            <select className="form-select font-sm my-1 w-auto flex-grow-1 h-wrap-content align-self-center" aria-label="Default select example">
              <option selected value="1">Date Updated (Newest First)</option>
              <option value="2">Date Updated (Oldest First)</option>
              <option value="3">Date Created (Newest First)</option>
              <option value="4">Date Created (Oldest First)</option>
            </select>
          </div>
        </div>

        <div className="border-bottom py-3 flex-wrap d-none d-lg-block mb-sm-0 mb-lg-2">
          <div className='row'>
            <div class="col-lg-3 font-sm bold">Project</div>
            <div class="col-lg-2 font-sm bold">Project Lead</div>
            <div class="col-lg-2 font-sm bold">Milestone Progress</div>
            <div class="col-lg-3 font-sm bold text-center">Date Updated</div>
            <div class="col-lg-2 font-sm bold"></div>
          </div>
        </div>

        {/* Rows of projects
        Retrieve json data from server here */}
        {projects.map((project, index) =>
          <RowProject
            key={index}
            index={index}
            project={project}
          />
        )}
      </div>
    </LayoutNoSidebar>
  )
}
