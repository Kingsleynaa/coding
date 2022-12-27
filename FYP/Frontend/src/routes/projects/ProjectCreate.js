import React, { useEffect, useRef, useState } from 'react'
import { LayoutNoSidebar } from '../../layouts/LayoutNoSidebar'
import { Link, useNavigate } from "react-router-dom"
import { createProject } from '../../services/ProjectService'
import $ from "jquery"
import "jquery-validation-unobtrusive"
import moment from 'moment'
import { Alert } from '../../components/Alert'
import axios from 'axios'
import Select from 'react-select'
import azureDevOpsLogo from "../../devops.png"

export const ProjectCreate = () => {
  let navigate = useNavigate()

  const projectName = useRef("")
  const projectedStartDate = useRef("")
  const projectedEndDate = useRef("")
  const projectDescription = useRef("")
  const actualStartDate = useRef(null)
  const paymentAmount = useRef("")

  const selectProjectRef = useRef()
  const [selectedProject, setSelectedProject] = useState({})
  const [isLinked, setIsLinked] = useState(false)
  const [selectedProjectDetails, setSelectProjectDetails] = useState({})

  const [azureProjects, setAzureProjects] = useState({
    "count": 0,
    "value": []
  })

  const [selectOptionsProjects, setSelectOptionsProjects] = useState([])

  // Initialize validation on page load
  useEffect(() => {
    document.title = "Projects - New"

    $.validator.unobtrusive.parse($("#new-project-form"))
    fetchAzureProjects()
  }, [])

  const fetchAzureProjects = async () => {
    let response = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/azure-dev-ops/projects`)
    console.log(response)
    if (response.status === 200) {
      setAzureProjects(response.data)
    }
  }

  useEffect(() => {
    if (azureProjects["count"] > 0) {
      let options = azureProjects["value"].map(x => ({
        "value": x.id,
        "label": x.name
      }))

      setSelectOptionsProjects(options)
    }
  }, [azureProjects])

  const populateFields = async () => {
    let projectDetails = azureProjects["value"].find(x => x["name"] === selectedProject["label"])
    setSelectProjectDetails(projectDetails)

    projectDescription.current.value = projectDetails["description"]
    projectName.current.value = projectDetails["name"]

    $(".close-modal").click()
    setIsLinked(true)
  }

  const submitCreateProjectForm = async () => {
    if (!$("#new-project-form").valid()) {
      return
    }

    let currentFormErrors = []

    if (moment(projectedEndDate.current.value) < moment(projectedStartDate.current.value)) {
      currentFormErrors.push("Projected end date should be later than projected start date.")
    }

    if (currentFormErrors.length > 0) {
      $("#form-errors").html(
        Alert(currentFormErrors.join("<br/>"))
      )
      return
    }

    let projectDetails = {
      name: projectName.current.value,
      description: projectDescription.current.value,
      dateProjectedStart: projectedStartDate.current.value,
      dateProjectedEnd: projectedEndDate.current.value,
      dateActualStart: null,
      paymentAmount: paymentAmount.current.value,
    }

    if (isLinked) {
      projectDetails["azureProjectId"] = selectedProject["value"] !== "" ? selectedProject["value"] : null
    }

    // TODO: Frontend validation for user input
    // Set properties to null if they are empty
    // Backend is only able to ignore optional fields if they are null, will error if empty string is parsed as datetime
    if (moment(actualStartDate.current.value).isValid()) {
      projectDetails["dateActualStart"] = actualStartDate.current.value
    }

    console.log(projectDetails)

    let isProjectCreated = await createProject(projectDetails)
    if (isProjectCreated) {
      navigate("/")
    } else {
      alert("Project creation failed.")
    }
  }


  return (
    <LayoutNoSidebar>
      <div className="container">
        <div className="row justify-content-center">
          <form className="col-lg-8" method="post" id="new-project-form">

            <nav aria-label="breadcrumb">
              <ol className="breadcrumb py-3 my-0">
                <li className="breadcrumb-item font-xsm"><Link to={"/"}>Projects</Link></li>
                <li className="breadcrumb-item active font-xsm" aria-current="page">New</li>
              </ol>
            </nav>

            <hr className="horizontal-divider" />

            <div className='d-flex justify-content-between py-3'>
              <h5 className="mb-0 bold">New Project</h5>

              {!isLinked &&
                <button type="button" className="btn btn-primary font-sm" data-bs-toggle="modal" data-bs-target="#linkProject">
                  Link Azure DevOps Project
                </button>
              }

              {isLinked &&
                <button type="button" className="btn btn-light border font-sm" onClick={e => setIsLinked(false)}>
                  Unlink Azure DevOps Project
                </button>
              }

              <div className="modal fade" id="linkProject" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-lg">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h6 className="modal-title" id="exampleModalLabel">Link Azure Dev Ops Project</h6>
                      <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div className="modal-body">
                      <div className='mb-3'>
                        <label className='form-label font-sm'>Azure Project</label>

                        <Select
                          ref={selectProjectRef}
                          className='font-sm'
                          placeholder={"Search project name"}
                          options={selectOptionsProjects}
                          value={selectedProject}
                          onChange={e => setSelectedProject(e)}
                        />

                      </div>

                      <span className='font-sm'><i className='fa fa-circle-info'></i> Project details would be prepopulated from Azure and commit history would be automatically retrieved.</span>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-outline-dark font-sm close-modal" data-bs-dismiss="modal">Cancel</button>
                      <button type="button" className="btn btn-primary font-sm" onClick={populateFields}>Link</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {isLinked &&
              <div className='mb-3'>
                <div className='font-sm d-flex'>
                  <img src={azureDevOpsLogo} style={{ width: "32px" }}></img>
                  <span>
                    Created project would be linked to <span className='fw-bold'>{selectedProjectDetails["name"]}</span>.
                  </span>
                </div>
              </div>
            }

            <div id="form-errors">
            </div>

            <div className="row">
              <div className="mb-3 col-12">
                <label className="form-label font-sm">Name</label>

                <input ref={projectName}
                  data-val-required="Name is required."
                  name="project-name"
                  data-val="true"
                  className="form-control font-sm" />

                <span className="text-danger font-xsm" data-valmsg-for="project-name" data-valmsg-replace="true"></span>
              </div>

              <div className="mb-3 col-12">
                <label className="form-label font-sm">Payment Amount</label>

                <div className="input-group">
                  <span className="input-group-text font-sm">($) SGD</span>
                  <input
                    ref={paymentAmount}
                    data-val-required="Payment amount is required."
                    data-val-range-min={0}
                    placeholder="0.00"
                    data-val-range="Payment amount must be a positive number."
                    data-val-regex="Payment amount can only have 2 decimal places."
                    data-val-regex-pattern="^[0-9]*(\.[0-9]{0,2})?$"
                    type="text"
                    name='payment-amount'
                    className="form-control font-sm"
                    data-val="true"
                  />
                </div>
                <span className="text-danger font-xsm" data-valmsg-for="payment-amount" data-valmsg-replace="true"></span>

              </div>

              <div className="mb-3 col-6">
                <label className="form-label font-sm">Projected Start Date</label>
                <input ref={projectedStartDate}
                  data-val-required="Projected start date is required."
                  name='projected-start-date'
                  data-val="true"
                  type="date"
                  className="form-control font-sm" />
                <span className="text-danger font-xsm" data-valmsg-for="projected-start-date" data-valmsg-replace="true"></span>
              </div>

              <div className="mb-3 col-6">
                <label className="form-label font-sm">Projected End Date</label>
                <input ref={projectedEndDate}
                  data-val-required="Projected end date is required."
                  name='projected-end-date'
                  data-val="true"
                  type="date"
                  className="form-control font-sm" />
                <span className="text-danger font-xsm" data-valmsg-for="projected-end-date" data-valmsg-replace="true"></span>
              </div>

              <div className="mb-3 col-12">
                <label className="form-label font-sm">Description</label>
                <textarea ref={projectDescription}
                  data-val-required="Description is required."
                  name="description"
                  data-val="true"
                  className="form-control font-sm"
                  rows="5" ></textarea>
                <span className="text-danger font-xsm" data-valmsg-for="description" data-valmsg-replace="true"></span>
              </div>

              <div className="mb-3 col-6">
                <label className="form-label font-sm">Actual Start Date (Optional)</label>
                <input ref={actualStartDate} type="date" className="form-control font-sm" />
                <span className="text-danger font-xsm"></span>
              </div>

              <div className="mb-3 col-6">
                <label className="form-label font-sm">Actual End Date</label>
                <br />
                <span className="font-xsm"><i className='fa fa-circle-info'></i> The actual end date would be recorded as the day when all milestones of the project has been marked completed.</span>
              </div>

            </div>

            <button onClick={submitCreateProjectForm} type="button" className="btn btn-primary font-sm me-2">Create Project</button>
            <Link to={"/"} className="btn btn-outline-dark font-sm no-decoration-on-hover">Cancel</Link>
          </form>
        </div>
      </div >
    </LayoutNoSidebar >
  )
}
