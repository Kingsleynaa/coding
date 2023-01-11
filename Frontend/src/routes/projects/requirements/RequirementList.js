import React, { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import axios from 'axios'
import { setBreadcrumbPath, setSidebarInformation } from '../../../redux/siteSlice'
import { SIDEBAR_TABS } from '../../../components/SidebarProject'
import { LayoutSidebar } from '../../../layouts/LayoutSidebar'
import $ from "jquery"
import "jquery-validation-unobtrusive"

export const RequirementList = () => {
  const dispatch = useDispatch()
  const { projectId } = useParams()
  const [shownRequirements, setShownRequirements] = useState([])
  const [requirementTypes, setRequirementTypes] = useState([])
  const [projectDetails, setProjectDetails] = useState({})

  const [selectedRequirementType, setSelectedRequirementType] = useState({
    "id": "ALL",
    "name": "ALL"
  })

  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const populateBreadcrumb = async () => {
      let projectDetailsResponse = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/${projectId}`)
      let projectDetails = projectDetailsResponse.data
      setProjectDetails(projectDetails)

      // Setting the breadcrumb path
      dispatch(setBreadcrumbPath({
        [projectDetails["name"]]: `/projects/${projectDetails["id"]}`,
        "Requirements": ``,
      }))

      dispatch(setSidebarInformation({
        "name": projectDetails["name"],
        "dateProjectedStart": projectDetails["dateProjectedStart"],
        "dateProjectedEnd": projectDetails["dateProjectedEnd"],
        "active": SIDEBAR_TABS.REQUIREMENTS
      }))
    }

    populateBreadcrumb()
    loadRequirementTypes()
  }, [])

  useEffect(() => {
    searchRequirements()
  }, [searchQuery, selectedRequirementType])

  const searchRequirements = async () => {
    let searchResponse = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/requirements/search?projectId=${projectId}&query=${searchQuery}&scope=${selectedRequirementType["id"]}`)

    if (searchResponse.status == 200) {
      setShownRequirements(searchResponse.data)
    }
  }

  const selectRequirement = (index) => {
    if (projectDetails["isCompleted"]) {
      return
    }

    let currentRequirements = shownRequirements.slice()

    if (currentRequirements[index].selected == null || currentRequirements[index].selected == undefined) {
      currentRequirements[index].selected = true
      setShownRequirements(currentRequirements)
      return
    }

    currentRequirements[index].selected = !currentRequirements[index].selected
    setShownRequirements(currentRequirements)
  }

  const loadRequirementTypes = async () => {
    let response = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/requirements/types`)
    setRequirementTypes(response.data)
  }

  useEffect(() => {
    for (let i of shownRequirements) {
      if (i.selected) {
        setRemoveButtonDisabled(false)
        return
      }
    }

    setRemoveButtonDisabled(true)
  }, [shownRequirements])

  // Requirement form data
  const requirementName = useRef("")
  const requirementDesc = useRef("")
  const requirementType = useRef("")

  const [selectedRequirement, setSelectedRequirement] = useState({})

  const addRequirement = async () => {
    if (!$("#add-requirement-form").valid()) {
      return
    }

    let data = {
      "projectId": projectId,
      "name": requirementName.current.value,
      "description": requirementDesc.current.value,
      "requirementTypeId": requirementType.current.value
    }

    let response = await axios.post(`${process.env.REACT_APP_API_SERVER}/api/projects/requirements`, data)
    if (response.status == 200) {
      requirementName.current.value = ""
      requirementDesc.current.value = ""
      searchRequirements()
    }

    $("#exampleModal .close").click()
  }

  const deleteRequirements = async () => {
    let selectedRequirementsIdList = shownRequirements.filter(x => x.selected).map(x => x.id)
    let deleteRequirementResponse = await axios.delete(`${process.env.REACT_APP_API_SERVER}/api/projects/requirements`, {
      "data": selectedRequirementsIdList
    })

    if (deleteRequirementResponse.status == 200) {
      searchRequirements()
    }
  }

  const [removeButtonDisabled, setRemoveButtonDisabled] = useState(true)

  const saveChangesToRequirement = async () => {
    if (!$("#edit-requirement-form").valid()) {
      return
    }

    let data = {
      "id": selectedRequirement["id"],
      "name": selectedRequirement["name"],
      "description": selectedRequirement["description"],
      "requirementTypeId": selectedRequirement["requirementTypeId"]
    }

    let editRequirementResponse = await axios.put(`${process.env.REACT_APP_API_SERVER}/api/projects/requirements/${selectedRequirement["id"]}`, data)

    if (editRequirementResponse.status == 200) {
      searchRequirements()
    }

    $("#requirement-modal .close").click()
  }

  useEffect(() => {
    $.validator.unobtrusive.parse($("#edit-requirement-form"))
    $.validator.unobtrusive.parse($("#add-requirement-form"))
  }, [])

  return (
    <LayoutSidebar>
      <div className="d-flex justify-content-between border-bottom flex-wrap">
        <div className="d-flex order-2 order-lg-1 flex-grow-1 flex-md-grow-1">
          <span className={`nav-link font-sm milestones-scope text-dark cursor-pointer ${selectedRequirementType["name"] == "ALL" ? "bold active" : ""}`} onClick={e => setSelectedRequirementType({ "id": "ALL", "name": "ALL" })} href="#">All</span>

          {requirementTypes.map(value => {
            return (
              <span className={`nav-link font-sm milestones-scope text-dark cursor-pointer ${selectedRequirementType["name"] == value["name"] ? "bold active" : ""}`} onClick={e => setSelectedRequirementType(value)} href="#">{value["name"]}</span>
            )
          })}
        </div>

        <div className="d-flex order-1 order-lg-2 col-12 col-lg-2 justify-content-end">
          {!projectDetails["isCompleted"] &&
            <button
              data-bs-toggle="modal"
              data-bs-target="#exampleModal"
              className="btn btn-primary no-decoration-on-hover my-1 font-sm pt-2 flex-lg-grow-0 flex-grow-1 h-wrap-content align-self-center w-auto"
              style={{ whiteSpace: "nowrap" }}>
              New Requirement
            </button>
          }
        </div>
      </div>


      <div className='d-flex py-2 border-bottom mb-2 flex-wrap justify-content-between'>
        {!projectDetails["isCompleted"] &&
          <button className='btn btn-danger font-sm h-wrap-content align-self-center' data-bs-toggle="modal" data-bs-target="#delete-modal" disabled={removeButtonDisabled}>Remove</button>
        }

        <input className="form-control font-sm h-wrap-content align-self-center w-auto" placeholder="Search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
      </div>

      {shownRequirements.map((value, index) => {
        return (
          <div className={`requirement rounded p-2 ${value.selected ? "bg-light" : ""}`} id={`requirement-${value["id"]}`} onClick={e => selectRequirement(index)}>
            <div className="row gx-4 justify-content-between">

              <div className="col-12 col-lg-3">
                <form className={`${projectDetails["isCompleted"] ? "" : "form-check"}`}>
                  {!projectDetails["isCompleted"] &&
                    <input type="checkbox" checked={value.selected} className="form-check-input me-3" />
                  }
                  <p className="my-0 font-sm bold">{value["name"]}</p>
                </form>
              </div>

              <div className="col-12 col-lg-2">
                <span className='badge rounded-pill bg-light text-dark' style={{ fontWeight: 500 }}>{value["requirementType"]}</span>
              </div>

              <div className="col-12 col-lg-5">
                <p className="my-0 font-sm" style={{ wordWrap: "break-word" }}>{value["description"]}</p>
              </div>

              {!projectDetails["isCompleted"] &&
                <div className="col-12 col-lg-2 text-end">
                  <button className='btn btn-outline-dark font-sm px-4 h-wrap-content py-1'
                    data-bs-toggle="modal"
                    data-bs-target="#requirement-modal"
                    onClick={e => {
                      selectRequirement(index)
                      setSelectedRequirement(value)
                    }}>
                    Edit
                  </button>
                </div>
              }
            </div>
          </div>
        )
      })
      }

      <div className="modal fade" id="exampleModal" tabIndex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h6 className="modal-title bold" id="exampleModalLabel">New Requirement</h6>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body font-sm">
              <form id='add-requirement-form'>

                <div className='mb-3'>
                  <label className='form-label'>Name</label>

                  <input
                    data-val-required="Name is required."
                    name="requirement-name"
                    data-val="true"
                    className='form-control font-sm'
                    ref={requirementName}></input>

                  <span className="text-danger font-xsm"
                    data-valmsg-for="requirement-name"
                    data-valmsg-replace="true">
                  </span>

                </div>

                <label className='form-label'>Type</label>

                <select class="form-select font-sm mb-3" ref={requirementType}>
                  {requirementTypes.map(value => {
                    return (<option value={value["id"]}>{value["name"]}</option>)
                  })}
                </select>

                <label className='form-label'>Description</label>
                <textarea
                  data-val-required="Description is required."
                  name="requirement-description"
                  data-val="true"
                  className='form-control font-sm'
                  rows={5} ref={requirementDesc}></textarea>
                <span className="text-danger font-xsm" data-valmsg-for="requirement-description" data-valmsg-replace="true"></span>
              </form>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline-dark font-sm close" data-bs-dismiss="modal">Close</button>
              <button type="button" className="btn btn-primary font-sm" onClick={addRequirement}>Add Requirement</button>
            </div>
          </div>
        </div>
      </div>

      <div class="modal fade" id="delete-modal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h6 class="modal-title" id="exampleModalLabel">Are you sure?</h6>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body font-sm">
              You're about to permamently delete the following requirements from the project. <span className='bold'>This process is irreversible.</span>
              <br />
              <br />

              <ul className='font-sm'>
                {shownRequirements.map(value => {
                  if (value.selected) {
                    return (<li>{value["name"]}</li>)
                  }
                })}

              </ul>

            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-dark font-sm" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-danger font-sm" data-bs-dismiss="modal" onClick={deleteRequirements}>Delete requirements</button>
            </div>
          </div>
        </div>
      </div>

      <div class="modal fade" id="requirement-modal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h6 class="modal-title bold" id="exampleModalLabel">Requirement Details</h6>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body font-sm">

              <form id="edit-requirement-form">
                <div className='mb-3'>
                  <label className='form-label'>Name</label>
                  <input
                    data-val-required="Name is required."
                    name="requirement-name"
                    data-val="true"
                    className='form-control font-sm'
                    onChange={e => setSelectedRequirement(prevState => ({ ...prevState, "name": e.target.value }))}
                    value={selectedRequirement["name"]}></input>

                  <span className="text-danger font-xsm"
                    data-valmsg-for="requirement-name"
                    data-valmsg-replace="true">
                  </span>
                </div>

                <label className='form-label'>Type</label>

                <select class="form-select font-sm mb-3" onChange={e => setSelectedRequirement(prevState => ({ ...prevState, "requirementTypeId": e.target.value }))} value={selectedRequirement["requirementTypeId"]}>
                  {requirementTypes.map(value => {
                    return (<option value={value["id"]}>{value["name"]}</option>)
                  })}
                </select>


                <div>
                  <label className='form-label'>Description</label>

                  <textarea
                    data-val-required="Description is required."
                    name="requirement-description"
                    data-val="true"
                    className='form-control font-sm'
                    onChange={e => setSelectedRequirement(prevState => ({ ...prevState, "description": e.target.value }))}
                    rows={5}
                    value={selectedRequirement["description"]}></textarea>
                  <span className="text-danger font-xsm" data-valmsg-for="requirement-description" data-valmsg-replace="true"></span>
                </div>
              </form>

            </div>

            <div class="modal-footer">
              <button type="button" className="btn btn-outline-dark font-sm close" data-bs-dismiss="modal">Cancel</button>
              <button type="button" className="btn btn-primary font-sm me-2" onClick={saveChangesToRequirement}>Save changes</button>
            </div>

          </div>
        </div>
      </div>

    </LayoutSidebar>
  )
}
