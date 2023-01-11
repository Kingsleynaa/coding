import React, { useEffect, useState } from 'react'
import { dateFormat } from '../../utils/CommonUtils'
import { Link } from "react-router-dom"
import moment from 'moment'
import { MilestoneStatus } from './MilestoneStatus'
import axios from 'axios'
import { getMilestoneById } from '../../services/ProjectService'
import $ from "jquery"

export const RowMilestone = (props) => {
  const [milestoneDetails, setMilestoneDetails] = useState({
    "id": "",
    "name": "",
    "dateProjectedStart": "",
    "dateProjectedEnd": "",
    "progress": 0
  })

  const [milestoneStatus, setMilestoneStatus] = useState("")

  useEffect(() => {
    setMilestoneDetails(props.details)
    getMilestoneProgress()
    getMilestoneStatus()
  }, [props])

  const [incompleteTasks, setIncompleteTasks] = useState([])

  const markComplete = async () => {
    try {
      let markCompleteResponse = await axios.patch(`${process.env.REACT_APP_API_SERVER}/api/milestones/${props.details["id"]}/mark-as-completed`)

      if (markCompleteResponse.status == 200) {
        setMilestoneDetails(prevState => ({ ...prevState, "isCompleted": true }))
        getMilestoneStatus()
      }
    } catch (error) {
      if (error.response.status == 417) {
        console.log(error.response.data)
        setIncompleteTasks(error.response.data)
        $(`#toggleError-${milestoneDetails["id"]}`).click()
      }
    }
  }

  const verifyTasksCompletion = async () => {
    try {
      let verifyResponse = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/milestones/${milestoneDetails["id"]}/verify-tasks`)

      if (verifyResponse.status == 200) {
        $(`#toggleConfirmation-${milestoneDetails["id"]}`).click()
      }
    } catch (error) {
      if (error.response.status == 417) {
        console.log(error.response.data)
        setIncompleteTasks(error.response.data)
        $(`#toggleError-${milestoneDetails["id"]}`).click()
      }
    }
  }

  const getMilestoneStatus = async () => {
    let response = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/milestones/${props.details["id"]}/status`)
    setMilestoneStatus(response.data)
  }

  const markAsPaid = async () => {
    try {
      let response = await axios.patch(`${process.env.REACT_APP_API_SERVER}/api/milestones/${milestoneDetails["id"]}/mark-as-paid`)
      if (response.status == 200) {
        setMilestoneDetails(prevState => ({ ...prevState, "isPaid": true }))
        getMilestoneStatus()
      }
    } catch (error) {
      console.error()
    }
  }

  const getMilestoneProgress = async () => {
    let milestoneProgress = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/milestones/${props.details["id"]}/progress`)
    setMilestoneDetails(prevState => ({ ...prevState, "progress": milestoneProgress.data }))
  }


  return (
    <div className='milestone'>
      <div className="row mb-lg-3 mb-4">
        <div className="col-12 col-lg-5">
          <Link to={milestoneDetails["id"]} className="my-0 bold font-sm text-dark">{milestoneDetails["name"]}</Link>
          <p className="my-0 font-sm text-secondary">{dateFormat(milestoneDetails["dateProjectedStart"])} - {dateFormat(milestoneDetails["dateProjectedEnd"])}</p>
          <span className='font-xsm'>Payment Percentage • <span className='bold'>{milestoneDetails["paymentPercentage"]}%</span></span>
          <br />
          <MilestoneStatus
            status={milestoneStatus}
          />

        </div>

        <div className="col-12 col-lg-4">
          <>
            {milestoneDetails["progress"] > 75 && !milestoneDetails["isCompleted"] &&
              <div className="progress my-1" style={{ height: "7px" }}>
                <div className="progress-bar bg-success" role="progressbar" style={{ width: `${milestoneDetails["progress"]}%` }} aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
              </div>
            }

            {milestoneDetails["progress"] > 40 && milestoneDetails["progress"] <= 75 && !milestoneDetails["isCompleted"] &&
              <div className="progress my-1" style={{ height: "7px" }}>
                <div className="progress-bar bg-warning" role="progressbar" style={{ width: `${milestoneDetails["progress"]}%` }} aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
              </div>
            }

            {milestoneDetails["progress"] <= 40 && !milestoneDetails["isCompleted"] &&
              <div className="progress my-1" style={{ height: "7px" }}>
                <div className="progress-bar bg-danger" role="progressbar" style={{ width: `${milestoneDetails["progress"]}%` }} aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
              </div>
            }

            {!milestoneDetails["isCompleted"] &&
              <p className="text-start font-sm">{milestoneDetails["progress"]}% task completion</p>
            }
          </>
        </div>


        <div className="col-lg-3 col-12 d-flex justify-content-end">
          {milestoneDetails["isCompleted"] && !milestoneDetails["isPaid"] &&
            <button className="btn-light border btn font-sm h-fit-content flex-grow-1 flex-lg-grow-0 me-2" style={{ whiteSpace: "nowrap" }} onClick={markAsPaid}>Mark as paid</button>
          }

          {!milestoneDetails["isCompleted"] &&
            <button className="btn-light border btn font-sm h-fit-content flex-grow-1 flex-lg-grow-0 me-2" style={{ whiteSpace: "nowrap" }} onClick={verifyTasksCompletion}>Mark as completed</button>
          }
        </div>
      </div>

      {/* Confirmation modal to inform the user that milestone can't be edited  */}
      <button type="button" class="btn btn-primary d-none" data-bs-toggle="modal" id={`toggleConfirmation-${milestoneDetails["id"]}`} data-bs-target={`#confirmationModal-${milestoneDetails["id"]}`}>
      </button>

      <div class="modal fade" id={`confirmationModal-${milestoneDetails["id"]}`} tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h6 class="modal-title" id="exampleModalLabel">Are you sure?</h6>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <div class="modal-body font-sm">
              By marking milestone <span className='bold'>{milestoneDetails["name"]}</span> as completed, you will <span className='bold'>not be able to update milestone details</span> other than the payment percentage and amount.
              <br />
              <br />
              This process is <span className='bold'>irreversible</span>.
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-outline-dark font-sm close-modal" data-bs-dismiss="modal">Close</button>

              <button class="btn btn-light border font-sm no-decoration-on-hover" onClick={e => {
                $(".close-modal").click()
                markComplete()
              }}>Mark as completed</button>

            </div>
          </div>
        </div>
      </div>

      {/* Error showing that milestone can't be marked as complete */}
      <button type="button" class="btn btn-primary d-none" data-bs-toggle="modal" id={`toggleError-${milestoneDetails["id"]}`} data-bs-target={`#errorModal-${milestoneDetails["id"]}`}>
      </button>

      <div class="modal fade" id={`errorModal-${milestoneDetails["id"]}`} tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
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
              The following tasks belonging to milestone <span className='bold'>{milestoneDetails["name"]}</span> has not been completed.

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

              <Link to={milestoneDetails["id"]} class="btn btn-primary font-sm no-decoration-on-hover" onClick={e => {
                $(".close-modal").click()
              }}>Go to milestone</Link>

            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
