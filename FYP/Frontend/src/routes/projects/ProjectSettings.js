import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { LayoutSidebar } from '../../layouts/LayoutSidebar'
import axios from 'axios'
import { SIDEBAR_TABS } from '../../components/SidebarProject'
import moment from 'moment'
import { useDispatch } from 'react-redux'
import { setSidebarInformation } from '../../redux/siteSlice'
import { setBreadcrumbPath } from '../../redux/siteSlice'
import { dateFormat, dateFormatForInputField } from '../../utils/CommonUtils'
import $ from "jquery"
import "jquery-validation-unobtrusive"
import { Alert } from '../../components/Alert'
import { deleteProject, updateProject } from '../../services/ProjectService'
import Select from 'react-select'
import azureDevOpsLogo from "../../devops.png"

export const ProjectSettings = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { projectId } = useParams()

  const [projectDetails, setProjectDetails] = useState({
    "id": "",
    "name": "",
    "description": "",
    "dateProjectedStart": "",
    "dateProjectedEnd": "",
    "dateActualStart": "",
    "dateActualEnd": ""
  })

  // Azure stuff
  const selectProjectRef = useRef()
  const [selectedProject, setSelectedProject] = useState({})
  const [isLinked, setIsLinked] = useState(false)
  const [selectedProjectDetails, setSelectProjectDetails] = useState({})
  const [selectOptionsProjects, setSelectOptionsProjects] = useState([])

  const [membersCount, setMembersCount] = useState(0)
  const [milestonesCount, setMilestonesCount] = useState(0)
  const [documentsCount, setDocumentsCount] = useState(0)
  const [riskCount, setRiskCount] = useState(0)

  const [deleteConfirmation, setDeleteConfirmation] = useState("")

  const [originalProjectDetails, setOriginalProjectDetails] = useState({})

  const [azureProjects, setAzureProjects] = useState({
    "count": 0,
    "value": []
  })

  // Enabling and disabling the delete button
  useEffect(() => {
    if (deleteConfirmation == projectDetails["name"]) {
      $("#btn-delete").removeClass("disabled")
    } else {
      $("#btn-delete").addClass("disabled")
    }
  }, [deleteConfirmation, projectDetails])

  // Enable valdiation on the form
  useEffect(() => {
    $.validator.unobtrusive.parse($("#update-project-form"))
    fetchAzureProjects()
  }, [])

  const fetchAzureProjects = async () => {
    let response = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/azure-dev-ops/projects`)
    console.log(response)
    if (response.status == 200) {
      setAzureProjects(response.data)

    }
  }

  useEffect(() => {
    console.log(selectedProject)

    if (selectedProject["value"] != null) {
      let selectedProjectDetails = azureProjects["value"].find(x => x["id"] == selectedProject["value"])
      setSelectProjectDetails(selectedProjectDetails)
    }

  }, [selectedProject])

  useEffect(() => {
    if (azureProjects["count"] > 0) {
      let selectedProject = azureProjects["value"].find(x => x["id"] == projectDetails["azureProjectId"])
      setSelectProjectDetails(selectedProject)

      let options = azureProjects["value"].map(x => ({
        "value": x.id,
        "label": x.name
      }))

      setSelectOptionsProjects(options)
    }
  }, [azureProjects])

  const retrieveProjectDetails = async () => {
    let response = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/${projectId}`)
    let projectDetails = response.data
    console.log(projectDetails)

    if (projectDetails["isCompleted"]) {
      $("#update-project-form input").attr("disabled", true)
      $("#update-project-form textarea").attr("disabled", true)
    }

    setProjectDetails(projectDetails)
    setOriginalProjectDetails(projectDetails)

    // Setting the breadcrumb path
    dispatch(setBreadcrumbPath({
      [projectDetails["name"]]: `/projects/${projectId}`,
      "Settings": ""
    }))

    if (projectDetails["azureProjectId"] != null) {
      setIsLinked(true)
    } else {
      setIsLinked(false)
    }

    // Setting the projectDetails
    dispatch(setSidebarInformation({
      "name": projectDetails["name"],
      "dateProjectedStart": projectDetails["dateProjectedStart"],
      "dateProjectedEnd": projectDetails["dateProjectedEnd"],
      "active": SIDEBAR_TABS.SETTINGS
    }))

    let riskCountResponse = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/${projectId}/risks/count`)
    setRiskCount(riskCountResponse.data)

    let milestoneCountResponse = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/${projectId}/milestones/count`)
    setMilestonesCount(milestoneCountResponse.data)

    let documentCountResponse = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/${projectId}/documents/count`)
    setDocumentsCount(documentCountResponse.data)

    let membersCountResponse = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/${projectId}/members/count`)
    setMembersCount(membersCountResponse.data)
  }

  useEffect(() => {
    // Populating the details on the page
    retrieveProjectDetails()
  }, [projectId])


  // Updating the current details of the project
  const submitUpdateProjectForm = async () => {
    if (!$("#update-project-form").valid()) {
      return
    }

    let currentFormErrors = []

    if (moment(projectDetails["dateProjectedEnd"]) < moment(projectDetails["dateProjectedStart"])) {
      currentFormErrors.push("Projected end date should be later than projected start date.")
    }

    if (moment(projectDetails["dateActualStart"]).isValid()) {
      if (moment(projectDetails["dateProjectedEnd"]) < moment(projectDetails["dateProjectedStart"])) {
        currentFormErrors.push("Actual end date should be later than actual start date.")
      }
    }

    if (currentFormErrors.length > 0) {
      $("#form-errors").html(
        Alert(currentFormErrors.join("<br/>"))
      )
      return
    }

    let updateRequestBody = {
      "id": projectDetails["id"],
      "name": projectDetails["name"],
      "description": projectDetails["description"],
      "dateProjectedStart": projectDetails["dateProjectedStart"],
      "dateProjectedEnd": projectDetails["dateProjectedEnd"],
      "paymentAmount": projectDetails["paymentAmount"],
      "dateActualStart": moment(projectDetails["dateActualStart"]).isValid() ? projectDetails["dateActualStart"] : null,
      "dateActualEnd": moment(projectDetails["dateActualEnd"]).isValid() ? projectDetails["dateActualEnd"] : null
    }

    if (isLinked) {
      updateRequestBody["azureProjectId"] = selectedProject["value"] != "" ? selectedProject["value"] : null
    } else {
      updateRequestBody["azureProjectId"] = null
    }

    let updateSuccessfully = await updateProject(updateRequestBody)

    if (updateSuccessfully) {
      retrieveProjectDetails()
      $("#form-errors").html(Alert("Project has been successfully updated", "success"))
    }
  }

  const submitDeleteProject = async () => {
    let deleteSuccessful = await deleteProject(projectDetails["id"])
    if (deleteSuccessful) {
      navigate("/")
    }
  }

  // TODO: Fixed change tracking for dates
  return (
    <LayoutSidebar>
      <div className='row'>
        <div className=''>
          <div className='mt-3 d-flex justify-content-between'>
            <h5 className="bold align-self-center">Project Details</h5>
            <button className="btn btn-outline-dark font-sm align-self-center" type="button" data-bs-toggle="collapse" data-bs-target="#update-project-form" aria-expanded="true" aria-controls="update-project-form">
              Expand
            </button>
          </div>
          <p className='font-sm'>Update project name, description and its projected and actual dates.</p>

          <form className='collapse show col-lg-9' id='update-project-form'>

            <div id="form-errors">
            </div>

            <div className="row">
              <div className="mb-3 col-12">
                <label className="form-label font-sm">Name</label>

                <div className='d-flex'>

                  <input value={projectDetails["name"]}
                    onInput={e => setProjectDetails(prevState => ({ ...prevState, name: e.target.value }))}
                    data-val-required="Name is required."
                    name="project-name"
                    data-val="true"
                    className={`form-control font-sm h-wrap-content ${projectDetails["isCompleted"] ? "" : "me-2"}`} />


                  {!isLinked && !projectDetails["isCompleted"] &&
                    <>
                      <button type="button" className="btn btn-primary font-sm" style={{ whiteSpace: "nowrap" }} data-bs-toggle="modal" data-bs-target="#linkProject">
                        Link Azure DevOps Project
                      </button>
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
                              <button type="button" className="btn btn-primary font-sm" onClick={e => {
                                setIsLinked(true)
                                $(".close-modal").click()
                              }
                              }>Link</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  }
                  {isLinked && !projectDetails["isCompleted"] &&
                    < button type='button' className='btn btn-light border font-sm h-wrap-content' style={{ "whiteSpace": "nowrap" }} onClick={e => setIsLinked(false)}>Unlink Azure DevOps Project </button>
                  }
                </div>

                <span className="text-danger font-xsm" data-valmsg-for="project-name" data-valmsg-replace="true"></span>
              </div>

              {isLinked && selectedProjectDetails["name"] != null &&
                <div className='mb-3'>
                  <div className='font-sm d-flex'>
                    <img src={azureDevOpsLogo} style={{ width: "32px" }}></img>
                    <span>
                      Project would be linked to <span className='fw-bold'>{selectedProjectDetails["name"]}</span>.
                    </span>
                  </div>
                </div>
              }

              <div className="mb-3 col-12">
                <label className="form-label font-sm">Payment Amount</label>

                <div className="input-group">
                  <span className="input-group-text font-sm">($) SGD</span>
                  <input
                    value={projectDetails["paymentAmount"]}
                    onInput={e => setProjectDetails(prevState => ({ ...prevState, paymentAmount: e.target.value }))}
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
                <input value={dateFormatForInputField(projectDetails["dateProjectedStart"])}
                  onInput={e => setProjectDetails(prevState => ({ ...prevState, dateProjectedStart: e.target.value }))}
                  data-val-required="Projected start date is required."
                  name='projected-start-date'
                  data-val="true"
                  type="date"
                  className="form-control font-sm" />
                <span className="text-danger font-xsm" data-valmsg-for="projected-start-date" data-valmsg-replace="true"></span>
              </div>

              <div className="mb-3 col-6">
                <label className="form-label font-sm">Projected End Date</label>
                <input value={dateFormatForInputField(projectDetails["dateProjectedEnd"])}
                  onInput={e => setProjectDetails(prevState => ({ ...prevState, dateProjectedEnd: e.target.value }))}
                  data-val-required="Projected end date is required."
                  name='projected-end-date'
                  data-val="true"
                  type="date"
                  className="form-control font-sm" />
                <span className="text-danger font-xsm" data-valmsg-for="projected-end-date" data-valmsg-replace="true"></span>
              </div>

              <div className="mb-3 col-12">
                <label className="form-label font-sm">Description</label>
                <textarea value={projectDetails["description"]}
                  onInput={e => setProjectDetails(prevState => ({ ...prevState, description: e.target.value }))}
                  data-val-required="Description is required."
                  name="description"
                  data-val="true"
                  className="form-control font-sm"
                  rows="5" ></textarea>
                <span className="text-danger font-xsm" data-valmsg-for="description" data-valmsg-replace="true"></span>
              </div>

              <div className="mb-3 col-6">
                <label className="form-label font-sm">Actual Start Date (Optional)</label>
                <input value={dateFormatForInputField(projectDetails["dateActualStart"])}
                  onInput={e => setProjectDetails(prevState => ({ ...prevState, dateActualStart: e.target.value }))}
                  type="date"
                  className="form-control font-sm" />
                <span className="text-danger font-xsm"></span>
              </div>

              <div className="mb-4 col-6">
                <label className="form-label font-sm">Actual End Date (Optional)</label>
                <input value={dateFormatForInputField(projectDetails["dateActualEnd"])}
                  onInput={e => setProjectDetails(prevState => ({ ...prevState, dateActualEnd: e.target.value }))}
                  type="date"
                  className="form-control font-sm" />
                <span className="text-danger font-xsm"></span>
              </div>

            </div>

            {!projectDetails["isCompleted"] &&
              <button type="button" id="btn-save-changes" onClick={submitUpdateProjectForm} className="btn btn-primary font-sm me-2 mb-3">Save changes</button>
            }
          </form>

          <hr className='my-3' />

          <div className="d-flex justify-content-between">
            <h5 className='align-self-center mb-0 bold'>Advanced</h5>
            <button className="btn btn-outline-dark font-sm align-self-center" type="button" data-bs-toggle="collapse" data-bs-target="#collapseExample" aria-expanded="false" aria-controls="collapseExample">
              Expand
            </button>
          </div>
          <p className='font-sm'>Exporting, transfer and delete. </p>

          <div className="collapse col-lg-9" id="collapseExample">
            {/* Section to show export options */}
            <div className="card card-body bg-light mb-4">
              <h5 className='bold'>Export project</h5>
              <p className='font-sm'>Export this project and all its relevant data into a PowerPoint Document. When the exported file is ready, you can download it from this page. Please <span className='bold'>do not refresh this page</span> when exporting.</p>

              <br />

              <p className='font-sm'>The following items would be exported:</p>

              <ul className='font-sm'>
                <li>Requirements</li>
                <li>Milestones</li>
                <li>Risks</li>
                <li>Documents</li>
                <li>Project Value</li>
              </ul>

              {/* <p className='font-sm'>The following items would <b>NOT</b> be exported:</p>

              <ul className='font-sm'>
                <li></li>
                <li>Project Members</li>
              </ul> */}

              <a download={true} href={`${process.env.REACT_APP_API_SERVER}/api/projects/documents/${projectId}/slides`} className='btn btn-outline-dark font-sm w-fit-content no-decoration-on-hover'>Export project</a>
            </div>

            {/* Section to allow user to delete project */}
            <div className='card card-body delete-card mb-3'>
              <h6 className='bold'>Delete project</h6>
              <p className='font-sm'>This action deletes <code>{projectDetails["name"]}</code> on {dateFormat(new Date())} and everything this project contains. <b>It is irreversible.</b></p>
              <button type="button" className='btn btn-danger font-sm w-fit-content' data-bs-toggle="modal" data-bs-target="#exampleModal">Delete project</button>

              {/* Delete project modal */}
              <div className="modal fade" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h6 className="modal-title" id="exampleModalLabel">Are you sure?</h6>
                      <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div className="modal-body">
                      <div className='card card-body delete-card mb-3'>
                        <p className='font-sm bold'>You are about to delete this project containing:</p>
                        <ul className='font-sm'>
                          <li>{membersCount} members</li>
                          <li>{milestonesCount} milestones</li>
                          <li>{documentsCount} documents</li>
                          <li>{riskCount} risks</li>
                        </ul>
                      </div>

                      <p className='font-sm mb-0'>Enter the project name to confirm:</p>
                      <code className='font-sm'>{projectDetails["name"]}</code>
                      <input value={deleteConfirmation} onInput={e => setDeleteConfirmation(e.target.value)} className='form-control form-input font-sm mt-3'></input>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-outline-dark font-sm" data-bs-dismiss="modal">Cancel</button>
                      <button type="button" onClick={submitDeleteProject} className="btn btn-danger font-sm disabled" id="btn-delete" data-bs-dismiss="modal">Delete project</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div >
    </LayoutSidebar >
  )
}
