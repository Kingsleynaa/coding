import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { dateFormat } from '../../utils/CommonUtils'
import $ from "jquery"
import { ProjectStatus } from './ProjectStatus'

const ERROR_TYPE = {
  INCOMPLETE_MILESTONES: "INCOMPLETE_MILESTONES",
  MILESTONE_PAYMENT_SUM_FAILED: "MILESTONE_PAYMENT_SUM_FAILED"
}

export const RowProject = (props) => {
  const PROJECT_STATUS = {
    "ONGOING": "Ongoing",
    "OVERDUE_COMPLETION": "Overdue completion",
    "AWAITING_PAYMENT": "Awaiting payment",
    "PAID": "Paid",
    "OVERDUE_PAYMENT": "Overdue payment"
  }

  // TODO: Touch on project completion, number of members, date updated and the user role in the project
  const [project, setProject] = useState(props["project"])
  const [projectProgress, setProjectProgress] = useState(0)
  const [memberCount, setMemberCount] = useState(0)
  const [isCompleted, setIsCompleted] = useState(props["project"]["isCompleted"])
  const [incompleteMilestones, setIncompleteMilestones] = useState([])
  const [projectStatus, setProjectStatus] = useState("")
  const [errorType, setErrorType] = useState(ERROR_TYPE["INCOMPLETE_MILESTONES"])
  const [projectLead, setProjectLead] = useState({
    "name": ""
  })

  const [milestones, setMilestones] = useState([])

  const [paymentStatus, setPaymentStatus] = useState({})

  const getProjectProgress = async () => {
    let projectProgressResponse = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/${project["id"]}/progress`)
    setProjectProgress(parseInt(projectProgressResponse.data))
  }

  const getMemberCount = async () => {
    let memberCountResponse = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/${project["id"]}/members`)
    setMemberCount(memberCountResponse.data.length)
  }

  const markProjectAsCompleted = async () => {
    try {
      let response = await axios.patch(`${process.env.REACT_APP_API_SERVER}/api/projects/${project["id"]}/mark-as-completed`)

      if (response.status == 200) {
        setIsCompleted(true)
      }
    } catch (error) {
      setIsCompleted(false)
      if (error.response.status == 417) {
        setIncompleteMilestones(error.response.data)
      }
    }
    getProjectStatus()
  }

  const getMilestones = async () => {
    let response = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/${project["id"]}/milestones`)
    if (response.status == 200) {
      setMilestones(response.data)
    }
  }

  const verifyProjectMilestonesCompletion = async () => {
    try {
      let response = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/${project["id"]}/verify-milestones`)
      if (response.status == 200) {
        setIncompleteMilestones([])
        $(`#complete-button-${project["id"]}`).click()
      }
    } catch (error) {
      if (error.response.status == 417) {
        setIncompleteMilestones(error.response.data)
        $(`#incomplete-button-${project["id"]}`).click()
        setErrorType(ERROR_TYPE["INCOMPLETE_MILESTONES"])
      }

      if (error.response.status == 412) {
        setIncompleteMilestones(error.response.data)
        $(`#incomplete-button-${project["id"]}`).click()
        setErrorType(ERROR_TYPE["MILESTONE_PAYMENT_SUM_FAILED"])
      }
    }
  }

  const verifyPaymentInformation = async () => {
    let paymentStatus = await getPaymentInformation()

    if (paymentStatus["paid"] != paymentStatus["total"]) {
      await getMilestones()
      $(`#payment-button-${project["id"]}`).click()
    } else {
      markProjectAsPaid()
    }
  }

  const getPaymentInformation = async () => {
    let response = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/${project["id"]}/payment-information`)

    if (response.status == 200) {
      setPaymentStatus(response.data)
    }

    return response.data
  }


  const getProjectLead = async () => {
    let response = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/${project["id"]}/project-lead`)
    if (response.status == 200) {
      setProjectLead(response.data)
    }
  }

  const getProjectStatus = async () => {
    let response = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/${project["id"]}/status`)
    console.log(response.data)
    setProjectStatus(response.data)
  }

  const getMilestonePaymentPercentageSum = () => {
    let sum = 0
    for (let x of incompleteMilestones) {
      sum += x["PaymentPercentage"]
    }

    return sum
  }

  const markProjectAsPaid = async () => {
    let response = await axios.patch(`${process.env.REACT_APP_API_SERVER}/api/projects/${project["id"]}/mark-as-paid`)
    if (response.status == 200) {
      getProjectStatus()
    }
  }

  useEffect(() => {
    getProjectProgress()
    getProjectStatus()
    getProjectLead()
  }, [])

  return (
    <div className="row mb-3">
      <div className="col-12 col-lg-3">
        <Link to={`/projects/${project.id}`} target="_blank" rel="noopener noreferrer" className='mb-0 no-decoration'>{project.name}</Link>
        <p className="font-sm mb-0">{project.description.substring(0, 30)}...</p>
        <p className='mb-2 font-sm'><ProjectStatus status={projectStatus} /></p>
      </div>

      <div className="col-lg-2 font-sm">
        <span>{projectLead["name"]}</span>
      </div>

      <div className="col-lg-2 font-sm">
        {projectProgress > 75 &&
          <div className="progress my-1" style={{ height: "7px" }}>
            <div className="progress-bar bg-success" role="progressbar" style={{ width: `${projectProgress}%` }} aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
          </div>
        }

        {projectProgress > 40 && projectProgress <= 75 &&
          <div className="progress my-1" style={{ height: "7px" }}>
            <div className="progress-bar bg-warning" role="progressbar" style={{ width: `${projectProgress}%` }} aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
          </div>
        }

        {projectProgress <= 40 &&
          <div className="progress my-1" style={{ height: "7px" }}>
            <div className="progress-bar bg-danger" role="progressbar" style={{ width: `${projectProgress}%` }} aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
          </div>
        }
        <p className="text-start font-sm">{projectProgress}% milestone completion</p>
      </div>


      <div className="col-lg-3 font-sm text-secondary text-sm-center text-lg-center mb-2">Updated on {dateFormat(project["dateUpdated"])}</div>

      <div className="col-lg-2 font-sm text-secondary text-lg-end">
        {!isCompleted &&
          <button className='btn btn-light border font-sm'
            onClick={verifyProjectMilestonesCompletion}>
            Mark as completed
          </button>
        }

        {isCompleted && !project["isPaid"] && projectStatus != "PAID" &&
          <button className='btn btn-light border font-sm'
            onClick={verifyPaymentInformation}>
            Mark as paid
          </button>
        }
      </div>

      <button className='btn btn-outline-dark font-sm d-none'
        id={`incomplete-button-${project["id"]}`}
        data-bs-toggle="modal"
        data-bs-target={`#incomplete-${project["id"]}`}>
      </button>

      <button className='btn btn-outline-dark font-sm d-none'
        id={`complete-button-${project["id"]}`}
        data-bs-toggle="modal"
        data-bs-target={`#complete-${project["id"]}`}>
      </button>

      <button className='btn btn-outline-dark font-sm d-none'
        id={`payment-button-${project["id"]}`}
        data-bs-toggle="modal"
        data-bs-target={`#payment-${project["id"]}`}>
      </button>

      {/* Modal for incomplete tasks */}
      <div className="modal fade" id={`incomplete-${project["id"]}`} tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h6 className="modal-title" id="exampleModalLabel">
                {errorType == ERROR_TYPE["INCOMPLETE_MILESTONES"] &&
                  <span>Incomplete milestones.</span>
                }

                {errorType == ERROR_TYPE["MILESTONE_PAYMENT_SUM_FAILED"] &&
                  <span>Milestone payment percentage does not sum up to 100.</span>
                }
              </h6>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body font-sm">
              {errorType == ERROR_TYPE["INCOMPLETE_MILESTONES"] &&
                <div>
                  All milestones must be completed before its parent project can be marked completed.
                  <br />
                  <br />
                  The following milestone(s) belonging to the project <span className='bold'>{project["name"]}</span> has not been completed.

                  <br />
                  <br />

                </div>
              }

              {errorType == ERROR_TYPE["MILESTONE_PAYMENT_SUM_FAILED"] &&
                <div>
                  The sum of all milestone's payment percentage should be 100%. The current sum of all milestone's payment percentage is <span className='bold'>{getMilestonePaymentPercentageSum()}%</span>
                  <br />
                  <br />
                  The following milestone(s) belongs to the project <span className='bold'>{project["name"]}</span>.

                  <br />
                  <br />

                </div>
              }

              <ul className='font-sm'>
                {incompleteMilestones.map(value => {
                  return (
                    (<li>{value["Name"]} • {value["PaymentPercentage"]}% of payment</li>)
                  )
                })}
              </ul>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-dark font-sm close-modal" data-bs-dismiss="modal">Close</button>
              <Link
                to={`/projects/${project["id"]}/milestones`}
                onClick={e => $(".close-modal").click()}
                className="btn btn-primary font-sm no-decoration-on-hover">Go to milestones</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Modal to show payment status of the project */}
      <div className="modal fade" id={`payment-${project["id"]}`} tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h6 className="modal-title" id="exampleModalLabel">
                Payment status not fufilled
              </h6>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body font-sm">

              <span>Current project payment status</span>

              <ul className='mb-0 mt-2'>
                <li>
                  <span className='font-sm'>Outstanding · <span className='bold'>{paymentStatus["outstanding"] / paymentStatus["total"] * 100}%  (${paymentStatus["outstanding"]})</span></span>
                </li>
                <li>
                  <span className='font-sm'>Paid · <span className='bold'>{paymentStatus["paid"] / paymentStatus["total"] * 100}%  (${paymentStatus["paid"]})</span></span>
                </li>
              </ul>

              <hr />

              <ul>
                {milestones.map(value => {
                  return (
                    (<li>{value["isPaid"] ? "PAID" : "NOT PAID"} - {value["name"]} • {value["paymentPercentage"]}% <span className='bold'>(${paymentStatus["total"] * value["paymentPercentage"] / 100})</span></li>)
                  )
                })}
              </ul>

            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-dark font-sm close-modal" data-bs-dismiss="modal">Close</button>
              <Link
                to={`/projects/${project["id"]}/milestones`}
                onClick={e => $(".close-modal").click()}
                className="btn btn-primary font-sm no-decoration-on-hover">Go to milestones</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for user to confirm marking project as complete */}
      <div className="modal fade" id={`complete-${project["id"]}`} tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h6 className="modal-title" id="exampleModalLabel">Are you sure?</h6>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <div className="modal-body font-sm">
              By marking project <span className='bold'>{project["name"]}</span> as completed, you will <span className='bold'>not be able to update any project details</span> other than the payment status of its milestones.
              <br />
              <br />
              This process is <span className='bold'>irreversible</span>.
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline-dark font-sm close-modal" data-bs-dismiss="modal">Close</button>
              <button className="btn btn-primary font-sm" data-bs-dismiss="modal" onClick={markProjectAsCompleted}>Mark project as completed</button>
            </div>
          </div>
        </div>
      </div>
    </div >
  )
}
