import React, { useEffect, useState, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { LayoutSidebar } from '../../../layouts/LayoutSidebar'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { setBreadcrumbPath, setSidebarInformation } from '../../../redux/siteSlice'
import { getMilestoneById } from '../../../services/ProjectService'
import { dateFormat } from '../../../utils/CommonUtils'
import { SIDEBAR_TABS } from '../../../components/SidebarProject'
import moment from 'moment'
import { MilestoneStatus } from '../../../components/projects/MilestoneStatus'
import { ProjectCompletionMarker } from '../../../components/projects/ProjectCompletionMarker'
import $ from "jquery"
import "jquery-validation-unobtrusive"
import { Alert } from '../../../components/Alert'
import Chart from 'chart.js/auto';

const FILTER_OPTIONS = {
  "ALL": "ALL",
  "COMPLETED": "COMPLETED",
  "ONGOING": "ONGOING"
}

Object.freeze(FILTER_OPTIONS)

export const MilestoneDetails = () => {
  const dispatch = useDispatch()
  const { projectId, milestoneId } = useParams()
  const [taskList, setTaskList] = useState([])
  const navigate = useNavigate()
  const [incompleteTasks, setIncompleteTasks] = useState([])
  const [paymentStatus, setPaymentStatus] = useState({})

  const [milestoneStatus, setMilestoneStatus] = useState("")
  const newPaymentPercentageRef = useRef()

  // Searching and filtering for tasks
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTaskFilter, setSelectedTaskFilter] = useState(FILTER_OPTIONS["ALL"])

  const [projectDetails, setProjectDetails] = useState({
    "id": "",
    "name": ""
  })

  const [milestoneDetails, setMilestoneDetails] = useState({})

  useEffect(() => {
    const loadPageInformation = async () => {
      let projectDetailsResponse = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/${projectId}`)
      let projectDetails = projectDetailsResponse.data
      setProjectDetails(projectDetails)

      let currentMilestoneDetails = await getMilestoneById(milestoneId)
      setMilestoneDetails(currentMilestoneDetails)

      // Setting the breadcrumb path
      dispatch(setBreadcrumbPath({
        [projectDetails["name"]]: `/projects/${projectId}`,
        "Milestones": `/projects/${projectId}/milestones`,
        [currentMilestoneDetails["name"]]: ``
      }))

      dispatch(setSidebarInformation({
        "name": projectDetails["name"],
        "dateProjectedStart": projectDetails["dateProjectedStart"],
        "dateProjectedEnd": projectDetails["dateProjectedEnd"],
        "active": SIDEBAR_TABS.MILESTONES
      }))
    }

    loadPageInformation()
    getMilestoneStatus()
    getPaymentInformation()

  }, [projectId, milestoneId])

  const searchTasks = async () => {
    let tasksResponse = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/milestones/tasks/search?milestoneId=${milestoneId}&query=${searchQuery}&scope=${selectedTaskFilter}`)
    setTaskList(tasksResponse.data)
  }

  useEffect(() => {
    $.validator.unobtrusive.parse($("#new-payment-amount-form"))
  }, [milestoneDetails])

  useEffect(() => {
    searchTasks()
  }, [searchQuery, selectedTaskFilter])

  const getPaymentInformation = async () => {
    let response = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/${projectId}/payment-information`)
    if (response.status == 200) {
      setPaymentStatus(response.data)
    }

    return response.data
  }

  const loadMilestoneDetails = async () => {
    let currentMilestoneDetails = await getMilestoneById(milestoneId)
    setMilestoneDetails(currentMilestoneDetails)
    return
  }

  const deleteMilestone = async () => {
    let milestoneDeleteResponse = await axios.delete(`${process.env.REACT_APP_API_SERVER}/api/milestones/${milestoneId}`)
    if (milestoneDeleteResponse.status == 200) {
      navigate(`/projects/${projectId}/milestones`)
    }
  }

  const markComplete = async () => {
    try {
      let markCompleteResponse = await axios.patch(`${process.env.REACT_APP_API_SERVER}/api/milestones/${milestoneId}/mark-as-completed`)
      if (markCompleteResponse.status == 200) {
        loadMilestoneDetails()
        getMilestoneStatus()
      }
    } catch (error) {
      if (error.response.status == 417) {
        setIncompleteTasks(error.response.data)
        $(".open-modal").click()
      }
    }
  }

  const markTaskAsCompleted = async (taskId) => {
    let markTaskAsCompleteResponse = await axios.patch(`${process.env.REACT_APP_API_SERVER}/api/milestones/tasks/${taskId}/mark-as-completed`)
    if (markTaskAsCompleteResponse.status == 200) {
      searchTasks()
    }
  }

  const unmarkTaskAsCompleted = async (taskId) => {
    let unmarkTaskAsCompleteResponse = await axios.patch(`${process.env.REACT_APP_API_SERVER}/api/milestones/tasks/${taskId}/unmark-as-completed`)
    if (unmarkTaskAsCompleteResponse.status == 200) {
      searchTasks()
    }
  }

  const getMilestoneStatus = async () => {
    let response = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/milestones/${milestoneId}/status`)
    setMilestoneStatus(response.data)
  }

  return (
    <LayoutSidebar>
      <div className="py-3 border-bottom d-flex justify-content-between flex-wrap flex-lg-nowrap">
        <div className="d-flex align-items-center">

          <MilestoneStatus
            status={milestoneStatus}
          />

          <h6 className="mb-0 font-sm ms-2">Created on {dateFormat(milestoneDetails["dateCreated"])}</h6>
        </div>


        <div className="d-flex flex-grow-1 flex-sm-grow-0 flex-lg-grow-0 flex-md-grow-0 mt-2 mt-lg-0">

          {!milestoneDetails["isCompleted"] &&
            <button className="btn-light border btn font-sm h-fit-content flex-grow-1 flex-lg-grow-0 me-2" style={{ whiteSpace: "nowrap" }} onClick={markComplete}>Mark as completed</button>
          }

          {/* Hiding delete button if milestone is marked as completed. */}
          {/* Also hides edit button if milestone is completed. */}

          {
            !milestoneDetails["isCompleted"] &&
            <>
              <Link to={"edit"} className="btn-outline-dark btn font-sm h-fit-content flex-grow-1 flex-lg-grow-0 me-2 no-decoration-on-hover">Edit</Link>
              <button className="btn-danger btn font-sm h-fit-content flex-grow-1 flex-lg-grow-0" data-bs-toggle="modal" data-bs-target="#exampleModal">Delete</button>
              <div class="modal fade" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                  <div class="modal-content">
                    <div class="modal-header">
                      <h6 class="modal-title" id="exampleModalLabel">Are you sure?</h6>
                      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>

                    <div class="modal-body font-sm">
                      You're about to permamently delete milestone <span className='bold'>{milestoneDetails["name"]}.
                      </span> <span>This process is <span className='bold'>irreversible</span>.</span>
                    </div>

                    <div class="modal-footer">
                      <button type="button" class="btn btn-outline-dark font-sm" data-bs-dismiss="modal">Cancel</button>
                      <button type="button" class="btn btn-danger font-sm" data-bs-dismiss="modal" onClick={deleteMilestone}>Delete milestone</button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          }
        </div >
      </div >

      {
        milestoneDetails["isCompleted"] &&
        <div className='d-flex py-3 border-bottom delete-card ps-3' style={{ color: "#721c24" }}>
          <i className='fa fa-lock align-self-center font-sm me-2'></i> <span className='align-self-center font-sm'><span className='fw-bold'>Milestone has been locked</span> due to being marked as completed, only editing of its payment amount is allowed.</span>
        </div>
      }

      < div className="py-3 border-bottom" >
        <h4 className='bold mb-0'>
          {milestoneDetails["name"]}
        </h4>
        <p className="font-sm text-secondary mb-0">Milestone ID: {milestoneDetails["id"]}</p>

        <span className='align-self-center font-sm' data-bs-toggle="tooltip" data-bs-placement="top" title="Payment percentage for project.">
          Payment Amount • <span className='bold'>${projectDetails["paymentAmount"] * milestoneDetails["paymentPercentage"] / 100} ({milestoneDetails["paymentPercentage"]}%)</span> of the total <span className='bold'>(${projectDetails["paymentAmount"]})</span>
        </span>

        <div id="projected-dates" className="row mb-4 mt-3 gy-3">
          <div className="col-lg-3 col-sm-12 col-md-6">
            <span className="font-xsm">Projected Start Date</span><br />
            <span className="font-xsm bold">{dateFormat(milestoneDetails["dateProjectedStart"])}</span>
          </div>
          <div className="col-lg-3 col-sm-12 col-md-6">
            <span className="font-xsm">Projected End Date</span><br />
            <span className="font-xsm bold">{dateFormat(milestoneDetails["dateProjectedEnd"])}</span>
          </div>
          <div className="col-lg-3 col-sm-12 col-md-6">
            <span className="font-xsm">Actual Start Date</span><br />
            <span className="font-xsm bold">{dateFormat(milestoneDetails["dateActualStart"])}</span>
          </div>
          <div className="col-lg-3 col-sm-12 col-md-6">
            <span className="font-xsm">Actual End Date</span><br />
            <span className="font-xsm bold">{dateFormat(milestoneDetails["dateActualEnd"])}</span>
          </div>
        </div>

        <p className="font-sm">{milestoneDetails["description"]}</p>
      </div >

      {/* Task section */}

      < div className="d-flex justify-content-between border-bottom align-content-center" >
        <div className="d-flex">
          <span onClick={e => setSelectedTaskFilter(FILTER_OPTIONS["ALL"])} className={`nav-link font-sm milestones-scope text-dark cursor-pointer ${selectedTaskFilter == FILTER_OPTIONS["ALL"] ? "active bold" : ""}`}>All</span>
          <span onClick={e => setSelectedTaskFilter(FILTER_OPTIONS["ONGOING"])} className={`nav-link font-sm milestones-scope text-dark cursor-pointer ${selectedTaskFilter == FILTER_OPTIONS["ONGOING"] ? "active bold" : ""}`}>Ongoing</span>
          <span onClick={e => setSelectedTaskFilter(FILTER_OPTIONS["COMPLETED"])} className={`nav-link font-sm milestones-scope text-dark cursor-pointer ${selectedTaskFilter == FILTER_OPTIONS["COMPLETED"] ? "active bold" : ""}`}>Completed</span>
        </div>

        {
          !milestoneDetails["isCompleted"] &&
          <Link to={"tasks/new"} className="btn btn-primary no-decoration-on-hover font-sm h-fit-content align-self-center" style={{ whiteSpace: "nowrap" }}>
            New Task
          </Link>
        }
      </div >

      <div className='d-flex border-bottom py-2 mb-2'>
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className='form-control font-sm w-auto'
          placeholder='Search'></input>
      </div>

      {
        taskList.map(task => {
          return <div className="task row mb-3">
            <div className="col-12 col-lg-5">
              <Link to={task["id"]} className="my-0 bold font-sm text-dark">{task["name"]}</Link>
              <p className="my-0 font-sm text-secondary">Created on {dateFormat(task["dateCreated"])}</p>
              <p className='mb-0'>
                {task["isCompleted"] &&
                  <span className="badge bg-success text-white h-fit-content me-2 fw-normal">Completed</span>
                }

                {!task["isCompleted"] &&
                  <span className="badge bg-primary text-light h-fit-content me-2 fw-normal">Ongoing</span>
                }
              </p>

            </div>

            <div className="col-12 col-lg-4">
            </div>


            {!milestoneDetails["isCompleted"] &&
              <div className="col-12 col-lg-3 text-end">
                {!task["isCompleted"] &&
                  <button onClick={e => markTaskAsCompleted(task["id"])} className="btn btn-light border font-sm h-fit-content">Mark as completed</button>
                }

                {task["isCompleted"] &&
                  <button onClick={e => unmarkTaskAsCompleted(task["id"])} className="btn btn-light border font-sm h-fit-content" style={{ whiteSpace: "nowrap" }}>Unmark as completed</button>
                }
              </div>
            }
          </div>

        })
      }

      <button type="button" class="btn btn-primary d-none open-modal" data-bs-toggle="modal" data-bs-target="#incompleteTasks">
      </button>

      <div class="modal fade" id="incompleteTasks" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h6 class="modal-title" id="exampleModalLabel">Incompleted tasks.</h6>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body font-sm">
              All tasks must be completed before its parent milestone can be marked completed.
              <br />
              <br />
              The following task(s) belonging to the milestone <span className='bold'>{milestoneDetails["name"]}</span> has not been completed.

              <br />
              <br />

              <ul className='font-sm'>
                {incompleteTasks.map(value => {
                  return (
                    (<li>{value["Name"]}</li>)
                  )
                })}
              </ul>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-dark font-sm close-modal" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>


    </LayoutSidebar >
  )
}
